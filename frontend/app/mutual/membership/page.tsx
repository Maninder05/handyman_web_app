// app/mutual/membership/page.tsx (Perfect Centered Toggle + Readable Header)

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import Header from "../../components/handyHeader";

export default function MembershipPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const router = useRouter();
  const handleLogout = () => router.push("/");

  type Billing = "monthly" | "yearly";

  const PRICE_MAP = {
    "Basic_monthly": process.env.NEXT_PUBLIC_PRICE_BASIC_MONTHLY || "placeholder",
    "Basic_yearly": process.env.NEXT_PUBLIC_PRICE_BASIC_YEARLY || "placeholder",
    "Seasonal_monthly": process.env.NEXT_PUBLIC_PRICE_SEASONAL_MONTHLY || "placeholder",
    "Seasonal_yearly": process.env.NEXT_PUBLIC_PRICE_SEASONAL_YEARLY || "placeholder",
    "Pro_monthly": process.env.NEXT_PUBLIC_PRICE_PRO_MONTHLY || "placeholder",
    "Pro_yearly": process.env.NEXT_PUBLIC_PRICE_PRO_YEARLY || "placeholder",
  };

  const PLANS = [
    {
      name: "Basic",
      tagline: "Great for individuals starting out.",
      monthly: 10,
      yearly: 96,
      features: ["Create a profile", "Browse & request jobs", "In-app messaging", "Email support"],
    },
    {
      name: "Seasonal",
      tagline: "For weekend warriors & seasonal pros.",
      monthly: 12,
      yearly: 108,
      badge: "Popular",
      features: ["Everything in Basic", "5 featured listings / mo", "Priority placement in search", "Standard support"],
    },
    {
      name: "Pro",
      tagline: "For full-time contractors who want more.",
      monthly: 15,
      yearly: 144,
      features: ["Everything in Seasonal", "Unlimited featured listings", "Verified badge", "Priority support"],
    },
  ];

  const handleCheckout = (planName: string, cycle: Billing) => {
    const priceKey = `${planName}_${cycle}` as keyof typeof PRICE_MAP;
    const priceId = PRICE_MAP[priceKey];
    router.push(`/mutual/checkout?planName=${planName}&billing=${cycle}&priceId=${priceId}`);
  };

  return (
    <main className="min-h-screen bg-white">
      <Header pageTitle="Buy Membership" onLogout={handleLogout} />

      <section className="mx-auto max-w-[1100px] px-6 py-10">
        {/* Centered Header & Toggle */}
        <div className="text-center mt-8 md:mt-10 mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-black">Pricing</h2>
          <p className="mt-2 text-black">
            Choose the plan that fits your work style. <br />
            Whether you’re just starting out or managing multiple jobs, we’ve got you covered.
          </p>

          {/* ✅ Responsive Animated Toggle */}
          <div className="mt-8 flex justify-center">
            <div
              role="tablist"
              aria-label="Billing period"
              className="
                relative flex items-center justify-between
                w-[180px] sm:w-[200px] md:w-[220px]
                rounded-full bg-gray-800 border border-gray-700
                p-[4px] shadow-md overflow-hidden"
            >
              <div className="flex w-full relative">
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute top-[4px] bottom-[4px] w-1/2 rounded-full bg-yellow-400"
                  animate={{
                    x: billing === "monthly" ? 0 : "100%",
                  }}
                />

                <button
                  onClick={() => setBilling("monthly")}
                  className={`relative z-10 w-1/2 py-[6px] text-sm font-medium transition-colors duration-300 ${
                    billing === "monthly"
                      ? "text-gray-900 font-semibold"
                      : "text-gray-300 hover:text-yellow-300"
                  }`}
                >
                  Monthly
                </button>

                <button
                  onClick={() => setBilling("yearly")}
                  className={`relative z-10 w-1/2 py-[6px] text-sm font-medium transition-colors duration-300 ${
                    billing === "yearly"
                      ? "text-gray-900 font-semibold"
                      : "text-gray-300 hover:text-yellow-300"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {PLANS.map((plan) => {
            const price = billing === "monthly" ? plan.monthly : plan.yearly;
            const cycle = billing === "monthly" ? "/month" : "/year";

            return (
              <article
                key={plan.name}
                className="relative rounded-2xl border bg-[#D4A574] text-white border-gray-700 shadow hover:shadow-lg hover:-translate-y-1 transition-all p-6 sm:p-8 flex flex-col min-h-[440px]"
              >
                {plan.badge && (
                  <span className="absolute -top-3 right-6 rounded-full border border-gray-700 bg-gray-300 px-3 py-1 text-xs font-medium text-black shadow-sm">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-semibold tracking-tight">{plan.name}</h3>
                  <p className="mt-1 text-white">{plan.tagline}</p>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="text-4xl font-bold leading-none">${price}</span>
                    <span className="mb-1 text-white">{cycle}</span>
                  </div>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-white">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 mt-0.5" aria-hidden />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-8">
                  <button
                    onClick={() => handleCheckout(plan.name, billing)}
                    className="block w-full rounded-xl bg-gray-300 text-gray-900 px-4 py-3 text-center font-medium hover:bg-gray-400"
                  >
                    Choose {plan.name}
                  </button>
                  <p className="mt-3 text-center text-xs text-white">
                    {billing === "yearly"
                      ? "Billed annually. Cancel anytime."
                      : "Billed monthly. Cancel anytime."}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="mx-auto max-w-[1100px] px-6">
        <p className="mt-10 text-xs text-gray-400 text-center">
          Prices are in CAD. Taxes may apply. <br /> All rights reserved.
        </p>
      </footer>

      <div className="h-24" />
    </main>
  );
}
