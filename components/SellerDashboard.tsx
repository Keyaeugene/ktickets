"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { CalendarDays, Plus, Smartphone } from "lucide-react";
import Link from "next/link";

export default function SellerDashboard() {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  // TODO: Replace with actual M-Pesa onboarding status check
  // For now, this is hardcoded to false until M-Pesa logic is ready
  const isMpesaOnboarded = false;
  const mpesaAccountActive = false;

  const handleCreateMpesaAccount = async () => {
    setAccountCreatePending(true);
    setError(false);
    try {
      // TODO: Implement M-Pesa account creation logic here
      // await createMpesaSellerAccount();
      
      // Placeholder - remove this when implementing
      setTimeout(() => {
        alert("M-Pesa integration coming soon!");
        setAccountCreatePending(false);
      }, 1000);
    } catch (error) {
      console.error("Error creating M-Pesa seller account:", error);
      setError(true);
      setAccountCreatePending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
          <h2 className="text-2xl font-bold">Seller Dashboard</h2>
          <p className="text-blue-100 mt-2">
            Manage your seller profile and M-Pesa payment settings
          </p>
        </div>

        {/* Main Content */}
        {isMpesaOnboarded && mpesaAccountActive && (
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
          {/* M-Pesa Account Creation Section */}
          {!isMpesaOnboarded && !accountCreatePending && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Smartphone className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Start Accepting Payments via M-Pesa
              </h3>
              <p className="text-gray-600 mb-6">
                Create your seller account to start receiving payments securely
                through M-Pesa
              </p>
              <button
                onClick={handleCreateMpesaAccount}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Setup M-Pesa Account
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Note: M-Pesa integration is coming soon
              </p>
            </div>
          )}

          {/* M-Pesa Account Status Section */}
          {isMpesaOnboarded && (
            <div className="space-y-6">
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Status Card */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    M-Pesa Account Status
                  </h3>
                  <div className="mt-2 flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        mpesaAccountActive
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    />
                    <span className="text-lg font-semibold">
                      {mpesaAccountActive ? "Active" : "Pending Setup"}
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
                          mpesaAccountActive
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
                        {mpesaAccountActive
                          ? "Can accept M-Pesa payments"
                          : "Cannot accept payments yet"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className={`w-5 h-5 ${
                          mpesaAccountActive
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
                        {mpesaAccountActive
                          ? "Can receive payouts"
                          : "Cannot receive payouts yet"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements Section */}
              {!mpesaAccountActive && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-3">
                    Required Information
                  </h3>
                  <div className="mb-3">
                    <p className="text-yellow-800 font-medium mb-2">
                      To activate your M-Pesa account, please provide:
                    </p>
                    <ul className="list-disc pl-5 text-yellow-700 text-sm">
                      <li>M-Pesa registered phone number</li>
                      <li>Business details (if applicable)</li>
                      <li>Valid identification</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      // TODO: Implement M-Pesa onboarding flow
                      alert("M-Pesa onboarding coming soon!");
                    }}
                    className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Complete M-Pesa Setup
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              {mpesaAccountActive && (
                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    onClick={() => {
                      // TODO: Implement M-Pesa dashboard/settings
                      alert("M-Pesa dashboard coming soon!");
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    M-Pesa Settings
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg">
                  Unable to setup M-Pesa account. Please try again later.
                </div>
              )}
            </div>
          )}

          {/* Loading States */}
          {accountCreatePending && (
            <div className="text-center py-4 text-gray-600">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p>Setting up your M-Pesa seller account...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}