"use server";

import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export type RefundResult = {
  success: boolean;
  totalTickets: number;
  successfulRefunds: number;
  failedRefunds: number;
  pendingRefunds: number;
  errors?: Array<{ ticketId: string; error: string }>;
};

export async function refundEventTickets(
  eventId: Id<"events">
): Promise<RefundResult> {
  const convex = getConvexClient();

  // Get event details
  const event = await convex.query(api.events.getById, { eventId });
  if (!event) throw new Error("Event not found");

  // Check if event is already canceled
  if (event.is_cancelled) {
    throw new Error("Event is already canceled");
  }

  // Get all valid tickets for this event
  const tickets = await convex.query(api. tickets.getValidTicketsForEvent, {
    eventId,
  });

  if (tickets.length === 0) {
    // No tickets to refund, just cancel the event
    await convex. mutation(api.events.cancelEvent, { eventId });
    return {
      success: true,
      totalTickets: 0,
      successfulRefunds: 0,
      failedRefunds:  0,
      pendingRefunds: 0,
    };
  }

  // M-Pesa B2C API configuration
  const mpesaConfig = {
    consumerKey: process.env. MPESA_CONSUMER_KEY! ,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
    shortcode: process.env.MPESA_SHORTCODE!,
    initiatorName: process.env. MPESA_INITIATOR_NAME!,
    securityCredential: process.env. MPESA_SECURITY_CREDENTIAL!,
    baseUrl: 
      process.env.NODE_ENV === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke",
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/b2c/callback`,
    timeoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/b2c/timeout`,
  };

  // Get M-Pesa access token
  const getAccessToken = async (): Promise<string> => {
    const auth = Buffer.from(
      `${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`
    ).toString("base64");

    const response = await fetch(
      `${mpesaConfig.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const data = await response.json();
    return data.access_token;
  };

  // M-Pesa B2C refund function
  const initiateB2CRefund = async (
    amount: number,
    phoneNumber: string,
    remarks: string,
    occasion: string
  ) => {
    const token = await getAccessToken();

    const response = await fetch(
      `${mpesaConfig.baseUrl}/mpesa/b2c/v1/paymentrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          InitiatorName: mpesaConfig.initiatorName,
          SecurityCredential:  mpesaConfig.securityCredential,
          CommandID: "BusinessPayment",
          Amount: amount,
          PartyA: mpesaConfig.shortcode,
          PartyB: phoneNumber,
          Remarks: remarks,
          QueueTimeOutURL: mpesaConfig.timeoutUrl,
          ResultURL: mpesaConfig.callbackUrl,
          Occasion:  occasion,
        }),
      }
    );

    return await response.json();
  };

  // Process refunds for each ticket
  const results = await Promise.allSettled(
    tickets.map(async (ticket) => {
      try {
        if (!ticket.mpesaReceiptNumber) {
  throw new Error("M-Pesa payment information not found");
}

        if (!ticket.phoneNumber) {
  throw new Error("Customer phone number not found");
}

        // Check if ticket is already refunded to ensure idempotency
        if (ticket.status === "refunded" || ticket.status === "refund_pending") {
          return { success: true, ticketId: ticket._id, skipped: true };
        }

        // Initiate M-Pesa B2C refund
        const refundResponse = await initiateB2CRefund(
  ticket.amount || 0,
  ticket.phoneNumber,
  `Refund for event: ${event.name}`,
  `Event canceled - Ticket #${ticket._id}`
);
        // Check if refund request was accepted
        if (refundResponse. ResponseCode !== "0") {
          throw new Error(
            refundResponse.ResponseDescription || "Refund request failed"
          );
        }

        // M-Pesa B2C is asynchronous, so we mark as pending
        await convex. mutation(api.tickets.updateTicketStatus, {
          ticketId: ticket._id,
          status: "refund_pending",
          refundConversationId: refundResponse. ConversationID,
          refundOriginatorConversationId: 
            refundResponse. OriginatorConversationID,
        });

        return {
          success: true,
          ticketId: ticket._id,
          pending: true,
          conversationId: refundResponse.ConversationID,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to refund ticket ${ticket._id}: `, error);
        return {
          success: false,
          ticketId: ticket._id,
          error: errorMessage,
        };
      }
    })
  );

  // Analyze results
  const successfulRefunds = results.filter(
    (result) => result.status === "fulfilled" && result.value.success
  );
  const failedRefunds = results.filter(
    (result) =>
      result.status === "rejected" ||
      (result.status === "fulfilled" && ! result.value.success)
  );

  const errors = failedRefunds.map((result) => {
    if (result.status === "rejected") {
      return {
        ticketId: "unknown",
        error: result.reason?. toString() || "Unknown error",
      };
    }
    return {
      ticketId: result. value.ticketId,
      error: result.value.error || "Unknown error",
    };
  });

  // Cancel event if all refund requests were initiated successfully
  if (failedRefunds.length === 0) {
    try {
      await convex.mutation(api.events.cancelEvent, { eventId });
    } catch (error) {
      console.error("Failed to cancel event after refunds:", error);
      throw new Error(
        "All refund requests initiated but event cancellation failed.  Please contact support."
      );
    }

    return {
      success: true,
      totalTickets: tickets.length,
      successfulRefunds:  0, // Will be updated by webhook
      failedRefunds: 0,
      pendingRefunds: successfulRefunds.length,
    };
  }

  // Partial failure - return detailed error information
  console.error(
    `Refund operation partially failed:  ${successfulRefunds.length}/${tickets.length} initiated`
  );

  return {
    success: false,
    totalTickets: tickets.length,
    successfulRefunds: 0,
    failedRefunds: failedRefunds.length,
    pendingRefunds: successfulRefunds.length,
    errors,
  };
}