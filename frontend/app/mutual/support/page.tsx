"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "../../components/handyHeader";
import AIChatbot from "../../components/AIChatbot";
import ContactAgentChat from "../../components/ContactAgentChat";

export default function HelpCentrePage() {
  const router = useRouter();
  const handleLogout = () => router.push("/");

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"customer" | "handyman" | "all">("all");
  const [userType, setUserType] = useState<"customer" | "handyman" | null>(null);
  const [userName, setUserName] = useState<string>("User");
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    priority: "normal",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showChatbot, setShowChatbot] = useState(false);
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Fetch user type and username on mount
  useEffect(() => {
    const fetchUserType = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsLoadingUser(false);
          return;
        }

        // First, try to get username from JWT token
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.username) {
            setUserName(payload.username);
          }
        } catch (e) {
          console.log("Could not decode username from token");
        }

        // Try client first, then handyman
        let profileRes = await fetch("http://localhost:7000/api/clients/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!profileRes.ok) {
          profileRes = await fetch("http://localhost:7000/api/handymen/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const type = profileData.userType || (profileRes.url.includes('clients') ? 'customer' : 'handyman');
          const detectedType = type === 'customer' || type === 'client' ? 'customer' : 'handyman';
          setUserType(detectedType);
          setSelectedRole(detectedType); // Auto-select user's role
          
          // Get user's username - prioritize username from profile, fallback to name/firstName
          const name = profileData.username || profileData.name || profileData.firstName || "User";
          setUserName(name);
        }
      } catch (error) {
        console.error("Error fetching user type:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserType();
  }, []);

  const helpTopics = [
    { href: "/payment", label: "Billing & Payments", icon: "💳", color: "bg-blue-100 text-blue-700" },
    { href: "/create-service", label: "Create Services", icon: "🛠️", color: "bg-green-100 text-green-700" },
    { href: "/membership", label: "Membership Plan", icon: "⭐", color: "bg-yellow-100 text-yellow-700" },
    { href: "/messages", label: "Report an Issue", icon: "🚨", color: "bg-red-100 text-red-700" },
  ];

  const guides = [
  {
    href: "/mutual/guides/how-to-book-handyman",
    img: "/images/getstarted.jpg",
    title: "How to book a handyman for your home",
    desc: "Step-by-step guide to finding and booking the right professional",
    duration: "5 min",
    views: "12k",
    role: "customer",
  },
  {
    href: "/mutual/guides/posting-first-service",
    img: "/images/firsthandyman.jpg",
    title: "Posting your first handyman service",
    desc: "Learn how to create and publish your service offerings",
    duration: "8 min",
    views: "8k",
    role: "handyman",
  },
  {
    href: "/mutual/guides/managing-profile",
    img: "/images/managing.jpg",
    title: "Managing your profile details",
    desc: "Keep your information up to date for better matches",
    duration: "3 min",
    views: "15k",
    role: "all",
  },
  {
    href: "/mutual/guides/handycover-protection",
    img: "/images/protection.jpg",
    title: "HandyCover protection for customers",
    desc: "Understand how our protection plan keeps you covered",
    duration: "6 min",
    views: "10k",
    role: "customer",
  },
  {
    href: "/mutual/guides/managing-payments-refunds", // NEW GUIDE
    img: "/images/protection.jpg", // Use a payment image if available
    title: "Managing payments, changes, and refunds",
    desc: "Learn how to handle payments, modify bookings, and request refunds",
    duration: "7 min",
    views: "18k",
    role: "all",
  },
];

  const faqs = [
    {
      q: "How do I book a handyman?",
      a: "Search for a service, pick a time that works, and confirm your booking. You'll get a confirmation email with the details.",
      category: "Bookings",
      role: "customer",
    },
    {
      q: "What are the payment options?",
      a: "We accept credit/debit cards and major digital wallets. Payments are held securely and released after the job is completed.",
      category: "Payments",
      role: "all",
    },
    {
      q: "Can I cancel or reschedule?",
      a: "Yes. You can cancel or reschedule from your bookings page. Fees may apply for late cancellations depending on the provider's policy.",
      category: "Bookings",
      role: "customer",
    },
    {
      q: "Are handymen verified?",
      a: "All pros complete ID verification and profile checks. Check ratings and reviews on each profile before booking.",
      category: "Safety",
      role: "customer",
    },
    {
      q: "How are prices determined?",
      a: "Pricing is set by each provider based on task type, duration, and materials. You'll see an estimate before confirming.",
      category: "Payments",
      role: "all",
    },
    {
      q: "Do I need to provide tools or materials?",
      a: "Most handymen bring their own basic tools. If special materials are required, you'll discuss this with your provider before the job.",
      category: "Services",
      role: "customer",
    },
    {
      q: "Is my payment secure?",
      a: "Yes. All payments go through our secure system. Providers are paid only after the work is confirmed as complete.",
      category: "Payments",
      role: "all",
    },
    {
      q: "What if I'm not satisfied with the work?",
      a: "You can report issues directly in the app. Our support team will step in to resolve disputes and ensure fair outcomes.",
      category: "Support",
      role: "all",
    },
    {
      q: "Do you offer insurance or protection?",
      a: "Yes, jobs booked through our platform are covered by HandyCover for customers, giving you peace of mind in case of accidents or damages.",
      category: "Safety",
      role: "customer",
    },
    {
      q: "How do I become a handyman on the platform?",
      a: "Sign up, complete verification, and list your services. Once approved, you'll start receiving customer requests in your area.",
      category: "Services",
      role: "handyman",
    },
    {
      q: "How do I accept a job request?",
      a: "You'll receive notifications for new job requests. Click 'Accept' to confirm, then coordinate with the customer.",
      category: "Bookings",
      role: "handyman",
    },
    {
      q: "When do I get paid?",
      a: "Payment is released 24-48 hours after job completion and customer confirmation.",
      category: "Payments",
      role: "handyman",
    },
    {
  q: "How do I request a refund?",
  a: "Go to your booking details, click 'Request Refund', select your reason, and submit. Refunds are typically processed within 24-48 hours after review.",
  category: "Payments",
  role: "all",
},
{
  q: "Can I change my booking after payment?",
  a: "Yes! You can reschedule or modify bookings up to 24 hours before the scheduled time. Go to your Bookings page and click 'Edit' on the booking you want to change.",
  category: "Bookings",
  role: "customer",
},
{
  q: "What's the cancellation policy?",
  a: "Cancel 24+ hours before for a full refund, 12-24 hours for 50% refund. Cancellations less than 12 hours before are non-refundable unless the handyman cancels.",
  category: "Payments",
  role: "customer",
},
  ];

  const categories = ["All", ...Array.from(new Set(faqs.map((f) => f.category)))];

  // Filter FAQs and guides by role
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesSearch =
        searchQuery === "" ||
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || faq.category === selectedCategory;
      const matchesRole =
        selectedRole === "all" || faq.role === selectedRole || faq.role === "all";
      return matchesSearch && matchesCategory && matchesRole;
    });
  }, [searchQuery, selectedCategory, selectedRole]);

  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      return selectedRole === "all" || guide.role === selectedRole || guide.role === "all";
    });
  }, [selectedRole]);

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    if (!formData.subject.trim()) errors.subject = "Subject is required";
    if (!formData.message.trim()) {
      errors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters";
    }
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);
      
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/support/contact', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(formData),
        // });
        
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setShowContactForm(false);
        setFormData({ name: "", email: "", subject: "", message: "", priority: "normal" });
        showToastNotification("Message sent successfully! We'll respond within 24 hours.", "success");
      } catch (error) {
        setIsSubmitting(false);
        showToastNotification("Failed to send message. Please try again.", "error");
      }
    }
  };

  const showToastNotification = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F8F8] via-white to-[#FFF8F2]">
      <Header pageTitle="Help Center" onLogout={handleLogout} />

      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed top-20 right-4 z-50 animate-fadeIn ${
            toastType === "success" ? "bg-green-600" : "bg-red-600"
          } text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md`}
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            {toastType === "success" ? (
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            )}
          </svg>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        {/* HERO SECTION */}
        <section className="pt-12 sm:pt-16 lg:pt-20 pb-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4A574]/20 text-[#5C4033] text-xs font-semibold mb-6">
              <span className="w-2 h-2 bg-[#D4A574] rounded-full animate-pulse"></span>
              Support available 24/7
            </div>
            <p className="text-xl sm:text-2xl text-[#5C4033]/90 mb-3 font-medium">
              Hello, {userName}!
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight text-[#5C4033] mb-4">
              How can we <span className="bg-gradient-to-r from-[#D4A574] via-[#C4956A] to-[#B8A565] bg-clip-text text-transparent">help you</span> today?
            </h1>
            <p className="text-lg sm:text-xl text-[#5C4033]/80 mb-8 max-w-2xl mx-auto">
              Find answers, browse guides, or get in touch with our support team
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-[#5C4033]/40">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FAQs, guides, payments, bookings..."
                className="w-full h-16 pl-14 pr-20 rounded-2xl border-2 border-[#EED9C4] bg-white shadow-lg text-base text-[#5C4033] placeholder:text-[#5C4033]/50 focus:outline-none focus:ring-4 focus:ring-[#D4A574]/20 focus:border-[#D4A574] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-16 flex items-center text-[#5C4033]/40 hover:text-[#5C4033] transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
              <button
                type="button"
                className="absolute inset-y-0 right-2 my-2 px-6 py-2 rounded-xl bg-[#D4A574] text-[#5C4033] font-bold hover:bg-[#C4956A] transition shadow-md"
              >
                Search
              </button>
            </div>
            {searchQuery && (
              <p className="mt-4 text-sm text-[#5C4033]/70">
                Found <span className="font-semibold">{filteredFaqs.length}</span> result
                {filteredFaqs.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Airbnb-style Role Tabs - BELOW SEARCH BAR, LEFT ALIGNED */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="flex items-center gap-1 border-b border-[#EED9C4]">
              <button
                onClick={() => setSelectedRole("all")}
                className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  selectedRole === "all"
                    ? "text-[#5C4033] border-[#D4A574]"
                    : "text-[#5C4033]/60 border-transparent hover:text-[#5C4033]"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedRole("customer")}
                className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  selectedRole === "customer"
                    ? "text-[#5C4033] border-[#D4A574]"
                    : "text-[#5C4033]/60 border-transparent hover:text-[#5C4033]"
                }`}
              >
                Customer
              </button>
              <button
                onClick={() => setSelectedRole("handyman")}
                className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  selectedRole === "handyman"
                    ? "text-[#5C4033] border-[#D4A574]"
                    : "text-[#5C4033]/60 border-transparent hover:text-[#5C4033]"
                }`}
              >
                Handyman
              </button>
            </div>
          </div>
        </section>

        {/* CONTACT OPTIONS */}
        <section className="mt-12 mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setShowContactForm(true)}
              className="group flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-[#EED9C4] shadow-md hover:shadow-xl hover:border-[#D4A574] hover:-translate-y-1 transition-all"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="text-left flex-1">
                <h3 className="text-sm font-bold text-[#5C4033] mb-0.5">Email Support</h3>
                <p className="text-xs text-[#5C4033]/70">Response within 24 hours</p>
              </div>
            </button>

            <a
              href="tel:+1234567890"
              className="group flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-[#EED9C4] shadow-md hover:shadow-xl hover:border-[#D4A574] hover:-translate-y-1 transition-all"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-200 transition">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div className="text-left flex-1">
                <h3 className="text-sm font-bold text-[#5C4033] mb-0.5">Call Us</h3>
                <p className="text-xs text-[#5C4033]/70">Mon-Fri, 9am-6pm EST</p>
              </div>
            </a>

            <button
              onClick={() => setShowChatbot(true)}
              className="group flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-[#EED9C4] shadow-md hover:shadow-xl hover:border-[#D4A574] hover:-translate-y-1 transition-all"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#D4A574] flex items-center justify-center text-[#5C4033] group-hover:bg-[#C4956A] transition">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div className="text-left flex-1">
                <h3 className="text-sm font-bold text-[#5C4033] mb-0.5">AI Chat Assistant</h3>
                <p className="text-xs text-[#5C4033]/70">Instant responses available</p>
              </div>
            </button>
          </div>
        </section>

        {/* HELP TOPICS */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#5C4033]">
              Popular Help Topics
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {helpTopics.map(({ href, label, icon, color }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border-2 border-[#EED9C4] shadow-md hover:shadow-xl hover:border-[#D4A574] hover:-translate-y-1 transition-all"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">
                  {icon}
                </span>
                <span className="text-sm font-semibold text-[#5C4033] text-center">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* GUIDES */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#5C4033]">
              Getting Started Guides
            </h2>
            <Link
              href="/guides"
              className="text-sm font-semibold text-[#D4A574] hover:text-[#C4956A] flex items-center gap-1 transition"
            >
              View all
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredGuides.map(({ href, img, title, desc, duration, views }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl bg-white border-2 border-[#EED9C4] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
              >
                <div className="relative w-full aspect-[4/3] bg-[#EED9C4] overflow-hidden">
                  <Image
                    src={img}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold rounded-lg">
                    {duration}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-base font-bold text-[#5C4033] mb-2 group-hover:text-[#D4A574] transition line-clamp-2">
                    {title}
                  </h3>
                  <p className="text-sm text-[#5C4033]/70 flex-1 line-clamp-2 mb-3">
                    {desc}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[#5C4033]/60">
                    <span>{views} views</span>
                    <span className="font-semibold text-[#D4A574] flex items-center gap-1">
                      Read guide
                      <svg
                        className="w-3 h-3 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mt-20">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#5C4033] mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-[#5C4033]/70">
              Quick answers to the most common questions
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-[#D4A574] text-[#5C4033] shadow-lg scale-105"
                    : "bg-white text-[#5C4033]/70 border-2 border-[#EED9C4] hover:border-[#D4A574] hover:text-[#5C4033]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-4 max-w-4xl mx-auto">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-[#EED9C4]">
                <svg
                  className="w-16 h-16 mx-auto text-[#5C4033]/30 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-[#5C4033]/70 text-lg">No FAQs match your search.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="mt-4 text-sm font-semibold text-[#D4A574] hover:text-[#C4956A] transition"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filteredFaqs.map(({ q, a }, i) => (
                <details
                  key={i}
                  className="group rounded-2xl bg-white border-2 border-[#EED9C4] px-6 py-5 shadow-md hover:shadow-lg hover:border-[#D4A574] transition-all"
                >
                  <summary className="list-none cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-[#5C4033]">
                          {q}
                        </h3>
                      </div>
                      <span className="flex-shrink-0 grid h-10 w-10 place-items-center rounded-full bg-[#D4A574] text-[#5C4033] transition group-open:bg-[#C4956A] group-open:rotate-180">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </summary>
                  <div className="pt-4 mt-4 text-sm sm:text-base leading-relaxed text-[#5C4033]/80 border-t border-[#EED9C4]">
                    {a}
                  </div>
                </details>
              ))
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-20 rounded-3xl bg-gradient-to-br from-[#D4A574] to-[#C4956A] p-10 sm:p-16 text-center shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#5C4033] mb-3">
            Still need help?
          </h2>
          <p className="text-lg text-[#5C4033]/90 mb-8 max-w-2xl mx-auto">
            Our support team is here to assist you 24/7
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowContactForm(true)}
              className="px-8 py-4 bg-white text-[#5C4033] font-bold rounded-xl hover:bg-[#FFF8F2] transition shadow-xl hover:scale-105"
            >
              Contact Support
            </button>
            <a
              href="tel:+1234567890"
              className="px-8 py-4 bg-[#5C4033] text-white font-bold rounded-xl hover:bg-[#4a3328] transition shadow-xl hover:scale-105"
            >
              Call Now
            </a>
          </div>
        </section>
      </main>

      {/* CONTACT FORM MODAL */}
      {showContactForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowContactForm(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b-2 border-[#EED9C4] px-8 py-6 flex items-center justify-between rounded-t-3xl z-10">
              <h3 className="text-2xl font-bold text-[#5C4033]">Contact Support</h3>
              <button
                onClick={() => setShowContactForm(false)}
                className="text-[#5C4033]/50 hover:text-[#5C4033] transition p-2 hover:bg-[#EED9C4] rounded-lg"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#5C4033] mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      formErrors.name
                        ? "border-red-400"
                        : "border-[#EED9C4] focus:border-[#D4A574]"
                    } bg-[#FFF8F2] text-[#5C4033] focus:outline-none focus:ring-4 focus:ring-[#D4A574]/20 transition`}
                    placeholder="John Doe"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#5C4033] mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-xl border-2 ${
                      formErrors.email
                        ? "border-red-400"
                        : "border-[#EED9C4] focus:border-[#D4A574]"
                    } bg-[#FFF8F2] text-[#5C4033] focus:outline-none focus:ring-4 focus:ring-[#D4A574]/20 transition`}
                    placeholder="john@example.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#5C4033] mb-2">
                  Priority Level
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#EED9C4] bg-[#FFF8F2] text-[#5C4033] focus:outline-none focus:ring-4 focus:ring-[#D4A574]/20 focus:border-[#D4A574] transition"
                >
                  <option value="low">Low - General inquiry</option>
                  <option value="normal">Normal - Standard support</option>
                  <option value="high">High - Urgent issue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#5C4033] mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    formErrors.subject
                      ? "border-red-400"
                      : "border-[#EED9C4] focus:border-[#D4A574]"
                  } bg-[#FFF8F2] text-[#5C4033] focus:outline-none focus:ring-4 focus:ring-[#D4A574]/20 transition`}
                  placeholder="How can we help?"
                />
                {formErrors.subject && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.subject}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#5C4033] mb-2">
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={6}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    formErrors.message
                      ? "border-red-400"
                      : "border-[#EED9C4] focus:border-[#D4A574]"
                  } bg-[#FFF8F2] text-[#5C4033] focus:outline-none focus:ring-4 focus:ring-[#D4A574]/20 transition resize-none`}
                  placeholder="Describe your issue in detail..."
                />
                {formErrors.message && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.message}</p>
                )}
                <p className="mt-1 text-xs text-[#5C4033]/60">
                  {formData.message.length}/500 characters
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="flex-1 px-6 py-3.5 rounded-xl border-2 border-[#EED9C4] text-[#5C4033] font-semibold hover:bg-[#FFF8F2] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3.5 rounded-xl bg-[#D4A574] text-[#5C4033] font-bold hover:bg-[#C4956A] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Chatbot */}
      <AIChatbot 
        isOpen={showChatbot} 
        onClose={() => setShowChatbot(false)}
        userType={userType}
        onTransferToAgent={() => setShowAgentChat(true)}
      />

      {/* Contact Agent Chat */}
      <ContactAgentChat
        isOpen={showAgentChat}
        onClose={() => setShowAgentChat(false)}
        userType={userType || undefined}
        userId={userId}
        onChatEnded={() => {
          setShowAgentChat(false);
          setShowChatbot(true);
          showToastNotification("Chat ended. You can start a new conversation anytime!", "success");
        }}
      />
    </div>
  );
}