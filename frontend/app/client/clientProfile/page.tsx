"use client";

import React, { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FiUser, FiCamera } from "react-icons/fi";

type ProfileFormData = {
  name: string;
  email: string;
  phone: string;
  bio: string;
};

export default function AddClientProfile() {
  const router = useRouter();
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setProfilePic(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const cleaned = value.replace(/\D/g, "");
      let formatted = "+";
      if (cleaned.startsWith("1")) {
        formatted = "+1";
        if (cleaned.length > 1) {
          formatted +=
            " (" + cleaned.slice(1, 4) +
            (cleaned.length >= 4 ? ")" : "") +
            (cleaned.length >= 5 ? " " + cleaned.slice(4, 7) : "") +
            (cleaned.length >= 7 ? " " + cleaned.slice(7, 11) : "");
        }
      } else {
        formatted += cleaned;
      }
      setFormData({ ...formData, phone: formatted });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.name.trim() || formData.name.length < 3)
      errs.name = "Name must be at least 3 characters";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
      errs.email = "Enter a valid email";
    if (!formData.bio.trim()) errs.bio = "Bio is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject("Failed to read file");
      reader.onloadend = () => typeof reader.result === "string" ? resolve(reader.result) : reject("No result");
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to create a profile!");
      return;
    }

    setSaving(true);

    try {
      let profileImage = "";
      if (profilePic) profileImage = await fileToDataUrl(profilePic);

      const profileToSave = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        bio: formData.bio.trim(),
        profileImage: profileImage || undefined,
      };

      const res = await fetch("http://localhost:7000/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(profileToSave),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        
        if (res.status === 400 && errorData?.message?.includes("already have a profile")) {
          router.push("/client/clientDashboard");
          return;
        }
        
        throw new Error(errorData?.message || "Failed to create profile");
      }
      
      router.push("/client/clientDashboard");
    } catch (err) {
      alert("Error: Could not create profile. See console for details.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      <header className="bg-[#1a1a1a] shadow-md py-4 px-6 flex justify-center items-center">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Create <span className="text-[#D4A574]">Client Profile</span>
        </h1>
      </header>

      <main className="flex-1 flex justify-center items-center p-6">
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl w-full max-w-2xl p-8 border border-gray-200">
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#D4A574] shadow-lg mb-6">
              {previewUrl ? 
                <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
                : 
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                  <FiUser size={56} />
                </div>
              }
              <label className="absolute bottom-0 right-0 bg-[#D4A574] p-2.5 rounded-full cursor-pointer hover:bg-[#C4956A] transition shadow-md">
                <FiCamera size={20} className="text-[#1a1a1a]"/>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block font-bold text-[#1a1a1a] mb-2">Full Name</label>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Full Name" 
                maxLength={25} 
                className={`w-full p-3 rounded-lg text-gray-900 border-2 ${errors.name ? "border-red-500" : "border-gray-300"} focus:border-[#D4A574] outline-none transition`} 
                required
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block font-bold text-[#1a1a1a] mb-2">Email Address</label>
              <input 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="Email Address" 
                maxLength={30} 
                className={`w-full p-3 rounded-lg text-gray-900 border-2 ${errors.email ? "border-red-500" : "border-gray-300"} focus:border-[#D4A574] outline-none transition`} 
                required
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block font-bold text-[#1a1a1a] mb-2">Phone Number</label>
              <input 
                name="phone" 
                type="tel" 
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="+1 (XXX) XXX XXXX" 
                maxLength={17} 
                className="w-full p-3 rounded-lg text-gray-900 border-2 border-gray-300 focus:border-[#D4A574] outline-none transition" 
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#1a1a1a] mb-2">About You</label>
              <textarea 
                name="bio" 
                value={formData.bio} 
                onChange={handleChange} 
                placeholder="Tell us about yourself..." 
                maxLength={250} 
                className={`w-full p-4 rounded-lg text-gray-900 border-2 ${errors.bio ? "border-red-500" : "border-gray-300"} focus:border-[#D4A574] outline-none resize-none h-28`} 
                required
              />
              <div className="flex justify-between items-center mt-1">
                {errors.bio && <p className="text-red-500 text-sm">{errors.bio}</p>}
                <p className="text-gray-400 text-xs ml-auto">{formData.bio.length}/250</p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                type="submit" 
                disabled={saving} 
                className="flex-1 bg-[#D4A574] hover:bg-[#C4956A] text-[#1a1a1a] font-bold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {saving ? "Creating Profile..." : "Create Profile"}
              </button>
              <button 
                type="button" 
                onClick={()=>router.push("/client/clientDashboard")} 
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-4 rounded-lg transition shadow-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}