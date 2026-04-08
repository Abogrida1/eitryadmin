import { performShopifySync } from "@/utils/sync-logic";
import { NextResponse } from "next/server";
import crypto from 'crypto';

export async function POST(request: Request) {
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic");
  const shop = request.headers.get("x-shopify-shop-domain");

  const body = await request.text();

  // Signature verification if CLIENT_SECRET is provided
  if (process.env.SHOPIFY_CLIENT_SECRET) {
    const hash = crypto
      .createHmac("sha256", process.env.SHOPIFY_CLIENT_SECRET)
      .update(body, "utf8")
      .digest("base64");

    if (hash !== hmac && process.env.NODE_ENV !== "development") {
      console.warn("[Webhook] Invalid HMAC signature");
      return new Response("Unauthorized", { status: 401 });
    }
  }

  console.log(`[Webhook] Received ${topic} from ${shop}`);

  try {
    // We trigger a full sync for now (safest and ensures consistency)
    // In a high-traffic site, we would process ONLY the order in the payload
    const count = await performShopifySync();
    
    return NextResponse.json({ 
      success: true, 
      message: `Sync triggered by webhook topic: ${topic}`,
      syncedRows: count
    });
  } catch (error: any) {
    console.error("[Webhook] Sync failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
