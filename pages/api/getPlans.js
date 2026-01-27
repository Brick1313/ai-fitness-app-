import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
try {
const prices = await stripe.prices.list({
expand: ["data.product"],
active: true,
});

const formatted = prices.data.map((price) => ({
id: price.id,
productName: price.product.name,
description: price.product.description,
unit_amount: price.unit_amount,
currency: price.currency,
interval: price.recurring.interval,
}));

res.status(200).json(formatted);
} catch (error) {
console.error(error);
res.status(500).json({ error: "Failed to fetch prices from Stripe" });
}
}
