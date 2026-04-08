import { performShopifySync } from "@/utils/sync-logic";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Security Check: Only allow if correctly authorized by CRON_SECRET or if running in dev
  if (process.env.NODE_ENV !== 'development' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const count = await performShopifySync();
    console.log(`[Cron] Successfully synced ${count} orders at ${new Date().toISOString()}`);
    
    return NextResponse.json({ 
      success: true,
      message: `Automatic sync completed. ${count} orders updated.`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[Cron] Sync failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
