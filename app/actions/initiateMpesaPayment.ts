"use server";

interface MpesaPaymentRequest {
  eventId: string;
  userId: string;
  amount: number;
  phoneNumber?:  string;
}

interface MpesaPaymentResponse {
  success: boolean;
  paymentId?: string;
  error?: string;
  message?: string;
}

export async function initiateMpesaPayment(
  request: MpesaPaymentRequest
): Promise<MpesaPaymentResponse> {
  try {
    const { eventId, userId, amount } = request;

    // TODO: Validate inputs
    if (!eventId || !userId || ! amount) {
      return {
        success: false,
        error: "Missing required fields",
      };
    }

    // TODO: Get user's phone number from database if not provided
    // const user = await getUser(userId);
    // const userPhoneNumber = phoneNumber || user?.phoneNumber;

    // TODO: Call your M-Pesa API
    // Example M-Pesa Daraja API call:
    /*
    const mpesaResponse = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON. stringify({
        BusinessShortCode: process.env.MPESA_SHORT_CODE,
        Password: generatePassword(),
        Timestamp: getCurrentTimestamp(),
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: phoneNumber,
        PartyB: process.env.MPESA_SHORT_CODE,
        PhoneNumber: phoneNumber,
        CallBackURL:  `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`,
        AccountReference: eventId,
        TransactionDesc: "Ticket Purchase",
      }),
    });
    */

    // TODO: Store payment record in Convex database
    // const paymentId = await createPaymentRecord({
    //   eventId,
    //   userId,
    //   amount,
    //   phoneNumber:  userPhoneNumber,
    //   status: "pending",
    //   mpesaCheckoutRequestId: mpesaResponse.CheckoutRequestID,
    // });

    // Placeholder response (remove when implementing actual M-Pesa)
    const paymentId = `mpesa_${userId}_${Date.now()}`;

    return {
      success: true,
      paymentId,
      message: "Payment initiated.  Check your phone for M-Pesa prompt.",
    };
  } catch (error) {
    console.error("Error initiating M-Pesa payment:", error);
    return {
      success: false,
      error: "Failed to initiate payment.  Please try again.",
    };
  }
}