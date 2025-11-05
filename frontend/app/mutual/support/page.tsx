"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "../../components/handyHeader";

export default function HelpCentrePage() {
  const router = useRouter();
  const handleLogout = () => router.push("/");
  
  return (
    <div className="min-h-screen bg-white text-black">
      {/* HEADER */}
      <div>
        <Header pageTitle="Help Center" onLogout={handleLogout} />
      </div>

      <main className="mx-auto max-w-[1100px] px-6">
        {/* HERO */}
        <section className="py-20 md:py-28">
          <h1 className="font-extrabold leading-tight tracking-tight text-center text-3xl sm:text-5xl md:text-6xl max-w-4xl mx-autobg-gray-300">
            Hello User, how can we help?
          </h1>

          <div className="mt-6 flex justify-center">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Search how-to-do and more"
                className="h-10 w-72 rounded-full border border-gray-600bg-[#D4A574]  px-4 text-sm text-black focus:outline-none focus:ring-0"
              />
              <button
                type="button"
                className="h-10 inline-flex items-center justify-center rounded-full px-4 text-sm font-medium leading-none bg-[#D4A574] text-gray-900 hover:bg-[#f7c088] cursor-pointer transition"
              >
                Search
              </button>
            </form>
          </div>
        </section>

        {/* HELP TOPICS */}
        <section className="mt-8 max-w-5xl mx-auto px-6 text-left">
          <h2 className="text-2xl font-semibold mb-6bg-gray-300">
            Help Topics
          </h2>
          <div className="flex justify-between gap-4">
            {[
              { href: "/payment", label: "Billing & Payments" },
              { href: "/create-service", label: "Create Services" },
              { href: "/membership", label: "Membership Plan" },
              { href: "/messages", label: "Report an Issue" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex-1 text-center px-6 py-3 rounded-lgbg-[#D4A574]  text-gray-500 font-medium hover:text-gray-900 transition"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        {/* GUIDES */}
        <section className="mt-10 max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-semibold mb-6bg-gray-300">
            Guides for getting started
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                href: "/book-services",
                img: "/images/getstarted.jpg",
                title: "How to book a handyman for your home",
                desc: "Step-by-step guide to finding and booking the right professional",
              },
              {
                href: "/create-service",
                img: "/images/firsthandyman.jpg",
                title: "Posting your first handyman service",
                desc: "Learn how to create and publish your service offerings",
              },
              {
                href: "/portfolio",
                img: "/images/managing.jpg",
                title: "Managing your profile details",
                desc: "Keep your information up to date for better matches",
              },
              {
                href: "/account",
                img: "/images/protection.jpg",
                title: "HandyCover protection for customers",
                desc: "Understand how our protection plan keeps you covered",
              },
            ].map(({ href, img, title, desc }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg border border-gray-700bg-[#D4A574]  p-4 text-left shadow-sm hover:shadow-lg hover:-translate-y-1 transition"
              >
                <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden mb-3 bg-gray-700">
                  <Image
                    src={img}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <h3 className="font-semibold mb-1bg-gray-300">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mt-14 max-w-5xl mx-auto px-6">
          <h2 className="mb-8 text-center text-4xl sm:text-5xl font-extrabold uppercase tracking-tightbg-gray-300">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "How do I book a handyman?",
                a: "Search for a service, pick a time that works, and confirm your booking. You’ll get a confirmation email with the details.",
              },
              {
                q: "What are the payment options?",
                a: "We accept credit/debit cards and major digital wallets. Payments are held securely and released after the job is completed.",
              },
              {
                q: "Can I cancel or reschedule?",
                a: "Yes. You can cancel or reschedule from your bookings page. Fees may apply for late cancellations depending on the provider’s policy.",
              },
              {
                q: "Are handymen verified?",
                a: "All pros complete ID verification and profile checks. Check ratings and reviews on each profile before booking.",
              },
              {q: "How are prices determined?", a: "Pricing is set by each provider based on task type, duration, and materials. You’ll see an estimate before confirming."},
              {q: "Do I need to provide tools or materials?", a: "Most handymen bring their own basic tools. If special materials are required, you’ll discuss this with your provider before the job."},
              {q: "Is my payment secure?", a: "Yes. All payments go through our secure system. Providers are paid only after the work is confirmed as complete."},
              {q: "What if I’m not satisfied with the work?", a: "You can report issues directly in the app. Our support team will step in to resolve disputes and ensure fair outcomes."},
              {q: "Do you offer insurance or protection?", a: "Yes, jobs booked through our platform are covered by HandyCover for customers, giving you peace of mind in case of accidents or damages."},
              {q: "How do I become a handyman on the platform?", a: "Sign up, complete verification, and list your services. Once approved, you’ll start receiving customer requests in your area."},
            ].map(({ q, a }, i) => (
              <details
                key={i}
                className="group rounded-2xlbg-[#D4A574]  px-5 sm:px-6 py-4 sm:py-5 shadow-sm hover:bg-[#e7e5e3] transition"
              >
                <summary className="list-none cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 text-base sm:text-lg font-mediumbg-gray-300">
                      {q}
                    </div>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#D4A574] transition">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 transition-transform group-open:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6 -6" />
                      </svg>
                    </span>
                  </div>
                </summary>
                <div className="pt-3 sm:pt-4 text-sm sm:text-[15px] leading-relaxed text-black">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </section>

        <footer className="mt-16 w-full h-20" />
      </main>
    </div>
  );
}

