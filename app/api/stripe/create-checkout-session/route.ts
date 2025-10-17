import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const priceId: string | undefined = body?.priceId;

    // ✅ Option 1: tu passes un priceId depuis le front (recommandé)
    // ✅ Option 2: sinon on utilise ce prix par défaut (remplace par ton vrai ID Stripe "price_...")
    const fallbackPriceId = "price_xxx_remplace_moi";
    const price = priceId || fallbackPriceId;

    if (!price || price.startsWith("price_xxx")) {
      return new NextResponse(
        "Aucun priceId fourni et fallback non remplacé. Renseigne un ID Stripe du type price_...",
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription", // Mets "payment" si c’est un paiement unique
      line_items: [{ price, quantity: 1 }],
success_url: `${baseUrl}/forfaits?checkout=success`,
cancel_url:  `${baseUrl}/forfaits?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Erreur Stripe:", err);
    return new NextResponse("Erreur Stripe: " + err.message, { status: 500 });
  }
}
