"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
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

export default function BrowseServicesPage(): JSX.Element {
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
    <main className="bg-[#F8F8F8] min-h-screen text-[#5C4033] flex flex-col">
      {/* ================= HEADER ================= */}
      <header className="bg-[#5C4033] shadow-md relative py-4 px-4 border-b-4 border-[#EED9C4]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#EED9C4] tracking-wide">Browse Services</h1>
          <div className="flex items-center gap-4 relative">
            <button onClick={toggleProfile} className="p-2 rounded-full hover:bg-[#C4956A]/30 transition">
              <FiUser size={22} className="text-[#EED9C4]" />
            </button>
            {showProfileMenu && (
              <div className="absolute right-14 top-14 bg-[#FFF8F2] rounded-xl shadow-lg border border-[#EED9C4] w-48 z-50">
                <ul className="text-sm divide-y divide-[#EED9C4]">
                  <li>
                    <Link href="/handyAccount" className="block px-4 py-3 hover:bg-[#EED9C4]/40 transition text-[#5C4033]">
                      View Account
                    </Link>
                  </li>
                  <li>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-[#C4956A] hover:bg-[#EED9C4]/40 transition">
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
            <button onClick={toggleMenu} className="p-2 rounded-md hover:bg-[#EED9C4]/40 bg-[#C4956A] text-white transition">
              {showMenu ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </header>

      {/* ================= STEP 1: BROWSE ================= */}
      {step === "browse" && (
        <section className="px-6 py-12 max-w-[1400px] mx-auto w-full">
          <h2 className="text-3xl font-bold mb-10 text-[#C4956A] text-center">Explore Handyman Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                onClick={() => handleSelectService(service)}
                className="bg-white rounded-3xl overflow-hidden shadow-lg border border-[#EED9C4] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col cursor-pointer"
              >
                <div className="relative w-full h-48">
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <span className="absolute bottom-3 left-4 bg-[#EED9C4] text-[#5C4033] px-3 py-1 rounded-full text-xs font-semibold shadow">
                    {service.category}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1 items-center">
                  <h3 className="text-lg font-semibold text-[#5C4033] mb-1 text-center">{service.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= STEP 2: FILTER ================= */}
      {step === "filter" && selectedService && (
        <section className="min-h-screen bg-[#FFF8F2] flex flex-col items-center py-12 px-6">
          <h2 className="text-4xl font-bold text-[#C4956A] mb-8 text-center">
            Find the Perfect Handyman for {selectedService.name}
          </h2>

          <div className="flex flex-col gap-6 w-full max-w-3xl">
            {/* ⭐ Rating */}
            <div className="flex flex-col">
              <label className="text-[#5C4033] font-semibold mb-2">Minimum Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFilters({ ...filters, rating: star.toString() })}
                    className={`text-3xl ${
                      Number(filters.rating) >= star ? "text-yellow-400" : "text-gray-300"
                    } hover:scale-110 transition`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* 📍 Address */}
            <div className="flex flex-col">
              <label className="text-[#5C4033] font-semibold mb-2">Your Location</label>
              <input
                name="address"
                type="text"
                placeholder="Enter your address"
                value={filters.address}
                onChange={handleFilterChange}
                className="border border-[#EED9C4] rounded-xl p-4 mb-3"
              />
              <select
                name="radius"
                value={filters.radius}
                onChange={handleFilterChange}
                className="border border-[#EED9C4] rounded-xl p-4"
              >
                <option value="">Select Radius</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="25">Within 25 km</option>
                <option value="50">Within 50 km</option>
              </select>
            </div>

            {/* 🧰 Experience */}
            <div className="flex flex-col">
              <label className="text-[#5C4033] font-semibold mb-2">Experience Level</label>
              <select
                name="experience"
                value={filters.experience}
                onChange={handleFilterChange}
                className="border border-[#EED9C4] rounded-xl p-4"
              >
                <option value="">Any</option>
                <option value="1-3">1–3 years</option>
                <option value="3-5">3–5 years</option>
                <option value="5+">5+ years</option>
              </select>
            </div>

            {/* 💵 Payment Type */}
            <div className="flex flex-col">
              <label className="text-[#5C4033] font-semibold mb-2">Payment Type</label>
              <select
                name="paymentType"
                value={filters.paymentType}
                onChange={handleFilterChange}
                className="border border-[#EED9C4] rounded-xl p-4"
              >
                <option value="">Any</option>
                <option value="Hourly">Hourly</option>
                <option value="Fixed">Fixed</option>
              </select>
            </div>

            {/* 💰 Price Range */}
            <div className="flex flex-col">
              <label className="text-[#5C4033] font-semibold mb-2">Price Range ($)</label>
              <div className="flex gap-4">
                <input
                  name="priceFrom"
                  type="number"
                  placeholder="From"
                  value={filters.priceFrom}
                  onChange={handleFilterChange}
                  className="border border-[#EED9C4] rounded-xl p-4 flex-1"
                />
                <input
                  name="priceTo"
                  type="number"
                  placeholder="To"
                  value={filters.priceTo}
                  onChange={handleFilterChange}
                  className="border border-[#EED9C4] rounded-xl p-4 flex-1"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between mt-10">
              <button
                onClick={() => setStep("browse")}
                className="bg-[#EED9C4] text-[#5C4033] font-semibold py-3 px-6 rounded-xl hover:bg-[#E3C7A8] transition"
              >
                ← Back
              </button>
              <button
                onClick={handleFind}
                className="bg-[#C4956A] text-white font-semibold py-3 px-6 rounded-xl hover:bg-[#B3835F] transition"
              >
                Find Handymen
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ================= STEP 3: RESULTS ================= */}
      {step === "results" && (
        <section className="max-w-[1300px] mx-auto py-12">
          <h2 className="text-3xl font-bold text-[#C4956A] mb-8 text-center">
            Handymen for {selectedService?.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHandymen.map((h, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl shadow-lg border border-[#EED9C4] overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all"
              >
                <div className="relative w-full h-56">
                  <Image
                    src={h.image}
                    alt={h.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#5C4033]">{h.name}</h3>
                  <p className="text-[#C4956A] font-semibold mt-1">{h.location}</p>
                  <p className="text-sm text-[#5C4033]/70 mt-2">
                    ⭐ {h.rating} | {h.experience} years exp | {h.paymentType} | ${h.price}
                  </p>
                  <button
                    className="mt-4 w-full bg-[#C4956A] text-white py-2 rounded-xl font-semibold hover:bg-[#B3835F] transition"
                    onClick={() => alert(`Booked ${h.name}`)}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <button
              onClick={() => setStep("filter")}
              className="bg-[#EED9C4] text-[#5C4033] font-semibold py-3 px-6 rounded-xl hover:bg-[#E3C7A8] transition"
            >
              ← Back to Filters
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
