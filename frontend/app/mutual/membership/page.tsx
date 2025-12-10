"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import Header from "../../components/handyHeader";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";

const EXPRESS_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000";

type Billing = "monthly" | "yearly";

export default function MembershipPage() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [currentBilling, setCurrentBilling] = useState<Billing | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; billing: Billing } | null>(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const router = useRouter();
  const { showToast, toastState, hideToast } = useToast();
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
        console.log("Fetching handyman profile...");
        const res = await fetch(`${EXPRESS_BASE_URL}/api/handymen/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Response status:", res.status, res.statusText);

        if (!res.ok) {
          let errorData;
          try {
            errorData = await res.json();
          } catch (e) {
            // If response is not JSON, create a default error object
            errorData = { message: `Server error (${res.status}): ${res.statusText}` };
          }
          
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
          throw new Error(errorData.message || errorData.error || `Failed to verify access (${res.status})`);
        }

        const profileData = await res.json();
        console.log("Profile data received:", profileData);
        
        // Verify user is a handyman (additional check)
        if (profileData.userType !== "handyman") {
          setError(`Only handymen can purchase memberships. Your account type is: ${profileData.userType || 'unknown'}`);
          setTimeout(() => router.push("/"), 2000);
          return;
        }
        
        // Get current plan if exists and has active subscription
        if (profileData.planType && profileData.subscriptionStatus) {
          // Only set current plan if there's an active subscription
          const validStatuses = ['active', 'trialing', 'incomplete'];
          if (validStatuses.includes(profileData.subscriptionStatus)) {
            setCurrentPlan(profileData.planType);
            // Try to get billing cycle from subscription (we'll need to add this to the profile response)
            // For now, default to monthly
            setCurrentBilling("monthly");
          }
        }
        
        console.log("Access verified successfully");
      } catch (err: any) {
        console.error("Error verifying access:", err);
        // More specific error handling
        if (err.message) {
          setError(err.message);
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else if (typeof err === 'string') {
          setError(err);
        } else {
          setError("Failed to verify access. Please try logging in again.");
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, [router]);

  const PRICE_MAP = {
    "Basic_monthly": process.env.NEXT_PUBLIC_PRICE_BASIC_MONTHLY || "placeholder",
    "Basic_yearly": process.env.NEXT_PUBLIC_PRICE_BASIC_YEARLY || "placeholder",
    "Standard_monthly": process.env.NEXT_PUBLIC_PRICE_STANDARD_MONTHLY || "placeholder",
    "Standard_yearly": process.env.NEXT_PUBLIC_PRICE_STANDARD_YEARLY || "placeholder",
    "Premium_monthly": process.env.NEXT_PUBLIC_PRICE_PREMIUM_MONTHLY || "placeholder",
    "Premium_yearly": process.env.NEXT_PUBLIC_PRICE_PREMIUM_YEARLY || "placeholder",
  };

  const PLANS = [
    {
      name: "Basic",
      tagline: "Great for individuals starting out.",
      monthly: 7,
      yearly: 70,
      features: ["Create a profile", "Browse & request jobs", "In-app messaging", "Email support", "7 jobs per month"],
    },
    {
      name: "Standard",
      tagline: "For weekend warriors & seasonal pros.",
      monthly: 10,
      yearly: 100,
      badge: "Popular",
      features: ["Everything in Basic", "15 jobs per month", "Priority placement in search", "Standard support"],
    },
    {
      name: "Premium",
      tagline: "For full-time contractors who want more.",
      monthly: 20,
      yearly: 200,
      features: ["Everything in Standard", "30 jobs per month", "Verified badge", "Priority support"],
    },
  ];

  const handleCheckout = (planName: string, cycle: Billing) => {
    // If this is the current plan, don't do anything
    if (currentPlan && currentPlan.toLowerCase() === planName.toLowerCase() && currentBilling === cycle) {
      return;
    }
    
    // If user has a current plan, show confirmation modal instead of going to checkout
    if (currentPlan) {
      setSelectedPlan({ name: planName, billing: cycle });
      setShowConfirmModal(true);
    } else {
      // New subscription - go to checkout
      const priceKey = `${planName}_${cycle}` as keyof typeof PRICE_MAP;
      const priceId = PRICE_MAP[priceKey];
      router.push(`/mutual/checkout?planName=${planName}&billing=${cycle}&priceId=${priceId}`);
    }
  };

  const handleConfirmPlanChange = async () => {
    if (!selectedPlan) return;
    
    setIsChangingPlan(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to change your plan.");
        setIsChangingPlan(false);
        return;
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || EXPRESS_BASE_URL;
      const url = `${API_BASE}/api/subscriptions/change-plan`;
      console.log('🔵 Changing plan - URL:', url);
      console.log('🔵 Request body:', { planName: selectedPlan.name, billing: selectedPlan.billing });
      
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          planName: selectedPlan.name,
          billing: selectedPlan.billing
        }),
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error(`Server returned ${res.status}: ${res.statusText}. Please check the backend logs.`);
      }

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to change plan");
      }

      // Success - close modal
      setShowConfirmModal(false);
      setCurrentPlan(selectedPlan.name);
      setCurrentBilling(selectedPlan.billing);
      setSelectedPlan(null);
      
      // Show success toast
      showToast("Plan changed successfully! Your new plan is now active.", "success");
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/handyman/handyDashboard");
      }, 1500);
    } catch (err: any) {
      console.error("Error changing plan:", err);
      setError(err.message || "Failed to change plan. Please try again.");
      setIsChangingPlan(false);
    }
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
      <Header pageTitle="Buy Membership" />
      
      <section className="mx-auto max-w-[1100px] px-6 py-10">
        {/* Centered Header & Toggle */}
        <div className="text-center mt-8 md:mt-10 mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-black">Pricing</h2>
          <p className="mt-2 text-black">
            Choose the plan that fits your work style. <br />
            Whether you're just starting out or managing multiple jobs, we've got you covered.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex justify-center">
            <div
              role="tablist"
              aria-label="Billing period"
              className="relative flex items-center justify-between w-[180px] sm:w-[200px] md:w-[220px] rounded-full bg-gray-800 border border-gray-700 p-[4px] shadow-md overflow-hidden"
            >
              <div className="flex w-full relative">
                <div
                  className={`absolute top-[4px] bottom-[4px] w-1/2 rounded-full bg-yellow-400 transition-transform duration-300 ${
                    billing === "monthly" ? "left-[4px]" : "left-[50%]"
                  }`}
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
                      <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" aria-hidden />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-8">
                  {currentPlan && currentPlan.toLowerCase() === plan.name.toLowerCase() && currentBilling === billing ? (
                    <>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                        <span className="text-green-400 font-semibold text-sm">Current Plan</span>
                      </div>
                      <button
                        disabled
                        className="block w-full rounded-xl bg-gray-500 text-gray-300 px-4 py-3 text-center font-medium cursor-not-allowed opacity-60"
                      >
                        Current Plan
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.name, billing)}
                      className="block w-full rounded-xl bg-gray-300 text-gray-900 px-4 py-3 text-center font-medium hover:bg-gray-400 transition"
                    >
                      {currentPlan ? `Switch to ${plan.name}` : `Choose ${plan.name}`}
                    </button>
                  )}
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

      <footer className="mx-auto max-w-[1100px] px-6 pb-10">
        <p className="mt-10 text-xs text-gray-400 text-center">
          Prices are in CAD. Taxes may apply. <br /> All rights reserved.
        </p>
      </footer>

      {/* Plan Change Confirmation Modal */}
      {showConfirmModal && selectedPlan && currentPlan && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Streaming Plan</h2>
            
            {/* Current Plan */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Current plan</p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-lg font-semibold text-gray-900">
                  {currentPlan} {currentBilling === "monthly" ? "$" + (PLANS.find(p => p.name === currentPlan)?.monthly || 0) + "/month" : "$" + (PLANS.find(p => p.name === currentPlan)?.yearly || 0) + "/year"} (pre-tax)
                </p>
              </div>
            </div>

            {/* New Plan */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">New plan</p>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-lg font-semibold text-gray-900">
                  {selectedPlan.name} {selectedPlan.billing === "monthly" ? "$" + (PLANS.find(p => p.name === selectedPlan.name)?.monthly || 0) + "/month" : "$" + (PLANS.find(p => p.name === selectedPlan.name)?.yearly || 0) + "/year"} (pre-tax)
                </p>
              </div>
            </div>

            {/* Plan Start Info */}
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-700">
                Your new plan starts now. You'll pay ${selectedPlan.billing === "monthly" ? (PLANS.find(p => p.name === selectedPlan.name)?.monthly || 0) : (PLANS.find(p => p.name === selectedPlan.name)?.yearly || 0)}/{selectedPlan.billing === "monthly" ? "month" : "year"} starting {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
              </p>
            </div>

            {/* Agreement Text */}
            <p className="text-xs text-gray-600 mb-6">
              You agree that your membership will continue and that we will charge the updated fee until you cancel. You may cancel at any time to avoid future charges. To cancel, go to your account settings.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedPlan(null);
                }}
                disabled={isChangingPlan}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPlanChange}
                disabled={isChangingPlan}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isChangingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Confirm Change"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toastState.message}
        type={toastState.type}
        isVisible={toastState.isVisible}
        onClose={hideToast}
      />
    </main>
  );
}
