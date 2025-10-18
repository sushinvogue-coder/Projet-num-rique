import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // Stripe ne fonctionne pas en Edge

function getBaseUrl() {
  // 1) URL publique si dispo, 2) Vercel, 3) local
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is missing");
  return new Stripe(key);
}

export async function POST(req: Request) {
  try {
    const { priceId } = await req.json().catch(() => ({}));
    const price = priceId || process.env.STRIPE_FALLBACK_PRICE_ID;
    if (!price) {
      return new NextResponse("Missing priceId (body.priceId or STRIPE_FALLBACK_PRICE_ID)", { status: 400 });
    }

    const stripe = getStripe();
    const baseUrl = getBaseUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription", // mets "payment" si achat unique
      line_items: [{ price, quantity: 1 }],
      success_url: `${baseUrl}/forfaits?checkout=success`,
      cancel_url: `${baseUrl}/forfaits?checkout=cancel`,
      // allow_promotion_codes: true, // optionnel
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Erreur Stripe:", err);
    return new NextResponse("Erreur Stripe: " + err.message, { status: 500 });
  }
}

