import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

interface MpesaB2CTimeoutData {
  Result: {
    ResultType: number;
    ResultCode: number;
    ResultDesc: string;
    OriginatorConversationID:  string;
    ConversationID: string;
    TransactionID: string;
  };
}

export async function POST(req: Request) {
  console.log("M-Pesa B2C timeout received at:", new Date().toISOString());

  try {
    const body = (await req.json()) as MpesaB2CTimeoutData;
    console.log("B2C Timeout body:", JSON.stringify(body, null, 2));

    const { Result } = body;
    const { ConversationID, ResultDesc } = Result;

    const convex = getConvexClient();

    // Find the ticket by ConversationID
    const ticket = await convex.query(api.tickets.getByRefundConversationId, {
      conversationId: ConversationID,
    });

    if (!ticket) {
      console.error(`Ticket not found for ConversationID: ${ConversationID}`);
      return new Response(
        JSON.stringify({ ResultCode: 1, ResultDesc: "Ticket not found" }),
        { status: 404, headers: { "Content-Type":  "application/json" } }
      );
    }

    // Mark refund as timed out
    await convex. mutation(api.tickets.updateTicketRefundStatus, {
      ticketId: ticket._id,
      status: "refund_timeout",
      refundError: ResultDesc || "Request timed out",
      refundFailedAt: new Date().toISOString(),
    });

    console.error(
      `ADMIN ALERT: Refund timed out for ticket ${ticket._id}. Manual intervention required.`
    );

    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
      {
        status: 200,
        headers:  { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("B2C timeout processing error:", error);
    return new Response(
      JSON.stringify({ ResultCode: 1, ResultDesc: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}