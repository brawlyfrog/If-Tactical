import Stripe from "stripe";

// Force Node runtime (not Edge) + no caching
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2024-06-20" }) : null;

// GET: status or ?test=1 to redirect to Stripe Checkout
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const test = searchParams.get("test");

    const status = {
      ok: true,
      hasStripeKey: Boolean(stripeKey),
      hasSiteUrl: Boolean(siteUrl),
      note: test ? "TEST MODE: redirecting to Stripe." : "Add ?test=1 to create a Stripe session."
    };

    if (!test) {
      return new Response(JSON.stringify(status), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (!stripeKey) throw new Error("Missing STRIPE_SECRET_KEY");
    if (!siteUrl) throw new Error("Missing NEXT_PUBLIC_SITE_URL");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        { price_data: { currency: "usd", product_data: { name: "Test Item A" }, unit_amount: 500 }, quantity: 1 },
        { price_data: { currency: "usd", product_data: { name: "Test Item B" }, unit_amount: 750 }, quantity: 2 }
      ],
      success_url: `${siteUrl}/?status=success`,
      cancel_url: `${siteUrl}/?status=cancelled`
    });

    return new Response(null, { status: 302, headers: { Location: session.url } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Checkout test error", detail: err?.message || "Unknown" }),
      { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

// POST: used by the storefront Checkout button
export async function POST(req) {
  try {
    if (!stripeKey) throw new Error("Missing STRIPE_SECRET_KEY");
    if (!siteUrl) throw new Error("Missing NEXT_PUBLIC_SITE_URL");

    const { items, success_url, cancel_url } = await req.json();
    if (!Array.isArray(items) || items.length === 0) throw new Error("No items provided");

    const line_items = items.map((i) => ({
      price_data: { currency: "usd", product_data: { name: i.name || "Item" }, unit_amount: Math.round(Number(i.price) * 100) },
      quantity: Number(i.quantity) || 1
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: success_url || `${siteUrl}/?status=success`,
      cancel_url: cancel_url || `${siteUrl}/?status=cancelled`
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Checkout error", detail: err?.message || "Unknown" }),
      { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
