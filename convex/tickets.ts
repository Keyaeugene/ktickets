import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserTicketForEvent = query({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
  },
  handler: async (ctx, { eventId, userId }) => {
    const ticket = await ctx.db
      . query("tickets")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .first();

    return ticket;
  },
});

export const getTicketWithDetails = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.db. get(ticketId);
    if (!ticket) return null;

    const event = await ctx. db.get(ticket.eventId);

    return {
      ... ticket,
      event,
    };
  },
});

// Get all valid tickets for an event
export const getValidTicketsForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const tickets = await ctx. db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "valid"),
          q.eq(q.field("status"), "used")
        )
      )
      .collect();

    return tickets;
  },
});

// Query ticket by refund conversation ID
export const getByRefundConversationId = query({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_refund_conversation_id", (q) =>
        q.eq("refundConversationId", args.conversationId)
      )
      .first();
  },
});

// Update ticket refund status
export const updateTicketRefundStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: v.union(
      v. literal("valid"),
      v.literal("used"),
      v.literal("refunded"),
      v.literal("cancelled"),
      v.literal("refund_pending"),
      v.literal("refund_failed"),
      v.literal("refund_timeout")
    ),
    refundTransactionId: v.optional(v. string()),
    refundMetadata: v.optional(v.any()),
    refundError: v.optional(v.string()),
    refundErrorCode: v. optional(v.number()),
    refundCompletedAt: v.optional(v.string()),
    refundFailedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { ticketId, ...updateData } = args;

    await ctx.db.patch(ticketId, updateData);

    return { success: true };
  },
});

// Update ticket status with refund conversation IDs
export const updateTicketStatus = mutation({
  args:  {
    ticketId: v. id("tickets"),
    status: v.union(
      v. literal("valid"),
      v.literal("used"),
      v.literal("refunded"),
      v.literal("cancelled"),
      v.literal("refund_pending"),
      v.literal("refund_failed"),
      v.literal("refund_timeout")
    ),
    refundConversationId: v.optional(v. string()),
    refundOriginatorConversationId: v. optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { ticketId, ...updateData } = args;

    await ctx.db.patch(ticketId, updateData);

    return { success: true };
  },
});