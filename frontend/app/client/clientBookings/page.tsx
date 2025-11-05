"use client";
import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function BookHandymanPage() {
  const searchParams = useSearchParams();
  const selectedService = searchParams.get("service");

  const [filter, setFilter] = useState("All");
  const handyman = {
    name: "Kenji Teneka",
    image: "/images/handyman-profile.jpg",
    rating: 4.8,
    services: [
      { name: "Residential Wiring Repair", price: 55, rating: 5 },
      { name: "Load Repair", price: 50, rating: 4 },
      { name: "Appliance Installation", price: 60, rating: 5 },
    ],
  };

  const filteredServices =
    filter === "All" ? handyman.services : handyman.services.filter((s) => s.rating >= parseInt(filter));

  return (
    <main className="bg-[#F8F8F8] min-h-screen text-[#5C4033] flex flex-col">
      {/* ================= HEADER ================= */}
      <section className="bg-[#5C4033] pb-6 text-center shadow-md border-b-4 border-[#EED9C4]">
        <h1 className="text-3xl font-bold text-[#EED9C4] pt-6 mb-4">
          Book Handyman
        </h1>
        <div className="flex justify-center gap-4 flex-wrap">
          {["All", "4", "5"].map((rating) => (
            <button
              key={rating}
              onClick={() => setFilter(rating)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition
                ${
                  filter === rating
                    ? "bg-[#C4956A] text-white"
                    : "bg-[#EED9C4] text-[#5C4033] hover:bg-[#E3C7A8]"
                }`}
            >
              {rating === "All" ? "All Ratings" : `${rating}+ Stars`}
            </button>
          ))}
        </div>
      </section>

      {/* ================= HANDYMAN INFO ================= */}
      <section className="px-4 py-8 max-w-4xl mx-auto text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#C4956A]">
            <Image src={handyman.image} alt={handyman.name} fill className="object-cover" />
          </div>
          <h2 className="text-2xl font-bold text-[#C4956A]">{handyman.name}</h2>
          <p className="text-[#5C4033]">⭐ {handyman.rating} / 5</p>
        </div>
      </section>

      {/* ================= SERVICES LIST ================= */}
      <section className="px-4 py-8 max-w-5xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 text-[#C4956A]">Available Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl shadow-lg p-4 flex flex-col gap-2 border border-[#EED9C4] hover:shadow-xl transition
                ${selectedService === service.name ? "border-2 border-[#C4956A]" : ""}`}
            >
              <h4 className="text-lg font-bold text-[#C4956A]">{service.name}</h4>
              <p className="text-[#5C4033]">⭐ {service.rating}/5</p>
              <p className="text-[#5C4033] font-semibold">${service.price} CAD/HR</p>
              <button
                onClick={() => alert(`✅ Booking confirmed for ${service.name}`)}
                className="mt-2 bg-[#C4956A] text-white rounded-lg py-2 hover:bg-[#D4A574] transition"
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
