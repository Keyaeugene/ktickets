import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

interface MpesaB2CCallbackData {
  Result:  {
    ResultType: number;
    ResultCode: number;
    ResultDesc: string;
    OriginatorConversationID: string;
    ConversationID: string;
    TransactionID: string;
    ResultParameters?: {
      ResultParameter: Array<{
        Key: string;
        Value: string | number;
      }>;
    };
    ReferenceData?: {
      ReferenceItem: Array<{
        Key: string;
        Value: string;
      }>;
    };
  };
}

export async function POST(req: Request) {
  console.log("M-Pesa B2C callback received at:", new Date().toISOString());

  try {
    const body = (await req.json()) as MpesaB2CCallbackData;
    console.log("B2C Callback body:", JSON. stringify(body, null, 2));

    const { Result } = body;
    const {
      ResultCode,
      ResultDesc,
      ConversationID,
      TransactionID,
      ResultParameters,
    } = Result;

    console.log(
      `M-Pesa B2C Result: Code=${ResultCode}, Desc=${ResultDesc}, TransactionID=${TransactionID}`
    );

    const convex = getConvexClient();

    // Find the ticket by ConversationID
    const ticket = await convex.query(api.tickets.getByRefundConversationId, {
      conversationId: ConversationID,
    });

    if (!ticket) {
      console.error(`Ticket not found for ConversationID: ${ConversationID}`);
      return new Response(
        JSON.stringify({
          ResultCode: 1,
          ResultDesc: "Ticket not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ResultCode 0 means success
    if (ResultCode === 0) {
      console.log(`Refund successful for ticket ${ticket._id}`);

      // Extract refund details
      const resultParams:  Record<string, any> = {};
      ResultParameters?.ResultParameter?. forEach((param) => {
        resultParams[param.Key] = param.Value;
      });

      const refundMetadata = {
        transactionId: TransactionID,
        transactionAmount:  resultParams.TransactionAmount || ticket.amount,
        transactionReceipt: resultParams.TransactionReceipt || TransactionID,
        recipientPhoneNumber: 
          resultParams.ReceiverPartyPublicName || ticket. phoneNumber,
        b2CUtilityAccountAvailableFunds: 
          resultParams.B2CUtilityAccountAvailableFunds,
        b2CWorkingAccountAvailableFunds: 
          resultParams.B2CWorkingAccountAvailableFunds,
        transactionCompletedDateTime:
          resultParams.TransactionCompletedDateTime || new Date().toISOString(),
      };

      console.log("Refund metadata:", refundMetadata);

      // Update ticket status to refunded
      await convex. mutation(api.tickets.updateTicketRefundStatus, {
        ticketId: ticket._id,
        status: "refunded",
        refundTransactionId:  TransactionID,
        refundMetadata,
        refundCompletedAt: new Date().toISOString(),
      });

      console.log(
        `Ticket ${ticket._id} refunded successfully. Amount: KES ${refundMetadata.transactionAmount}`
      );
    } else {
      // Refund failed
      console.error(
        `Refund failed for ticket ${ticket._id}: ${ResultDesc} (Code: ${ResultCode})`
      );

      await convex.mutation(api.tickets.updateTicketRefundStatus, {
        ticketId: ticket._id,
        status: "refund_failed",
        refundError: ResultDesc,
        refundErrorCode: ResultCode,
        refundFailedAt: new Date().toISOString(),
      });

      console.error(`ADMIN ALERT: Manual refund required for ticket ${ticket._id}`);
    }

    // Acknowledge receipt to M-Pesa
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
      {
        status:  200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("B2C webhook processing error:", error);
    return new Response(
      JSON.stringify({ ResultCode: 1, ResultDesc: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
