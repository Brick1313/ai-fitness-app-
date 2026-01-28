// pages/api/getPlans.js

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export default async function handler(req, res) {
  try {
    const prices = await stripe.prices.list({
      expand: ['data.product'],
    });

    const plans = prices.data.map((price) => ({
      id: price.id,
      name: price.product.name,
      description: price.product.description,
      priceId: price.id,
      amount: price.unit_amount || 0,
      currency: price.currency,
      interval: price.recurring?.interval || 'lifetime',
    }));

    res.status(200).json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
}
