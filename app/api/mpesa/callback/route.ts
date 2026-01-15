import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

interface MpesaCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

interface MpesaPaymentMetadata {
  Amount: number;
  MpesaReceiptNumber: string;
  TransactionDate: string;
  PhoneNumber: string;
}

export async function POST(req:  Request) {
  console.log("M-Pesa webhook received at:", new Date().toISOString());

  try {
    const body = (await req. json()) as MpesaCallbackData;
    console.log("Webhook body received:", JSON.stringify(body, null, 2));

    const { stkCallback } = body. Body;
    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = stkCallback;

    // Log the result
    console.log(`M-Pesa Payment Result: Code=${ResultCode}, Desc=${ResultDesc}`);

    const convex = getConvexClient();

    // ResultCode 0 means success
    if (ResultCode === 0 && CallbackMetadata) {
      console.log("Payment successful, processing.. .");

      // Extract payment details from callback metadata
      const callbackItems = CallbackMetadata.Item;
      const metadataMap:  Record<string, string | number> = {};

      callbackItems?. forEach((item: { Name: string; Value: string | number }) => {
        metadataMap[item.Name] = item.Value;
      });

      const paymentMetadata: MpesaPaymentMetadata = {
        Amount: (metadataMap.Amount as number) || 0,
        MpesaReceiptNumber: (metadataMap.MpesaReceiptNumber as string) || "",
        TransactionDate: (metadataMap.TransactionDate as string) || "",
        PhoneNumber: (metadataMap.PhoneNumber as string) || "",
      };

      console. log("Extracted payment metadata:", paymentMetadata);

      try {
        // TODO: Get eventId and userId from CheckoutRequestID or from your database lookup
        // For now, you need to store the CheckoutRequestID mapping when initiating payment
        const paymentRecord = await convex.query(api.payments.getByCheckoutRequestId, {
          checkoutRequestId: CheckoutRequestID,
        });

        if (! paymentRecord) {
          console.error("Payment record not found for CheckoutRequestID:", CheckoutRequestID);
          return new Response(
            JSON.stringify({ ResultCode: 1, ResultDesc: "Payment record not found" }),
            { status: 404 }
          );
        }

        // Create ticket after successful payment
        const ticketResult = await convex.mutation(api.events.purchaseTicket, {
          eventId: paymentRecord.eventId,
          userId: paymentRecord.userId,
          waitingListId: paymentRecord.waitingListId,
          paymentInfo: {
            paymentIntentId: paymentMetadata.MpesaReceiptNumber,
            amount: paymentMetadata.Amount,
            mpesaTransactionDate: paymentMetadata.TransactionDate,
            phoneNumber: paymentMetadata.PhoneNumber,
          },
        });

        console.log("Ticket created successfully:", ticketResult);

        // Update payment record to completed
        await convex. mutation(api.payments.updatePaymentStatus, {
          paymentId: paymentRecord._id,
          status: "completed",
          mpesaReceiptNumber: paymentMetadata.MpesaReceiptNumber,
          transactionDate: paymentMetadata.TransactionDate,
        });

        console.log("Payment status updated to completed");
      } catch (error) {
        console.error("Error processing successful payment:", error);
        return new Response(
          JSON.stringify({ ResultCode: 1, ResultDesc: "Error processing payment" }),
          { status: 500 }
        );
      }
    } else {
      // Payment failed
      console.log(`Payment failed: ${ResultDesc}`);

      try {
        const paymentRecord = await convex. query(api.payments.getByCheckoutRequestId, {
          checkoutRequestId: CheckoutRequestID,
        });

        if (paymentRecord) {
          // Update payment record to failed
          await convex.mutation(api.payments.updatePaymentStatus, {
            paymentId: paymentRecord._id,
            status: "failed",
            errorMessage: ResultDesc,
          });

          console.log("Payment status updated to failed");
        }
      } catch (error) {
        console.error("Error updating failed payment status:", error);
      }
    }

    // Return success response to M-Pesa (acknowledge receipt)
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ ResultCode: 1, ResultDesc:  "Internal server error" }),
      { status: 500, headers: { "Content-Type":  "application/json" } }
    );
  }
}