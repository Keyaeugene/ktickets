import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  events: defineTable({
    name:  v.string(),
    description: v.string(),
    location: v.string(),
    eventDate: v.number(),
    price: v.number(),
    totalTickets: v.number(),
    userId: v.string(),
    imageStorageId: v. optional(v.id("_storage")),
    is_cancelled: v.optional(v.boolean()),
  }),
  tickets: defineTable({
    eventId: v.id("events"),
    userId: v.string(),
    purchasedAt: v.number(),
    status: v.union(
      v.literal("valid"),
      v.literal("used"),
      v.literal("refunded"),
      v.literal("cancelled"),
      v.literal("refund_pending"),
      v.literal("refund_failed"),
      v.literal("refund_timeout")
    ),
    paymentIntentId: v.optional(v.string()),
    amount: v.optional(v.number()),
    
    // M-Pesa payment details
    mpesaReceiptNumber: v.optional(v. string()),
    phoneNumber: v.optional(v.string()),
    transactionDate: v.optional(v.string()),
    
    // Refund tracking fields
    refundConversationId:  v.optional(v.string()),
    refundOriginatorConversationId: v.optional(v.string()),
    refundTransactionId: v.optional(v.string()),
    refundMetadata: v.optional(v.any()),
    refundError: v.optional(v.string()),
    refundErrorCode:  v.optional(v.number()),
    refundCompletedAt: v.optional(v.string()),
    refundFailedAt: v.optional(v.string()),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_user_event", ["userId", "eventId"])
    .index("by_payment_intent", ["paymentIntentId"])
    .index("by_refund_conversation_id", ["refundConversationId"])
    .index("by_status", ["status"]),

  waitingList: defineTable({
    eventId: v.id("events"),
    userId: v.string(),
    status: v.union(
      v.literal("waiting"),
      v.literal("offered"),
      v.literal("purchased"),
      v.literal("expired")
    ),
    offerExpiresAt: v.optional(v.number()),
  })
    .index("by_event_status", ["eventId", "status"])
    .index("by_user_event", ["userId", "eventId"])
    .index("by_user", ["userId"]),

  users: defineTable({
    name: v. string(),
    email: v.string(),
    userId: v.string(),
    mpesaConnectId: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"]),

  payments: defineTable({
    eventId: v.id("events"),
    userId: v.string(),
    waitingListId: v.id("waitingList"),
    checkoutRequestId: v.string(),
    amount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    mpesaReceiptNumber: v.optional(v. string()),
    phoneNumber: v.optional(v.string()),
    transactionDate: v.optional(v.string()),
    errorMessage: v.optional(v. string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_checkout_request_id", ["checkoutRequestId"])
    .index("by_status", ["status"])
    .index("by_event", ["eventId"]),
});