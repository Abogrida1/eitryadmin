import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name: order_number } = body;

    if (!order_number) {
      return NextResponse.json({ error: "Invalid payload: order_number missing" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("orders")
      .upsert(
        { order_number, status: "pending" },
        { onConflict: "order_number" }
      );

    if (error) throw error;

    return NextResponse.json({ message: "Order received", order_number });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
