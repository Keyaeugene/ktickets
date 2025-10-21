"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Ticket, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReleaseTicket from "./ReleaseTicket";
import { initiateMpesaPayment } from "@/app/actions/initiateMpesaPayment";

function PurchaseTicket({ eventId }: { eventId: Id<"events"> }) {
  const router = useRouter();
  const { user } = useUser();
  
  // Query the event to get price
  const event = useQuery(api.events.getById, { eventId });
  
  const queuePosition = useQuery(api.waitingList.getQueuePosition, {
    eventId,
    userId: user?.id ?? "",
  });

  const [timeRemaining, setTimeRemaining] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offerExpiresAt = queuePosition?.offerExpiresAt ?? 0;
  const isExpired = Date.now() > offerExpiresAt;

  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (isExpired) {
        setTimeRemaining("Expired");
        return;
      }

      const diff = offerExpiresAt - Date.now();
      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (minutes > 0) {
        setTimeRemaining(
          `${minutes} minute${minutes === 1 ? "" : "s"} ${seconds} second${
            seconds === 1 ? "" : "s"
          }`
        );
      } else {
        setTimeRemaining(`${seconds} second${seconds === 1 ? "" : "s"}`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [offerExpiresAt, isExpired]);

  // Handle M-Pesa checkout
  const handlePurchase = async () => {
    if (!user) {
      setError("Please sign in to complete your purchase");
      return;
    }

    if (!event) {
      setError("Event information is loading...");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await initiateMpesaPayment({
        eventId: eventId as string,
        userId: user.id,
        amount: event.price,
      });

      if (result.success) {
        // Show success message - user will receive M-Pesa prompt on their phone
        alert("Payment initiated! Check your phone for the M-Pesa prompt.");
        
        // Optionally redirect to payment status page
        if (result.paymentId) {
          router.push(`/payment-status/${result.paymentId}`);
        }
      } else {
        setError(result.error || "Failed to initiate payment");
      }
    } catch (error) {
      console.error("Error initiating M-Pesa payment:", error);
      setError("Failed to initiate payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !queuePosition || queuePosition.status !== "offered") {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-amber-200">
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Ticket Reserved
                </h3>
                <p className="text-sm text-gray-500">
                  Expires in {timeRemaining}
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-600 leading-relaxed">
              A ticket has been reserved for you. Complete your purchase before
              the timer expires to secure your spot at this event.
            </div>

            {/* Display ticket price */}
            {event && (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <p className="text-sm text-amber-900">
                  Price: <span className="font-bold">£{event.price.toFixed(2)}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handlePurchase}
          disabled={isExpired || isLoading || !event}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-4 rounded-lg font-bold shadow-md hover:from-amber-600 hover:to-amber-700 transform hover:scale-[1.02] transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : isExpired ? (
            "Offer Expired"
          ) : (
            "Purchase Your Ticket Now →"
          )}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-4">
          <ReleaseTicket eventId={eventId} waitingListId={queuePosition._id} />
        </div>
      </div>
    </div>
  );
}

export default PurchaseTicket;