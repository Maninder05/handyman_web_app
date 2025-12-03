// app/mutual/membership/page.tsx (FINAL CORRECTED VERSION)

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import Header from "../../components/handyHeader";

const EXPRESS_BASE_URL = "http://localhost:7000";

export default function MembershipPage() {
    const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const handleLogout = () => router.push("/");

    // Verify user is authenticated and is a handyman
    useEffect(() => {
        const verifyAccess = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("You must be logged in to view membership plans.");
                    setTimeout(() => router.push("/signup?mode=login"), 2000);
                    return;
                }

                // Fetch handyman profile to verify user type
                const res = await fetch(`${EXPRESS_BASE_URL}/api/handymen/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
                    if (res.status === 401) {
                        localStorage.removeItem("token");
                        setError("Your session has expired. Please log in again.");
                        setTimeout(() => router.push("/signup?mode=login"), 2000);
                        return;
                    }
                    if (res.status === 403) {
                        setError(errorData.message || "Only handymen can access this page.");
                        setTimeout(() => router.push("/"), 2000);
                        return;
                    }
                    throw new Error(errorData.message || `Failed to verify access (${res.status})`);
                }

                const profileData = await res.json();
                
                // Verify user is a handyman (additional check)
                if (profileData.userType !== "handyman") {
                    setError("Only handymen can purchase memberships.");
                    setTimeout(() => router.push("/"), 2000);
                    return;
                }
            } catch (err: any) {
                console.error("Error verifying access:", err);
                setError(err.message || "Failed to verify access");
            } finally {
                setLoading(false);
            }
        };

        verifyAccess();
    }, [router]);

    type Billing = "monthly" | "yearly";

    // ✅ CRITICAL FIX: Load Price IDs from NEXT_PUBLIC environment variables
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

    /**
     * Handler: Redirects to the dedicated Checkout page with the Price ID.
     */
    const handleCheckout = (planName: string, cycle: Billing) => {
        const priceKey = `${planName}_${cycle}` as keyof typeof PRICE_MAP;
        const priceId = PRICE_MAP[priceKey];

        // If the ID is still a placeholder, it will fail at the next step (which is good)
        // If it's the correct ID, it will redirect properly.
        router.push(
            `/mutual/checkout?planName=${planName}&billing=${cycle}&priceId=${priceId}`
        );
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-4 text-gray-600">Loading membership plans...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center p-8 bg-gray-50 rounded-lg shadow-md max-w-md">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Link href="/" className="text-blue-600 underline">
                        Return to home
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            {/* Header */}
            <div>
                <Header pageTitle="Buy Membership" onLogout={handleLogout} />
            </div>

            <section className="mx-auto max-w-[1100px] px-6 py-10">
                {/* Pricing Header and Toggle (content remains unchanged) */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold tracking-tight text-black">Pricing</h2>
                    <p className="mt-2 text-black">
                        Choose the plan that fits your work style. <br />
                        Whether you're just starting out or managing multiple jobs, we've got you covered.
                    </p>

                    {/* Toggle */}
                    <div className="mt-6 flex justify-center">
                        <div
                            role="tablist"
                            aria-label="Billing period"
                            className="inline-flex items-center rounded-fullbg-[#D4A574]  border border-gray-700 p-1 shadow-sm"
                        >
                            <button
                                role="tab"
                                aria-selected={billing === "monthly"}
                                onClick={() => setBilling("monthly")}
                                className={`px-4 py-2 rounded-full text-sm transition ${
                                    billing === "monthly"
                                        ? "bg-gray-900 border border-gray-700bg-gray-300 shadow-sm font-medium"
                                        : "text-black bg-gray-600"
                                }`}
                            >
                                Monthly
                            </button>

                            <button
                                role="tab"
                                aria-selected={billing === "yearly"}
                                onClick={() => setBilling("yearly")}
                                className={`px-4 py-2 rounded-full text-sm transition ${
                                    billing === "yearly"
                                        ? "bg-gray-900 border border-gray-700bg-gray-300 shadow-sm font-medium"
                                        : "text-gray-300 bg-gray-600"
                                }`}
                            >
                                Yearly
                            </button>
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
                                className="relative rounded-2xl border bg-[#D4A574] text-white border-gray-700 shadow hover:shadow-lg hover:-translate-y-1 transition-all p-6 sm:p-8 flex flex-col min-h-[440px]bg-[#D4A574] "
                            >
                                {plan.badge && (
                                    <span className="absolute -top-3 right-6 rounded-full border border-gray-700 bg-gray-300 px-3 py-1 text-xs font-medium text-black shadow-sm">
                                        {plan.badge}
                                    </span>
                                )}

                                <div>
                                    <h3 className="text-xl font-semibold tracking-tightbg-gray-300">
                                        {plan.name}
                                    </h3>
                                    <p className="mt-1 text-white">{plan.tagline}</p>
                                    <div className="mt-5 flex items-end gap-2">
                                        <span className="text-4xl font-bold leading-nonebg-gray-300">
                                            ${price}
                                        </span>
                                        <span className="mb-1 text-white">{cycle}</span>
                                    </div>
                                </div>

                                <ul className="mt-6 space-y-3 text-sm text-white">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <CheckCircle2
                                                className="h-5 w-5 mt-0.5bg-gray-300"
                                                aria-hidden
                                            />
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

            {/* Footer remains unchanged */}
            <footer className="mx-auto max-w-[1100px] px-6">
                <p className="mt-10 text-xs text-gray-400 text-center">
                    Prices are in CAD. Taxes may apply. <br /> All rights reserved.
                </p>
            </footer>

            <div className="h-24" />
        </main>
    );
}