"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "../../components/handyHeader";

interface Service {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  priceType: string;
  images?: string[];
}

export default function CreateService() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priceType, setPriceType] = useState("Hourly");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [popup, setPopup] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const router = useRouter();
  const handleLogout = () => router.push("/");

  // Helper to construct correct image URLs
  const getServiceImageUrl = (img?: string) => {
    if (!img) return "/placeholder.png"; // optional placeholder
    if (img.startsWith("http")) return img;
    if (img.startsWith("/")) return `${process.env.NEXT_PUBLIC_API_URL}${img}`;
    return `${process.env.NEXT_PUBLIC_API_URL}/${img}`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setErrors({ image: "Only JPG, JPEG, and PNG are allowed" });
      return;
    }
    if (file.size > 35 * 1024 * 1024) {
      setErrors({ image: "Image must be less than 35MB" });
      return;
    }

    setErrors({});
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (/^\d*\.?\d*$/.test(val)) {
      setPrice(val);
      setErrors((prev) => ({ ...prev, price: "" }));
    } else {
      setErrors((prev) => ({ ...prev, price: "Price must be a number" }));
    }
  };

  const submitToServer = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!title) newErrors.title = "Title is required";
    if (!description) newErrors.description = "Description is required";
    if (!category) newErrors.category = "Category is required";
    if (!price) newErrors.price = "Price is required";
    if (!image) newErrors.image = "Image is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("price", price);
      formData.append("priceType", priceType);

      if (image) formData.append("image", image);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) throw new Error("API URL not set");

      const res = await fetch(`${apiUrl}/api/handyman/services`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        setPopup("🎉 Service published successfully!");
        setTitle("");
        setDescription("");
        setCategory("");
        setPrice("");
        setImage(null);
        setImagePreview(null);
        setErrors({});
      } else {
        const text = await res.text();
        let data: { message?: string } = { message: text };
        try {
          data = JSON.parse(text);
        } catch {}

        setPopup(data.message || "❌ Failed to submit service");
      }
    } catch (err) {
      if (err instanceof Error) {
        setPopup(`⚠️ ${err.message}`);
      } else {
        setPopup("⚠️ Unexpected error");
      }
    } finally {
      setLoading(false);
      setTimeout(() => setPopup(null), 3000);
    }
  };

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      const res = await fetch(`${apiUrl}/api/handyman/services`, {
        credentials: "include",
      });

      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error("Error fetching services:", err);
      setPopup("⚠️ Failed to load services");
    } finally {
      setLoadingServices(false);
    }
  };

  const openModal = () => {
    fetchServices();
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5F0] to-[#eae7e1] flex flex-col">
      <Header pageTitle="Post Service" onLogout={handleLogout} />

      {popup && (
        <div className="fixed top-6 right-6 bg-[#5C4033] text-white px-6 py-3 rounded-xl shadow-xl z-50 animate-fade-in-up">
          {popup}
        </div>
      )}

      <main className="flex-1 flex justify-center items-start py-14 px-6">
        <div className="w-full max-w-5xl bg-white/95 backdrop-blur-md rounded-2xl shadow-lg p-12 border border-[#D4A574]/30 hover:shadow-[#D4A574]/20 transition-all duration-300">
          <h2 className="text-4xl font-bold text-[#5C4033] border-b pb-4 flex items-center justify-between">
            Create a New Service
            {loading && (
              <span className="text-sm text-[#D4A574] animate-pulse">
                Saving...
              </span>
            )}
          </h2>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
            {/* Left */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block mb-2 font-semibold text-[#1a1a1a]">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter service title"
                  className="w-full rounded-xl p-4 border border-gray-200 bg-white text-gray-800 focus:ring-2 focus:ring-[#D4A574]"
                />
                {errors.title && (
                  <p className="text-[#D4A574] text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block mb-2 font-semibold text-[#1a1a1a]">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter service description"
                  className="w-full rounded-xl p-4 border border-gray-200 bg-white text-gray-800 focus:ring-2 focus:ring-[#D4A574]"
                  rows={5}
                />
                {errors.description && (
                  <p className="text-[#D4A574] text-sm mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block mb-2 font-semibold text-[#1a1a1a]">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl p-4 border border-gray-200 bg-white text-gray-800 focus:ring-2 focus:ring-[#D4A574] cursor-pointer"
                >
                  <option value="">Select Category</option>
                  <option>Electrical</option>
                  <option>Plumbing</option>
                  <option>Carpentry</option>
                  <option>Appliances</option>
                  <option>Painting & Finishing</option>
                  <option>Cleaning</option>
                  <option>Landscaping</option>
                  <option>Renovation</option>
                  <option>Roofing</option>
                  <option>General Repairs</option>
                </select>
                {errors.category && (
                  <p className="text-[#D4A574] text-sm mt-1">
                    {errors.category}
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block mb-2 font-semibold text-[#1a1a1a]">
                  Price
                </label>
                <div className="flex gap-4">
                  <select
                    value={priceType}
                    onChange={(e) => setPriceType(e.target.value)}
                    className="rounded-xl p-4 border border-gray-200 bg-white text-gray-800 cursor-pointer"
                  >
                    <option>Hourly</option>
                    <option>Fixed</option>
                  </select>

                  <input
                    type="text"
                    value={price}
                    onChange={handlePriceChange}
                    placeholder="Enter price"
                    className="flex-1 rounded-xl p-4 border border-gray-200 bg-white text-gray-800"
                  />
                </div>
                {errors.price && (
                  <p className="text-[#D4A574] text-sm mt-1">{errors.price}</p>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold text-[#1a1a1a]">
                  Image
                </label>

                <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#D4A574]/40 rounded-xl p-6 hover:bg-[#FFF8F0] cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="upload"
                    onChange={handleImageUpload}
                  />
                  <label
                    htmlFor="upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <span className="text-[#D4A574] font-medium">
                      {image ? image.name : "Click to upload image"}
                    </span>
                    <p className="text-gray-500 text-sm">
                      Only JPG, JPEG, PNG allowed
                    </p>
                  </label>

                  {/* ✅ Updated Preview */}
                  {imagePreview && (
                    <div className="w-40 h-40 mt-4 relative rounded-xl overflow-hidden border border-gray-200 shadow-lg">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={200}
                        height={200}
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>

                {errors.image && (
                  <p className="text-[#D4A574] text-sm mt-1">{errors.image}</p>
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-6 pt-10 mt-10 border-t border-[#D4A574]/30">
            <button
              onClick={openModal}
              className="px-6 py-3 rounded-xl bg-white text-[#5C4033] border border-gray-300 hover:bg-[#F5F5F0] font-medium"
            >
              Browse Services
            </button>

            <button
              onClick={() => submitToServer()}
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#D4A574] to-[#B8A565] text-white font-semibold hover:shadow-lg hover:scale-[1.02] disabled:opacity-70"
            >
              Publish Service
            </button>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-start z-50 py-12 overflow-auto">
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-4xl shadow-xl relative border border-gray-200">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-800 text-xl font-bold hover:text-[#D4A574]"
            >
              ✕
            </button>

            <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Published Services
            </h3>

            {loadingServices ? (
              <p className="text-center text-gray-500">Loading...</p>
            ) : services.length === 0 ? (
              <p className="text-center text-gray-500">No services found.</p>
            ) : (
              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
                {services.map((s) => (
                  <div
                    key={s._id}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-4 flex gap-4"
                  >
                    {s.images && s.images.length > 0 ? (
                      <div className="w-32 h-32 relative rounded-lg overflow-hidden bg-gray-100 border">
                        <Image
                          src={getServiceImageUrl(s.images[0])}
                          width={200}
                          height={200}
                          alt={s.title}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center border text-gray-400">
                        No Image
                      </div>
                    )}

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-gray-900">
                          {s.title}
                        </p>
                        <p className="text-gray-600 text-sm">{s.description}</p>
                        <p className="text-gray-700 text-sm">
                          <span className="font-semibold text-gray-900">
                            Category:
                          </span>{" "}
                          {s.category}
                        </p>
                        <p className="text-sm font-semibold text-amber-700">
                          Price: {s.priceType} — ${s.price}
                        </p>
                      </div>

                      <p className="text-sm font-medium text-green-700 mt-2">
                        Published ✔
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
