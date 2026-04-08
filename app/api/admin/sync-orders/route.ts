import { performShopifySync } from "@/utils/sync-logic";
import { NextResponse } from "next/server";

function isAuthenticated(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.split(" ")[1];
  return token === process.env.ADMIN_TOKEN;
}

export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await performShopifySync();

    return NextResponse.json({ 
      message: `Successfully synced ${count} orders.`,
      count: count 
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
