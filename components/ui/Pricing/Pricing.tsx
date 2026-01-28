'use client';

import Button from '@/components/ui/Button';
import LogoCloud from '@/components/ui/LogoCloud';
import { getStripe } from '@/utils/stripe/client';
import { checkoutWithStripe } from '@/utils/stripe/server';
import { getErrorRedirect } from '@/utils/helpers';
import { User } from '@supabase/supabase-js';
import cn from 'classnames';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

// Define proper StripePlan type
interface StripePlan {
id: string;
name: string;
description: string;
amount: number;
currency: string;
interval: 'month' | 'year' | 'lifetime';
priceId: string;
}

interface Props {
user: User | null | undefined;
}

type BillingInterval = 'lifetime' | 'year' | 'month';

export default function Pricing({ user }: Props) {
const router = useRouter();
const [plans, setPlans] = useState<StripePlan[]>([]);
const [loading, setLoading] = useState(true);
const [billingInterval, setBillingInterval] =
useState<BillingInterval>('month');
const [priceIdLoading, setPriceIdLoading] = useState<string>();
const currentPath = usePathname() || '/';

const intervals = Array.from(new Set(plans.map((plan) => plan.interval)));

useEffect(() => {
const fetchPlans = async () => {
try {
const res = await fetch('/api/getPlans');
const data = await res.json();
setPlans(data);
} catch (err) {
console.error('Failed to fetch plans', err);
} finally {
setLoading(false);
}
};

fetchPlans();
}, []);

const handleStripeCheckout = async (price: { id: string }) => {
setPriceIdLoading(price.id);

if (!user) {
setPriceIdLoading(undefined);
return router.push('/signin/signup');
}

const { errorRedirect, sessionId } = await checkoutWithStripe(
price,
currentPath
);

if (errorRedirect) {
setPriceIdLoading(undefined);
return router.push(errorRedirect);
}

if (!sessionId) {
setPriceIdLoading(undefined);
return router.push(
getErrorRedirect(
currentPath,
'An unknown error occurred.',
'Please try again later or contact a system administrator.'
)
);
}

const stripe = await getStripe();
stripe?.redirectToCheckout({ sessionId });

setPriceIdLoading(undefined);
};

if (loading) {
return (
<section className="bg-black">
<div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
<p className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
Loading plans…
</p>
</div>
</section>
);
}

if (!plans.length) {
return (
<section className="bg-black">
<div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
<p className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
No subscription pricing plans found.
</p>
</div>
</section>
);
}

return (
<section className="bg-black">
<div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
<div className="sm:flex sm:flex-col sm:align-center">
<h1 className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
Pricing Plans
</h1>
<p className="max-w-2xl m-auto mt-5 text-xl text-zinc-200 sm:text-center sm:text-2xl">
Choose a subscription plan that works for you.
</p>
</div>

<div className="relative self-center mt-6 bg-zinc-900 rounded-lg p-0.5 flex sm:mt-8 border border-zinc-800">
{intervals.includes('month') && (
<button
onClick={() => setBillingInterval('month')}
type="button"
className={`${
billingInterval === 'month'
? 'relative w-1/2 bg-zinc-700 border-zinc-800 shadow-sm text-white'
: 'ml-0.5 relative w-1/2 border border-transparent text-zinc-400'
} rounded-md m-1 py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 focus:z-10 sm:w-auto sm:px-8`}
>
Monthly billing
</button>
)}
{intervals.includes('year') && (
<button
onClick={() => setBillingInterval('year')}
type="button"
className={`${
billingInterval === 'year'
? 'relative w-1/2 bg-zinc-700 border-zinc-800 shadow-sm text-white'
: 'ml-0.5 relative w-1/2 border border-transparent text-zinc-400'
} rounded-md m-1 py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 focus:z-10 sm:w-auto sm:px-8`}
>
Yearly billing
</button>
)}
</div>

<div className="mt-12 space-y-0 sm:mt-16 flex flex-wrap justify-center gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
{plans
.filter((plan) => plan.interval === billingInterval)
.map((plan) => {
const priceString = new Intl.NumberFormat('en-US', {
style: 'currency',
currency: plan.currency,
minimumFractionDigits: 0
}).format(plan.amount / 100);

return (
<div
key={plan.id}
className={cn(
'flex flex-col rounded-lg shadow-sm divide-y divide-zinc-600 bg-zinc-900',
'flex-1 basis-1/3 max-w-xs'
)}
>
<div className="p-6">
<h2 className="text-2xl font-semibold leading-6 text-white">
{plan.name}
</h2>
<p className="mt-4 text-zinc-300">{plan.description}</p>
<p className="mt-8">
<span className="text-5xl font-extrabold text-white">
{priceString}
</span>
<span className="text-base font-medium text-zinc-100">
/{billingInterval}
</span>
</p>
<Button
variant="slim"
type="button"
loading={priceIdLoading === plan.priceId}
onClick={() =>
handleStripeCheckout({ id: plan.priceId })
}
className="block w-full py-2 mt-8 text-sm font-semibold text-center text-white rounded-md hover:bg-zinc-900"
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
