import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  const supabaseOk = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let stripeOk = false;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
apiVersion: '2025-08-27.basil',
    });
    await stripe.products.list({ limit: 1 });
    stripeOk = true;
  } catch {
    stripeOk = false;
  }

  return NextResponse.json({ ok: supabaseOk && stripeOk, supabaseOk, stripeOk });
}
