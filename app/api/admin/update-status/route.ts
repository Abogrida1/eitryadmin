import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
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
    const { order_number, new_status } = await request.json();
    const valid_statuses = ["pending", "processing", "shipped", "delivered"];

    if (!order_number || !new_status || !valid_statuses.includes(new_status)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
      .from("orders")
      .update({ status: new_status })
      .eq("order_number", order_number);

    if (error) throw error;
    return NextResponse.json({ message: "Status updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
