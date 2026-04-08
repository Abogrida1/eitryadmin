import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const order_number = searchParams.get("order_number");

  if (!order_number) {
    return NextResponse.json({ error: "Order number is required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("order_number, status, created_at, customer_name, customer_phone, delivery_method")
      .eq("order_number", order_number)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
