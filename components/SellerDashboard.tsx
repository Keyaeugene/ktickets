"use client";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import React, { useState } from "react";
import { CalendarDays, Cog, Plus } from "lucide-react";
import Link from "next/link";
import Spinner from "./Spinner";

interface MpesaAccountStatus {
  isActive: boolean;
  paymentsEnabled: boolean;
  payoutsEnabled: boolean;
  requiresInformation: boolean;
  requirements?:  {
    currently_due: string[];
    eventually_due: string[];
  };
}

export default function SellerDashboard() {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [error, setError] = useState(false);
  const { user, isLoaded } = useUser();

  // Only query when user is loaded
  const mpesaAccountId = useQuery(
    api.users.getUsersMpesaAccountId,
    isLoaded && user?.id ?  { userId: user.id } : "skip"
  );

  const mpesaAccountStatus = useQuery(
    api.users.getUsersMpesaAccountStatus,
    isLoaded && user?.id ? { userId: user.id } : "skip"
  ) as MpesaAccountStatus | null | undefined;

  // Mutation to create M-Pesa account
  const createMpesaAccount = useMutation(api.users.createMpesaSellerAccount);

  const isReadyToAcceptPayments =
    mpesaAccountStatus?. isActive && mpesaAccountStatus?.payoutsEnabled;

  // Show spinner while loading
  if (!isLoaded || mpesaAccountId === undefined || mpesaAccountStatus === undefined) {
    return <Spinner />;
  }

  const handleCreateMpesaAccount = async () => {
    if (!user?. id) {
      setError(true);
      return;
    }

    setAccountCreatePending(true);
    setError(false);
    try {
      await createMpesaAccount({ userId: user.id });
      // Refetch data after account creation
      window.location.reload();
    } catch (error) {
      console.error("Error creating M-Pesa seller account:", error);
      setError(true);
      setAccountCreatePending(false);
    }
  };

  const handleManageMpesaAccount = async () => {
    try {
      if (mpesaAccountId && mpesaAccountStatus?.isActive) {
        alert("M-Pesa dashboard - coming soon");
      }
    } catch (error) {
      console.error("Error accessing M-Pesa portal:", error);
      setError(true);
    }
  };

  const handleRefreshStatus = async () => {
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
          <h2 className="text-2xl font-bold">Seller Dashboard</h2>
          <p className="text-blue-100 mt-2">
            Manage your seller profile and payment settings
          </p>
        </div>

        {/* Main Content */}
        {isReadyToAcceptPayments && (
          <>
            <div className="bg-white p-8 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Sell tickets for your events
              </h2>
              <p className="text-gray-600 mb-8">
                List your tickets for sale and manage your listings
              </p>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex justify-center gap-4">
                  <Link
                    href="/seller/new-event"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create Event
                  </Link>
                  <Link
                    href="/seller/events"
                    className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <CalendarDays className="w-5 h-5" />
                    View My Events
                  </Link>
                </div>
              </div>
            </div>

            <hr className="my-8" />
          </>
        )}

        <div className="p-6">
          {/* Account Creation Section */}
          {! mpesaAccountId && ! accountCreatePending && (
            <div className="text-center py-8">
              <h3 className="text-xl font-semibold mb-4">
                Start Accepting Payments
              </h3>
              <p className="text-gray-600 mb-6">
                Create your seller account to start receiving payments securely
                through M-Pesa
              </p>
              <button
                onClick={handleCreateMpesaAccount}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={accountCreatePending}
              >
                Create Seller Account
              </button>
              {error && (
                <p className="mt-2 text-red-600 text-sm">
                  Error creating account. Please try again.
                </p>
              )}
            </div>
          )}

          {/* Account Status Section */}
          {mpesaAccountId && mpesaAccountStatus && (
            <div className="space-y-6">
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Status Card */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Account Status
                  </h3>
                  <div className="mt-2 flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        mpesaAccountStatus.isActive
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    />
                    <span className="text-lg font-semibold">
                      {mpesaAccountStatus.isActive ?  "Active" : "Pending Setup"}
                    </span>
                  </div>
                </div>

                {/* Payments Status Card */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Payment Capability
                  </h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center">
                      <svg
                        className={`w-5 h-5 ${
                          mpesaAccountStatus.paymentsEnabled
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-2">
                        {mpesaAccountStatus.paymentsEnabled
                          ? "Can accept payments"
                          : "Cannot accept payments yet"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className={`w-5 h-5 ${
                          mpesaAccountStatus.payoutsEnabled
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-2">
                        {mpesaAccountStatus.payoutsEnabled
                          ? "Can receive payouts"
                          : "Cannot receive payouts yet"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements Section */}
              {mpesaAccountStatus.requiresInformation && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-3">
                    Required Information
                  </h3>
                  {(mpesaAccountStatus.requirements?. currently_due?. length ??  0) > 0 && (
                    <div className="mb-3">
                      <p className="text-yellow-800 font-medium mb-2">
                        Action Required:
                      </p>
                      <ul className="list-disc pl-5 text-yellow-700 text-sm">
                        {mpesaAccountStatus.requirements?.currently_due?.map((req:  string) => (
                          <li key={req}>{req. replace(/_/g, " ")}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(mpesaAccountStatus.requirements?.eventually_due?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-yellow-800 font-medium mb-2">
                        Eventually Needed:
                      </p>
                      <ul className="list-disc pl-5 text-yellow-700 text-sm">
                        {mpesaAccountStatus.requirements?.eventually_due?.map(
                          (req: string) => (
                            <li key={req}>{req.replace(/_/g, " ")}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      alert("M-Pesa account setup - coming soon");
                    }}
                    className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Complete Requirements
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                {mpesaAccountStatus.isActive && (
                  <button
                    onClick={handleManageMpesaAccount}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Cog className="w-4 h-4 mr-2" />
                    Seller Dashboard
                  </button>
                )}
                <button
                  onClick={handleRefreshStatus}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Refresh Status
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg">
                  Unable to access M-Pesa dashboard. Please complete all
                  requirements first.
                </div>
              )}
            </div>
          )}

          {/* Loading States */}
          {accountCreatePending && (
            <div className="text-center py-4 text-gray-600">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p>Creating your seller account...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}