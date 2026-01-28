import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

interface Plan {
  id: string;
  name: string;
  description: string;
  priceId: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year' | 'lifetime';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Plan[] | { error: string }>
) {
  try {
    // Fetch active prices and expand product details
    const prices = await stripe.prices.list({ active: true, expand: ['data.product'] });

    // Map to Plan structure
    const plans: Plan[] = prices.data.map((p) => ({
      id: p.id,
      name: p.product?.name ?? 'Unnamed Plan',
      description: p.product?.description ?? '',
      priceId: p.id,
      amount: p.unit_amount ?? 0,        // amount in cents
      currency: p.currency ?? 'USD',
      interval: p.recurring?.interval as 'month' | 'year' | 'lifetime' ?? 'month',
    }));

    res.status(200).json(plans);
  } catch (err) {
    console.error('Error fetching Stripe plans:', err);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
}
