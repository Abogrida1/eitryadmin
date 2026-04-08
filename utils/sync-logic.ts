import { createClient } from "@/utils/supabase/server";
import { shopifyGraphql, mapShopifyStatus } from "@/utils/shopify-sync";
import { cookies } from "next/headers";

export async function performShopifySync() {
  const query = `
    {
      orders(first: 50, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            name
            createdAt
            displayFulfillmentStatus
            phone
            shippingAddress {
              firstName
              lastName
              phone
            }
            billingAddress {
              firstName
              lastName
              phone
            }
            shippingLine {
              title
              code
              source
            }
          }
        }
      }
    }
  `;

  const data = await shopifyGraphql(query);
  const shopifyOrders = data.orders.edges.map((edge: any) => edge.node);

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Get existing orders to avoid overwriting manual status changes
  const orderNames = shopifyOrders.map((o: any) => o.name);
  const { data: existingOrders } = await supabase
    .from("orders")
    .select("order_number, status")
    .in("order_number", orderNames);

  const existingStatusMap = new Map(existingOrders?.map((o) => [o.order_number, o.status]) || []);

  const upsertData = shopifyOrders.map((order: any) => {
    const sLine = order.shippingLine;
    const sTitle = (sLine?.title || "").toLowerCase();
    const sCode = (sLine?.code || "").toLowerCase();
    
    // Comprehensive Detection for Local Pickup
    // 1. Check if shipping address is completely missing (Strong indicator for pickup in many stores)
    // 2. Search for keywords in title/code
    const isPickup = 
      !order.shippingAddress ||
      sCode.includes("pickup") || 
      sCode.includes("local") || 
      sTitle.includes("pickup") || 
      sTitle.includes("pick up") || 
      sTitle.includes("store") || 
      sTitle.includes("branch") || 
      sTitle.includes("استلام") || 
      sTitle.includes("فرع") || 
      sTitle.includes("محل") ||
      sTitle.includes("عطري") || // Specific branch/method name from user debug
      sTitle.includes("نفسي");
    
    // Multi-source phone lookup: Order level -> Shipping -> Billing
    const customerPhone = order.phone || order.shippingAddress?.phone || order.billingAddress?.phone || "بدون هاتف";
    
    // Name fallback: Shipping -> Billing
    const address = order.shippingAddress || order.billingAddress;
    const customerName = address ? `${address.firstName || ""} ${address.lastName || ""}`.trim() : "عميل مجهول";
    
    // Priority Logic: If order already exists, keep OUR status. Only new orders get Shopify status.
    const currentInternalStatus = existingStatusMap.get(order.name);
    const finalStatus = currentInternalStatus || mapShopifyStatus(order.displayFulfillmentStatus);

    return {
      order_number: order.name,
      status: finalStatus,
      created_at: order.createdAt,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_method: isPickup ? "PICKUP" : "SHIPPING",
    };
  });

  const { error: upsertError } = await supabase
    .from("orders")
    .upsert(upsertData, { onConflict: "order_number" });

  if (upsertError) throw upsertError;

  return shopifyOrders.length;
}
