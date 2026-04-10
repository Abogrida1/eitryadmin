import { performShopifySync } from "@/utils/sync-logic";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. We receive the webhook payload from Shopify
    // When Shopify signals an order creation/update, we immediately run our full sync logic
    // This perfectly mimics cron but instantly!
    const count = await performShopifySync();

    return NextResponse.json({ message: "Webhook received. Sync triggered successfully.", synced_orders: count });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
