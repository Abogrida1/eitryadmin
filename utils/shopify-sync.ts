const SHOP = process.env.SHOPIFY_SHOP;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;

let token: string | null = null;
let tokenExpiresAt = 0;

async function getToken() {
  if (token && Date.now() < tokenExpiresAt - 60_000) return token;

  const response = await fetch(
    `https://${SHOP}.myshopify.com/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Token request failed: ${response.status}`, errorBody);
    throw new Error(`Token request failed: ${response.status}. Details: ${errorBody}`);
  }

  const { access_token, expires_in } = await response.json();
  token = access_token;
  tokenExpiresAt = Date.now() + expires_in * 1000;
  return token;
}

export async function shopifyGraphql(query: string, variables = {}) {
  const missing = [];
  if (!SHOP) missing.push("SHOPIFY_SHOP");
  if (!CLIENT_ID) missing.push("SHOPIFY_CLIENT_ID");
  if (!CLIENT_SECRET) missing.push("SHOPIFY_CLIENT_SECRET");

  if (missing.length > 0) {
    throw new Error(`بيانات Shopify غير مكتملة. يرجى إعداد المتغيرات التالية في ملف .env: ${missing.join(", ")}`);
  }

  const response = await fetch(
    `https://${SHOP}.myshopify.com/admin/api/2025-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": (await getToken()) as string,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const { data, errors } = await response.json();
  if (errors?.length) {
    throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
  }
  return data;
}

export function mapShopifyStatus(shopifyFulfillmentStatus: string | null): string {
  // Mapping Shopify statuses to our internal steps
  // Shopify statuses: NULL (Unfulfilled), FULFILLED, PARTIAL, RESTOCKED
  if (!shopifyFulfillmentStatus) return "pending";
  if (shopifyFulfillmentStatus === "FULFILLED") return "shipped";
  return "processing";
}
