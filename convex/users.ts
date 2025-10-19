import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


export const getUserById = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    return user;
  },
});

export const updateUser = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
  },
    handler: async (ctx, { userId, name, email }) => {
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        name,
        email,
      });
      return existingUser._id;
    }

    // Create new user
    const newUserId = await ctx.db.insert("users", {
      userId,
      name,
      email,
      mpesaConnectId: undefined,
    });

    return newUserId;
  },
});

// NEW MUTATION: Create M-Pesa seller account
export const createMpesaSellerAccount = mutation({
  args: { userId: v.string() },
  async handler(ctx, args) {
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!existingUser) {
      throw new Error("User not found");
    }

    // TODO: Call your M-Pesa API to create an account
    // For now, generate a mock ID
    const mpesaConnectId = `mpesa_${Date.now()}`;

    // Save the M-Pesa account ID to the user
    await ctx.db.patch(existingUser._id, {
      mpesaConnectId,
    });

    return mpesaConnectId;
  },
});

export const getUsersMpesaAccountId = query({
  args: { userId: v.string() },
  async handler(ctx, args) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      return null;
    }

    return user.mpesaConnectId || null;
  },
});

export const getUsersMpesaAccountStatus = query({
  args: { userId: v.string() },
  async handler(ctx, args) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (!user || !user.mpesaConnectId) {
      return null;
    }

    // TODO: Implement M-Pesa status checking logic
    // This should call your M-Pesa backend API to get account status
    // For now, return a basic status object
    return {
      mpesaConnectId: user.mpesaConnectId,
      isActive: true,
      paymentsEnabled: true,
      payoutsEnabled: true,
      requiresInformation: false,
      requirements: {
        currently_due: [],
        eventually_due: [],
      },
    };
  },
});