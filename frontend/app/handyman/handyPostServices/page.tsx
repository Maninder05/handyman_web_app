"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type DemoService = {
  title: string;
  category: string;
  price: string;
  priceType: string;
  rating?: number;
  img?: string;
  status?: "Published" | "Draft";
  excerpt?: string;
};

const DEMO_SERVICES: DemoService[] = [
  {
    title: "Kitchen Faucet Replacement",
    category: "Plumbing",
    price: "120",
    priceType: "Fixed",
    rating: 4.9,
    img: "/images/sample-attachment.jpg",
    status: "Published",
    excerpt:
      "Replace faucet cartridge, test seals, ensure leak-free installation.",
  },
  {
    title: "Living Room Light Repair",
    category: "Electrical",
    price: "45",
    priceType: "Hour",
    rating: 4.7,
    img: "/images/handyman-2.jpg",
    status: "Published",
    excerpt:
      "Diagnose flicker, tighten connections, replace switch or socket as needed.",
  },
  {
    title: "Trim & Hedge Maintenance",
    category: "Gardening",
    price: "90",
    priceType: "Fixed",
    rating: 4.6,
    img: "/images/handyman-3.jpg",
    status: "Draft",
    excerpt: "Trim hedges, remove debris, tidy flower beds and edges.",
  },
  {
    title: "Dishwasher Installation",
    category: "Appliance Repair",
    price: "150",
    priceType: "Fixed",
    rating: 4.8,
    img: "/images/handyman-4.jpg",
    status: "Published",
    excerpt: "Install new dishwasher, connect drain and power, test cycle.",
  },
];

export default function HandymanServicesPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priceType, setPriceType] = useState("Fixed");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const validate = (allowDraft = false) => {
    const e: Record<string, string> = {};
    if (!title.trim() && !allowDraft) e.title = "Please add a title";
    if (!category.trim() && !allowDraft)
      e.category = "Please choose a category";
    if (!description.trim() && !allowDraft)
      e.description = "Please provide a short description";
    if (!price.trim() && !allowDraft) e.price = "Set a price or save as draft";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setPrice("");
    setPriceType("Fixed");
    setDescription("");
    setFile(null);
    setPreviewUrl(null);
    setErrors({});
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setToast("Only image files are supported for preview");
      setTimeout(() => setToast(null), 2500);
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setToast("Image too large — max 8MB");
      setTimeout(() => setToast(null), 2500);
      return;
    }
    setFile(f);
  };

  const saveDraft = async () => {
    validate(true);
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      setToast("Draft saved");
      setTimeout(() => setToast(null), 2000);
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!validate(false)) {
      setToast("Please fix the required fields");
      setTimeout(() => setToast(null), 2200);
      return;
    }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      setToast("Service published");
      setTimeout(() => setToast(null), 1800);
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const Header = () => (
    <header className="w-full flex items-center justify-between px-16 py-4 bg-black shadow-md">
      <h1 className="text-2xl font-semibold text-white">My Services</h1>
      <button
        onClick={() => router.push("/handyman/handyDashboard")}
        className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
      >
        <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#D4A574] to-[#B8A565] text-white flex items-center justify-center font-semibold">
          H
        </div>
      </button>
    </header>
  );

  const Card: React.FC<{ s: DemoService }> = ({ s }) => (
    <div className="bg-white rounded-xl shadow-md border border-[#EED9C4] overflow-hidden">
      <div className="md:flex">
        <div className="w-full md:w-44 h-40 relative bg-gray-100">
          {s.img ? (
            <Image src={s.img} alt={s.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
              No image
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-lg text-[#1a1a1a]">
                {s.title}
              </h3>
              <div
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  s.status === "Published"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {s.status}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {s.category} • {s.priceType} • ${s.price}
            </p>
            <p className="mt-3 text-sm text-gray-700 line-clamp-3">
              {s.excerpt}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button className="text-sm px-3 py-1 rounded border bg-white">
              View
            </button>
            <button className="text-sm px-3 py-1 rounded bg-[#D4A574] text-white">
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-[#F5F5F0] to-[#efe6da] text-[#1a1a1a] flex flex-col">
      <Header />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMO_SERVICES.map((s, i) => (
            <Card key={i} s={s} />
          ))}
        </section>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-linear-to-r from-[#D4A574] to-[#B8A565] text-white font-semibold shadow-lg hover:brightness-95"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              className="inline-block"
            >
              <path fill="white" d="M13 11h8v2h-8v8h-2v-8H3v-2h8V3h2v8z" />
            </svg>
            Create Service
          </button>
        </div>
      </main>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#EED9C4] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-[#5C4033]">
                  Create Service
                </h2>
                <p className="text-sm text-gray-500">
                  Quickly add a service listing. Publish when ready or save as
                  draft.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="px-3 py-2 rounded bg-gray-100"
              >
                Close
              </button>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 ${
                    errors.title ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="e.g., Faucet replacement"
                />
                {errors.title && (
                  <div className="text-xs text-red-600">{errors.title}</div>
                )}

                <label className="text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 ${
                    errors.category ? "border-red-300" : "border-gray-200"
                  }`}
                >
                  <option value="">Select category</option>
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>Carpentry</option>
                  <option>Gardening</option>
                  <option>Appliance Repair</option>
                  <option>Cleaning</option>
                  <option>Other</option>
                </select>
                {errors.category && (
                  <div className="text-xs text-red-600">{errors.category}</div>
                )}

                <label className="text-sm font-medium text-gray-700">
                  Price
                </label>
                <div className="flex gap-2">
                  <select
                    value={priceType}
                    onChange={(e) => setPriceType(e.target.value)}
                    className="rounded-lg border px-3 py-2"
                  >
                    <option>Fixed</option>
                    <option>Hourly</option>
                  </select>
                  <input
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder="Amount"
                    className={`flex-1 rounded-lg border px-3 py-2 ${
                      errors.price ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                </div>
                {errors.price && (
                  <div className="text-xs text-red-600">{errors.price}</div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Short Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className={`w-full rounded-lg border px-3 py-2 ${
                    errors.description ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="Describe what's included, time estimate, and materials."
                />

                <label className="text-sm font-medium text-gray-700">
                  Image (optional, preview)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileRef}
                    id="img"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="img"
                    className="px-3 py-2 rounded bg-white border cursor-pointer"
                  >
                    Choose image
                  </label>
                  <div className="text-xs text-gray-400">
                    {previewUrl ? "Preview ready" : "No image"}
                  </div>
                </div>
                {previewUrl && (
                  <div className="mt-3 w-full rounded overflow-hidden border">
                    <Image
                      src={previewUrl}
                      alt="preview"
                      width={800}
                      height={420}
                      className="object-cover w-full h-40"
                    />
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex items-center justify-between mt-2 pt-3 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Tip: include clear photos and short instructions that help
                  clients prepare.
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={saving}
                    className="px-4 py-2 rounded bg-white border"
                  >
                    {saving ? "Saving..." : "Save Draft"}
                  </button>
                  <button
                    type="button"
                    onClick={publish}
                    disabled={saving}
                    className="px-4 py-2 rounded bg-[#D4A574] text-white"
                  >
                    {saving ? "Publishing..." : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3 py-2 rounded bg-gray-50 border"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed right-6 bottom-6 bg-[#5C4033] text-white px-4 py-2 rounded-lg shadow">
          {toast}
        </div>
      )}

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
