"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Bell } from "lucide-react";
import { FiUser } from "react-icons/fi";
import { useRouter } from "next/navigation";

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

interface HandymanResponse {
  handymanId?: {
    name?: string;
    rating?: number;
    location?: string;
    experience?: string;
  };
  images?: string[];
  price?: number;
}


export default function BrowseServicesPage(): React.JSX.Element {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [step, setStep] = useState<"browse" | "results">("browse");
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [filters, setFilters] = useState({
    rating: "",
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

const [handymen, setHandymen] = useState<Handyman[]>([]);

React.useEffect(() => {
  if (selectedService) {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/find-handyman?category=${selectedService.category}`)
      .then(res => res.json())
      .then((data: HandymanResponse[]) => {
        setHandymen(
          data.map((s) => ({
            name: s.handymanId?.name || "Unknown",
            rating: s.handymanId?.rating || 0,
            location: s.handymanId?.location || "N/A",
            experience: s.handymanId?.experience || "N/A",
            image: s.images?.[0] 
              ? `${process.env.NEXT_PUBLIC_API_URL}${s.images[0]}`
              : "/images/default-handyman.jpg",
            paymentType: "Hourly",
            price: s.price || 0
          }))
        );
      })
      .catch(err => console.error("Fetch error:", err));
  }
}, [selectedService]);


  const handleSelectService = (service: Service): void => {
    setSelectedService(service);
    setStep("results");
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
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

            <button onClick={toggleProfile} className="p-2 rounded-full hover:bg-[#2a2a2a] transition">
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
                      href="/client/clientFindHandyman"
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

      {/* ================= STEP 1: BROWSE SERVICES ================= */}
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

      {/* ================= STEP 2: RESULTS WITH FILTER PANEL ================= */}
      {step === "results" && (
        <section className="px-6 py-12 max-w-[1400px] mx-auto w-full">
          <h2 className="text-3xl font-bold mb-10 text-[#D4A574] text-center">
            {selectedService ? `Handymen for ${selectedService.name}` : "Available Handymen"}
          </h2>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* LEFT SIDE: HANDYMEN RESULTS */}
            <div className="flex-1">
              {filteredHandymen.length === 0 ? (
                <p className="text-center text-gray-500 mt-10">
                  No handymen found matching your filters.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8">
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
            </div>

            {/* RIGHT SIDE: FILTERS */}
            <aside className="w-full lg:w-[320px] bg-white border border-gray-200 shadow-lg rounded-xl p-6 h-fit sticky top-24 self-start">
              <h3 className="text-xl font-semibold mb-6 text-[#D4A574]">Filters</h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Rating</label>
                  <input
                    type="number"
                    name="rating"
                    value={filters.rating}
                    onChange={handleFilterChange}
                    placeholder="e.g. 4.5"
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Experience</label>
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
                  <label className="block text-sm font-medium mb-1">Payment Type</label>
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

                <div>
                  <label className="block text-sm font-medium mb-1">Price Range</label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      name="priceFrom"
                      value={filters.priceFrom}
                      onChange={handleFilterChange}
                      placeholder="Min"
                      className="w-1/2 border border-gray-300 rounded-lg p-2"
                    />
                    <input
                      type="number"
                      name="priceTo"
                      value={filters.priceTo}
                      onChange={handleFilterChange}
                      placeholder="Max"
                      className="w-1/2 border border-gray-300 rounded-lg p-2"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setFilters({ rating: "", experience: "", paymentType: "", priceFrom: "", priceTo: "" })}
                  className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Reset Filters
                </button>

                <button
                  onClick={() => setStep("browse")}
                  className="w-full mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Back to Services
                </button>
              </div>
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}
