"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { FiUser } from "react-icons/fi";
import Header from "../../components/handyHeader";

export default function CreateService() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priceType, setPriceType] = useState("Hourly");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [popup, setPopup] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const router = useRouter();

  const handleLogout = () => router.push("/");

  const toggleMenu = () => {
    setShowMenu(!showMenu);
    setShowProfileMenu(false);
  };

  const toggleProfile = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowMenu(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setErrors({ image: "Only JPG, JPEG and PNG are allowed" });
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

  const submitToServer = async (isDraft = false) => {
    const newErrors: { [key: string]: string } = {};
    if (!title) newErrors.title = "Title is required";
    if (!category) newErrors.category = "Category is required";
    if (!price) newErrors.price = "Price is required";
    if (!image && !isDraft) newErrors.image = "Image is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("priceType", priceType);
      formData.append("price", price);
      formData.append("isDraft", isDraft ? "true" : "false");
      if (image) formData.append("image", image);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/services`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (res.ok) {
        setPopup(isDraft ? "Draft saved" : "Service submitted");
        setTitle("");
        setCategory("");
        setPrice("");
        setImage(null);
        setImagePreview(null);
      } else {
        const data = await res.json();
        setPopup(data.message || "Failed to submit service");
      }
    } catch (err) {
      console.error("Error submitting service:", err);
      setPopup("Error submitting service");
    }
  };

  const handleSubmit = async () => {
    await submitToServer(false);
  };

  const handleSaveDraft = async () => {
    await submitToServer(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      <div>
        <Header pageTitle="Post Service" onLogout={handleLogout} />
      </div>

      <main className="flex-1 flex justify-center items-start py-14 px-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-12 space-y-10 border-t-4 border-[#D4A574]">
          {/* Title */}
          <div>
            <label className="block mb-2 font-semibold text-[#1a1a1a]">
              Service Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl p-4 border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#D4A574] transition"
              placeholder="Enter service title"
            />
            {errors.title && (
              <p className="text-[#D4A574] text-sm mt-1">{errors.title}</p>
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
              className="w-full rounded-xl p-4 border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4A574] appearance-none pr-8 transition cursor-pointer"
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
              <p className="text-[#D4A574] text-sm mt-1">{errors.category}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block mb-2 font-semibold text-[#1a1a1a]">
              Upload Service Image
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1 rounded-xl p-4 border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4A574] transition cursor-pointer">
                {image ? image.name : "Choose image file"}
                <span className="ml-2 text-[#D4A574]">📁</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
              {imagePreview && (
                <div className="w-24 h-24 relative border border-gray-200 rounded-xl overflow-hidden shadow">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            {errors.image && (
              <p className="text-[#D4A574] text-sm mt-1">{errors.image}</p>
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
                className="rounded-xl p-4 border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#D4A574] transition cursor-pointer"
              >
                <option>Hourly</option>
                <option>Fixed</option>
              </select>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="flex-1 rounded-xl p-4 border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#D4A574] transition"
                placeholder="Enter price"
              />
            </div>
            {errors.price && (
              <p className="text-[#D4A574] text-sm mt-1">{errors.price}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleSaveDraft}
              className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
            >
              Save Draft
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 rounded-lg bg-[#D4A574] text-white font-semibold hover:bg-[#B8A565] shadow-lg hover:shadow-xl transition"
            >
              Publish Service
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
