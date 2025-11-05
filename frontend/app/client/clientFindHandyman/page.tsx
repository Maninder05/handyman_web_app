"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Bell } from "lucide-react";
import { FiUser } from "react-icons/fi";
import { useRouter } from "next/navigation";

// ✅ Define proper TypeScript interfaces
interface Service {
  name: string;
  category: string;
  image: string;
}

interface Handyman {
  name: string;
  rating: number;
  location: string;
  experience: string;
  image: string;
  paymentType?: "Hourly" | "Fixed";
  price?: number;
}

export default function BrowseServicesPage(): React.JSX.Element {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [step, setStep] = useState<"browse" | "filter" | "results">("browse");
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [filters, setFilters] = useState({
    rating: "",
    address: "",
    radius: "",
    experience: "",
    paymentType: "",
    priceFrom: "",
    priceTo: "",
  });

  const toggleMenu = (): void => {
    setShowMenu(!showMenu);
    setShowProfileMenu(false);
  };

  const toggleProfile = (): void => {
    setShowProfileMenu(!showProfileMenu);
    setShowMenu(false);
  };

  const handleLogout = (): void => router.push("/");

  // ✅ Services list
  const services: Service[] = [
    { name: "Wiring Repair", category: "Electrical", image: "/images/wiringrepair.jpg" },
    { name: "Pipe Leakage Fix", category: "Plumbing", image: "/images/pipefix.webp" },
    { name: "Custom Furniture", category: "Carpentry", image: "/images/furniturefix.webp" },
    { name: "Appliance Installation", category: "Appliances", image: "/images/applianceinstall.jpg" },
    { name: "Wall Painting", category: "Painting & Finishing", image: "/images/wallpaint.avif" },
    { name: "Deep Cleaning", category: "Cleaning", image: "/images/deepclean.webp" },
    { name: "Lawn Mowing", category: "Landscaping", image: "/images/lawnmowing.jpeg" },
    { name: "Flooring Installation", category: "Renovation", image: "/images/floorinstall.jpg" },
    { name: "Door & Lock Repair", category: "Carpentry", image: "/images/fixdoorlock.jpg" },
    { name: "Ceiling Fan Installation", category: "Electrical", image: "/images/ceilingfan.jpg" },
    { name: "Roof Leak Repair", category: "Roofing", image: "/images/roofleakrepair.jpg" },
    { name: "Drywall & Plaster Fix", category: "Renovation", image: "/images/drywallrepair.jpg" },
    { name: "Furniture Assembly", category: "General Repairs", image: "/images/furnitureassemble.jpg" },
  ];

  // ✅ Handymen list
  const handymen: Handyman[] = [
    { name: "John Electric", rating: 4.8, location: "Toronto", experience: "5+", image: "/images/handyman1.jpg", paymentType: "Hourly", price: 40 },
    { name: "Mark Fixit", rating: 4.5, location: "Ottawa", experience: "3-5", image: "/images/handyman2.jpg", paymentType: "Fixed", price: 120 },
    { name: "Sarah Sparks", rating: 4.9, location: "Toronto", experience: "5+", image: "/images/handyman3.jpg", paymentType: "Hourly", price: 50 },
  ];

  const handleSelectService = (service: Service): void => {
    setSelectedService(service);
    setStep("filter");
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFind = (): void => {
    setStep("results");
  };

  const filteredHandymen = handymen.filter((h) => {
    const matchRating = filters.rating ? h.rating >= Number(filters.rating) : true;
    const matchExperience = filters.experience ? h.experience === filters.experience : true;
    const matchPayment = filters.paymentType ? h.paymentType === filters.paymentType : true;
    const matchPriceFrom = filters.priceFrom ? h.price! >= Number(filters.priceFrom) : true;
    const matchPriceTo = filters.priceTo ? h.price! <= Number(filters.priceTo) : true;
    return matchRating && matchExperience && matchPayment && matchPriceFrom && matchPriceTo;
  });

  return (
    <main className="bg-[#F5F5F0] min-h-screen text-[#1a1a1a] flex flex-col">
      {/* ================= HEADER ================= */}
      <header className="bg-[#1a1a1a] shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-white tracking-wide">Browse Services</h1>

          <div className="flex items-center gap-4 relative">
            <button className="relative p-2 rounded-full hover:bg-[#2a2a2a] transition">
              <Bell size={22} className="text-white" />
            </button>

            <button
              onClick={toggleProfile}
              className="p-2 rounded-full hover:bg-[#2a2a2a] transition"
            >
              <FiUser size={24} className="text-white" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-14 top-14 bg-white border border-gray-200 rounded-lg shadow-xl w-52 z-50">
                <ul className="text-sm text-gray-800">
                  <li>
                    <Link
                      href="/handyAccount"
                      className="block px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      View Account
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-5 py-3 text-[#C41E3A] hover:bg-red-50 transition font-medium"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}

            <button
              onClick={toggleMenu}
              className="p-2 rounded-md bg-[#D4A574] text-white hover:bg-[#B8A565] transition"
            >
              {showMenu ? <X size={26} /> : <Menu size={26} />}
            </button>

            {showMenu && (
              <div className="absolute right-0 top-14 bg-white border border-gray-200 rounded-xl shadow-xl w-72 text-sm z-50 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                  <li>
                    <Link
                      href="/client/post-job"
                      className="block px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                      onClick={() => setShowMenu(false)}
                    >
                      Post a Job
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/client/find-handyman"
                      className="block px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                      onClick={() => setShowMenu(false)}
                    >
                      Find Handyman
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/client/bookings"
                      className="block px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                      onClick={() => setShowMenu(false)}
                    >
                      Recent Bookings
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/client/help"
                      className="block px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                      onClick={() => setShowMenu(false)}
                    >
                      Help & Support
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/settings"
                      className="block px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                      onClick={() => setShowMenu(false)}
                    >
                      Settings
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================= STEP 1: BROWSE ================= */}
      {step === "browse" && (
        <section className="px-6 py-12 max-w-[1400px] mx-auto w-full">
          <h2 className="text-3xl font-bold mb-10 text-[#D4A574] text-center">
            Explore Handyman Services
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service) => (
              <div
                key={service.name}
                onClick={() => handleSelectService(service)}
                className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-[#D4A574] hover:shadow-xl transition cursor-pointer text-center group"
              >
                <Image
                  src={service.image}
                  alt={service.name}
                  width={200}
                  height={150}
                  className="rounded-lg object-cover w-full h-40 mb-4"
                />
                <h4 className="font-bold text-[#1a1a1a]">{service.name}</h4>
                <p className="text-gray-500 text-sm mt-1">{service.category}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= STEP 2: FILTER ================= */}
      {step === "filter" && (
        <section className="px-6 py-12 max-w-2xl mx-auto w-full">
          <h2 className="text-3xl font-bold mb-6 text-[#D4A574] text-center">
            Filter Handymen for {selectedService?.name}
          </h2>
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Rating</label>
                <input
                  type="number"
                  name="rating"
                  value={filters.rating}
                  onChange={handleFilterChange}
                  placeholder="4.0"
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Experience</label>
                <select
                  name="experience"
                  value={filters.experience}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option value="">Any</option>
                  <option value="1-3">1-3 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5+">5+ years</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Payment Type</label>
                <select
                  name="paymentType"
                  value={filters.paymentType}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option value="">Any</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Fixed">Fixed</option>
                </select>
              </div>
              <div className="flex gap-3">
                <input
                  type="number"
                  name="priceFrom"
                  value={filters.priceFrom}
                  onChange={handleFilterChange}
                  placeholder="Min Price"
                  className="w-1/2 border border-gray-300 rounded-lg p-2"
                />
                <input
                  type="number"
                  name="priceTo"
                  value={filters.priceTo}
                  onChange={handleFilterChange}
                  placeholder="Max Price"
                  className="w-1/2 border border-gray-300 rounded-lg p-2"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep("browse")}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Back
              </button>
              <button
                onClick={handleFind}
                className="px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#B8A565] transition"
              >
                Find Handymen
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ================= STEP 3: RESULTS ================= */}
      {step === "results" && (
        <section className="px-6 py-12 max-w-6xl mx-auto w-full">
          <h2 className="text-3xl font-bold mb-8 text-[#D4A574] text-center">
            Available Handymen
          </h2>
          {filteredHandymen.length === 0 ? (
            <p className="text-center text-gray-500">
              No handymen found matching your filters.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredHandymen.map((h) => (
                <div
                  key={h.name}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition text-center"
                >
                  <Image
                    src={h.image}
                    alt={h.name}
                    width={200}
                    height={150}
                    className="rounded-lg object-cover w-full h-40 mb-4"
                  />
                  <h4 className="font-bold text-[#1a1a1a] text-lg mb-1">{h.name}</h4>
                  <p className="text-gray-500 text-sm mb-2">
                    ⭐ {h.rating} | {h.experience} yrs | {h.location}
                  </p>
                  <p className="text-gray-600 text-sm mb-3">
                    {h.paymentType}: ${h.price}
                  </p>
                  <button className="px-6 py-2 bg-[#D4A574] text-white rounded-lg hover:bg-[#B8A565] transition">
                    Book Now
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-10 text-center">
            <button
              onClick={() => setStep("filter")}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Back to Filters
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
