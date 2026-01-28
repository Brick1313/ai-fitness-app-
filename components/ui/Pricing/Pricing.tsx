'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Button from '@/components/ui/Button';
import LogoCloud from '@/components/ui/LogoCloud';
import { getStripe } from '@/utils/stripe/client';
import { checkoutWithStripe } from '@/utils/stripe/server';
import { getErrorRedirect } from '@/utils/helpers';
import { User } from '@supabase/supabase-js';
import cn from 'classnames';

// Properly typed plan
interface Plan {
id: string;
name: string;
description: string;
priceId: string;
amount: number;
currency: string;
interval: 'month' | 'year' | 'lifetime';
}

interface Props {
user: User | null;
}

type BillingInterval = 'month' | 'year' | 'lifetime';

export default function Pricing({ user }: Props) {
const router = useRouter();
const pathname = usePathname() || '/';
const [plans, setPlans] = useState<Plan[]>([]);
const [loading, setLoading] = useState(true);
const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
const [priceIdLoading, setPriceIdLoading] = useState<string | null>(null);

const intervals = Array.from(new Set(plans.map((p) => p.interval)));

// Fetch plans safely
useEffect(() => {
async function fetchPlans() {
try {
const res = await fetch('/api/getPlans');
const data: Plan[] = await res.json();
setPlans(data);
} catch (err) {
console.error('Failed to fetch plans', err);
} finally {
setLoading(false);
}
}
fetchPlans();
}, []);

// Stripe checkout handler
const handleStripeCheckout = async (plan: Plan) => {
setPriceIdLoading(plan.id);

if (!user) {
setPriceIdLoading(null);
router.push('/signin/signup');
return;
}

const { errorRedirect, sessionId } = await checkoutWithStripe(
  plan.priceId,
  pathname ?? '/'
);


if (errorRedirect) {
setPriceIdLoading(null);
router.push(errorRedirect);
return;
}

if (!sessionId) {
setPriceIdLoading(null);
router.push(
getErrorRedirect(
pathname,
'An unknown error occurred.',
'Please try again later or contact support.'
)
);
return;
}

const stripe = await getStripe();
stripe?.redirectToCheckout({ sessionId });
setPriceIdLoading(null);
};

// Loading state
if (loading) {
return (
<section className="bg-black py-24">
<div className="max-w-6xl mx-auto text-center">
<h1 className="text-4xl text-white font-extrabold">Loading plans…</h1>
</div>
</section>
);
}

// No plans found
if (!plans.length) {
return (
<section className="bg-black py-24">
<div className="max-w-6xl mx-auto text-center">
<h1 className="text-4xl text-white font-extrabold">
No subscription pricing plans found.
</h1>
<p className="mt-4 text-zinc-300">
Create them in your{' '}
<a
href="https://dashboard.stripe.com/products"
target="_blank"
rel="noopener noreferrer"
className="underline text-pink-500"
>
Stripe Dashboard
</a>
</p>
</div>
</section>
);
}

// Render plans
return (
<section className="bg-black py-24">
<div className="max-w-6xl mx-auto px-4">
<div className="text-center mb-12">
<h1 className="text-4xl sm:text-6xl font-extrabold text-white">
Pricing Plans
</h1>
<p className="mt-4 text-zinc-300 text-lg sm:text-xl">
Choose a subscription plan that works for you.
</p>
</div>

{/* Billing interval toggle */}
<div className="flex justify-center mb-12 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
{intervals.includes('month') && (
<button
onClick={() => setBillingInterval('month')}
className={cn(
'rounded-md py-2 px-6 text-sm font-medium focus:outline-none',
billingInterval === 'month'
? 'bg-zinc-700 text-white shadow'
: 'text-zinc-400'
)}
>
Monthly
</button>
)}
{intervals.includes('year') && (
<button
onClick={() => setBillingInterval('year')}
className={cn(
'rounded-md py-2 px-6 text-sm font-medium focus:outline-none',
billingInterval === 'year'
? 'bg-zinc-700 text-white shadow'
: 'text-zinc-400'
)}
>
Yearly
</button>
)}
</div>

{/* Plans */}
<div className="flex flex-wrap justify-center gap-6">
{plans
.filter((p) => p.interval === billingInterval)
.map((plan) => {
const priceAmount = price?.unit_amount ?? 0; // fallback to 0 if missing
const priceCurrency = price?.currency ?? 'USD'; // fallback to USD if missing

const priceString = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: priceCurrency,
  minimumFractionDigits: 0
}).format(priceAmount / 100);

return (
<div
key={plan.id}
className="flex flex-col max-w-xs flex-1 bg-zinc-900 rounded-lg shadow-sm divide-y divide-zinc-600"
>
<div className="p-6">
<h2 className="text-2xl font-semibold text-white">{plan.name}</h2>
<p className="mt-4 text-zinc-300">{plan.description}</p>
<p className="mt-8">
<span className="text-5xl font-extrabold text-white">{priceString}</span>
<span className="text-base font-medium text-zinc-100">/{billingInterval}</span>
</p>
<Button
variant="slim"
type="button"
loading={priceIdLoading === plan.id}
onClick={() => handleStripeCheckout(plan)}
className="w-full py-2 mt-8 text-sm font-semibold text-center text-white rounded-md hover:bg-zinc-900"
>
Subscribe
</Button>
</div>
</div>
);
})}
</div>

<LogoCloud />
</div>
</section>
);
}
