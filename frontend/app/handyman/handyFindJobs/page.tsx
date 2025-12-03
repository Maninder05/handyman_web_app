"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Job = {
  title: string;
  category: string;
  price: number;
  priceType: "Fixed" | "Hourly";
  location: string;
  description: string;
  img?: string;
  datePosted: string;
};

const DEMO_JOBS: Job[] = [
  {
    title: "Fix Kitchen Sink Leak",
    category: "Plumbing",
    price: 120,
    priceType: "Fixed",
    location: "Downtown Calgary",
    description:
      "Repair minor leak under kitchen sink, replace seal and test water flow. Estimated 1.5 hours.",
    img: "/images/handyman-1.jpg",
    datePosted: "2025-11-08",
  },
  {
    title: "Replace Ceiling Light Fixture",
    category: "Electrical",
    price: 50,
    priceType: "Hourly",
    location: "Beltline, Calgary",
    description:
      "Replace outdated ceiling fixture with new LED light. Bring standard tools and ladder.",
    img: "/images/handyman-2.jpg",
    datePosted: "2025-11-09",
  },
  {
    title: "Assemble Bedroom Furniture",
    category: "Carpentry",
    price: 200,
    priceType: "Fixed",
    location: "Airdrie, AB",
    description:
      "Assemble 2 wardrobes and one side table. Must bring screwdriver and small wrench.",
    img: "/images/handyman-3.jpg",
    datePosted: "2025-11-07",
  },
  {
    title: "Lawn Mowing & Hedge Trim",
    category: "Gardening",
    price: 40,
    priceType: "Hourly",
    location: "Chestermere, AB",
    description:
      "Mow front and backyard, trim hedges, bag leaves neatly. Tools provided on site.",
    img: "/images/handyman-4.jpg",
    datePosted: "2025-11-06",
  },
  {
    title: "Dishwasher Installation",
    category: "Appliance Repair",
    price: 130,
    priceType: "Fixed",
    location: "NE Calgary",
    description:
      "Install a built-in dishwasher, connect plumbing and electrical safely.",
    img: "/images/handyman-5.jpg",
    datePosted: "2025-11-10",
  },
];

export default function HandyFindJobsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [priceType, setPriceType] = useState("All");

  const categories = [
    "All",
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Gardening",
    "Appliance Repair",
  ];

  const priceTypes = ["All", "Fixed", "Hourly"];

  const goToProfile = () => router.push("/handyman/handyDashboard");

  const filteredJobs = DEMO_JOBS.filter((j) => {
    const matchQuery =
      j.title.toLowerCase().includes(query.toLowerCase()) ||
      j.description.toLowerCase().includes(query.toLowerCase());
    const matchCategory = category === "All" || j.category === category;
    const matchPriceType = priceType === "All" || j.priceType === priceType;
    return matchQuery && matchCategory && matchPriceType;
  });

  const Header = () => (
  <header className="w-full flex items-center justify-between px-16 py-4 bg-black shadow-md">
      <h1 className="text-2xl font-semibold text-white">Find Jobs</h1>
      <button
        onClick={() => router.push("/handyman/handyDashboard")}
        className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8A565] text-white flex items-center justify-center font-semibold">
          H
        </div>
      </button>
    </header>
  );

  const FilterTabs = ({
    items,
    active,
    setActive,
    label,
  }: {
    items: string[];
    active: string;
    setActive: (val: string) => void;
    label: string;
  }) => (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => setActive(item)}
            className={`px-4 py-1.5 text-sm rounded-full border transition ${
              active === item
                ? "bg-[#D4A574] text-white border-[#D4A574]"
                : "bg-white text-gray-700 border-gray-200 hover:border-[#C49A6C]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  const SearchBar = () => (
    <div className="w-full flex items-center bg-white rounded-full shadow-sm border border-gray-200 px-4 py-2 mt-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="#8B7355"
        className="w-5 h-5 mr-2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-4.35-4.35m1.15-5.4a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        />
      </svg>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search job titles or descriptions..."
        className="w-full bg-transparent outline-none text-sm text-[#1a1a1a] placeholder-gray-400"
      />
    </div>
  );

  const JobCard = ({ job }: { job: Job }) => (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-[#EED9C4] overflow-hidden transition transform hover:-translate-y-1">
      <div className="relative w-full h-44">
        <Image
          src={job.img || "/images/default.jpg"}
          alt={job.title}
          fill
          className="object-cover"
        />
        <div className="absolute bottom-0 left-0 bg-black/70 text-white text-xs px-3 py-1 rounded-tr-lg">
          {job.category}
        </div>
      </div>

      <div className="p-4 flex flex-col justify-between h-[240px]">
        <div>
          <h3 className="font-semibold text-lg text-[#1a1a1a]">
            {job.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {job.location} • {job.priceType} • ${job.price}
          </p>
          <p className="text-sm text-gray-700 mt-2 line-clamp-3">
            {job.description}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Posted on {new Date(job.datePosted).toLocaleDateString()}
          </p>
          <button className="px-4 py-2 bg-[#D4A574] hover:bg-[#B88A65] text-white rounded-md text-sm font-medium">
            View Job
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#F5F5F0] to-[#EFE6DA] text-[#1a1a1a]">
      <Header />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#EED9C4] p-6 shadow-sm">
          <SearchBar />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <FilterTabs
              items={categories}
              active={category}
              setActive={setCategory}
              label="Category"
            />
            <FilterTabs
              items={priceTypes}
              active={priceType}
              setActive={setPriceType}
              label="Price Type"
            />
          </div>
        </div>

        {filteredJobs.length > 0 ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {filteredJobs.map((job, i) => (
              <JobCard key={i} job={job} />
            ))}
          </section>
        ) : (
          <div className="text-center text-gray-500 mt-12">
            No jobs found. Try adjusting filters or keywords.
          </div>
        )}
      </main>

      <footer className="bg-black text-white text-center py-4 text-sm mt-auto">
        © {new Date().getFullYear()} HandyConnect • Helping Handymen Grow
      </footer>

      <style jsx>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
