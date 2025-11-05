"use client";

import React, { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FiUser, FiCamera, FiPlus, FiTrash2 } from "react-icons/fi";

type ProfileFormData = {
  name: string;
  email: string;
  phone: string;
  bio: string;
  services: string[];
  skills: string[];
};

export default function AddProfilePage() {
  const router = useRouter();
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    email: "",
    phone: "",
    bio: "",
    services: [],
    skills: [],
  });
  const [newService, setNewService] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  // Profile Pic
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setProfilePic(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  // Input Change
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

  // Services
  const addService = () => {
    const s = newService.trim();
    if (!s) return;
    if (!formData.services.includes(s)) setFormData({ ...formData, services: [...formData.services, s] });
    setNewService("");
  };
  const removeService = (s: string) =>
    setFormData({ ...formData, services: formData.services.filter((svc) => svc !== s) });

  // Skills
  const addSkill = () => {
    const s = newSkill.trim();
    if (!s) return;
    if (!formData.skills.includes(s)) setFormData({ ...formData, skills: [...formData.skills, s] });
    setNewSkill("");
  };
  const removeSkill = (s: string) =>
    setFormData({ ...formData, skills: formData.skills.filter((sk) => sk !== s) });

  // Validate
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

  // Submit
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
        services: formData.services.map(s => ({ title: s, desc: "" })),
        skills: formData.skills.length ? formData.skills : undefined,
        profileImage: profileImage || undefined,
      };

      const res = await fetch("http://localhost:7000/api/handymen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(profileToSave),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        
        // If profile already exists, that's fine - just go to dashboard
        if (res.status === 400 && errorData?.message?.includes("already have a profile")) {
          router.push("/handyDashboard");
          return;
        }
        
        console.log(" Backend Status:", res.status);
        console.log(" Backend Error:", errorData);
        throw new Error(errorData?.message || "Failed to create profile");
      }
      
      router.push("/handyDashboard");
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
          Create <span className="text-[#D4A574]">Handyman Profile</span>
        </h1>
      </header>

      <main className="flex-1 flex justify-center items-start p-6">
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl w-full max-w-5xl flex overflow-hidden border border-gray-200">
          <div className="w-1/3 bg-gradient-to-b from-[#F5F5F0] to-white flex flex-col items-center p-8 gap-6 border-r border-gray-200">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#D4A574] shadow-lg">
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

            <div className="w-full space-y-4">
              <div>
                <input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="Full Name" 
                  maxLength={25} 
                  className={`w-full p-3 rounded-lg text-gray-900 border-2 ${errors.name ? "border-red-500" : "border-gray-300"} focus:border-[#D4A574] outline-none transition text-center font-medium`} 
                  required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 text-center">{errors.name}</p>}
              </div>

              <div>
                <input 
                  name="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="Email Address" 
                  maxLength={30} 
                  className={`w-full p-3 rounded-lg text-gray-900 border-2 ${errors.email ? "border-red-500" : "border-gray-300"} focus:border-[#D4A574] outline-none transition text-center`} 
                  required
                />
                {errors.email && <p className="text-red-500 text-xs mt-1 text-center">{errors.email}</p>}
              </div>

              <input 
                name="phone" 
                type="tel" 
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="+1 (XXX) XXX XXXX" 
                maxLength={17} 
                className="w-full p-3 rounded-lg  text-gray-900 border-2 border-gray-300 focus:border-[#D4A574] outline-none text-center transition" 
                required
              />
            </div>
          </div>

          <div className="w-2/3 p-8 flex flex-col justify-start overflow-y-auto gap-6">
            <div>
              <label className="block font-bold text-[#1a1a1a] mb-2 text-lg">About You</label>
              <textarea 
                name="bio" 
                value={formData.bio} 
                onChange={handleChange} 
                placeholder="Tell us about yourself and your experience..." 
                maxLength={250} 
                className={`w-full p-4 rounded-lg  text-gray-900 border-2 ${errors.bio ? "border-red-500" : "border-gray-300"} focus:border-[#D4A574] outline-none resize-none h-28`} 
                required
              />
              <div className="flex justify-between items-center mt-1">
                {errors.bio && <p className="text-red-500 text-sm">{errors.bio}</p>}
                <p className="text-gray-400 text-xs ml-auto">{formData.bio.length}/250</p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1a1a1a] mb-2 text-lg">Services Offered</label>
              <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 bg-[#F5F5F0] rounded-lg">
                {formData.services.length === 0 ? (
                  <p className="text-gray-400 text-sm">No services added yet</p>
                ) : (
                  formData.services.map((s,i)=>
                    <div key={i} className="flex items-center gap-2 bg-[#D4A574] text-[#1a1a1a] px-4 py-2 rounded-full font-medium shadow-sm">
                      {s}
                      <button type="button" onClick={()=>removeService(s)} className="hover:text-red-600 transition">
                        <FiTrash2 size={16}/>
                      </button>
                    </div>
                  )
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newService} 
                  onChange={(e)=>setNewService(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                  placeholder="e.g., Plumbing, Electrical, Carpentry..." 
                  className="flex-1 p-3 rounded-lg text-gray-900 border-2 border-gray-300 focus:border-[#D4A574] outline-none transition"
                />
                <button 
                  type="button" 
                  onClick={addService} 
                  className="bg-[#D4A574] hover:bg-[#C4956A] text-[#1a1a1a] px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition shadow-md"
                >
                  <FiPlus size={18}/> Add
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1a1a1a] mb-2 text-lg">Skills & Expertise</label>
              <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 bg-[#F5F5F0] rounded-lg">
                {formData.skills.length === 0 ? (
                  <p className="text-gray-400 text-sm">No skills added yet</p>
                ) : (
                  formData.skills.map((s,i)=>
                    <div key={i} className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-full font-medium shadow-sm">
                      {s}
                      <button type="button" onClick={()=>removeSkill(s)} className="hover:text-red-400 transition">
                        <FiTrash2 size={16}/>
                      </button>
                    </div>
                  )
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newSkill} 
                  onChange={(e)=>setNewSkill(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="e.g., Tile Work, Drywall, Painting..." 
                  className="flex-1 p-3 rounded-lg  text-gray-900 border-2 border-gray-300 focus:border-[#D4A574] outline-none transition"
                />
                <button 
                  type="button" 
                  onClick={addSkill} 
                  className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition shadow-md"
                >
                  <FiPlus size={18}/> Add
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-4">
              <button 
                type="submit" 
                disabled={saving} 
                className="flex-1 bg-[#D4A574] hover:bg-[#C4956A] text-[#1a1a1a] font-bold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {saving ? "Creating Profile..." : "Create Profile"}
              </button>
              <button 
                type="button" 
                onClick={()=>router.push("/handyDashboard")} 
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