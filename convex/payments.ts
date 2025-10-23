import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const createPaymentRecord = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
    waitingListId: v.id("waitingList"),
    checkoutRequestId: v.string(),
    amount: v.number(),
    phoneNumber: v.string(),
  },
  async handler(ctx, args) {
    const paymentId = await ctx.db.insert("payments", {
      eventId: args.eventId,
      userId: args.userId,
      waitingListId: args.waitingListId,
      checkoutRequestId: args.checkoutRequestId,
      amount: args.amount,
      phoneNumber: args.phoneNumber,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return paymentId;
  },
});

export const getByCheckoutRequestId = query({
  args: { checkoutRequestId: v.string() },
  async handler(ctx, args) {
    return await ctx.db
      .query("payments")
      .withIndex("by_checkout_request_id", (q) =>
        q.eq("checkoutRequestId", args.checkoutRequestId)
      )
      .first();
  },
});

export const updatePaymentStatus = mutation({
  args: {
    paymentId: v.id("payments"),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    mpesaReceiptNumber: v.optional(v.string()),
    transactionDate: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const { paymentId, status, ...updates } = args;

    await ctx.db.patch(paymentId, {
      status,
      ...updates,
      updatedAt: Date.now(),
    });

    return paymentId;
  },
});

export const getPaymentsByUser = query({
  args: { userId: v.string() },
  async handler(ctx, args) {
    return await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getPaymentsByStatus = query({
  args: { status: v.string() },
  async handler(ctx, args) {
    return await ctx.db
      .query("payments")
      .withIndex("by_status", (q) => q.eq("status", args.status as any))
      .collect();
  },
});

export const getPaymentById = query({
  args: { paymentId: v.id("payments") },
  async handler(ctx, args) {
    return await ctx.db.get(args.paymentId);
  },
});