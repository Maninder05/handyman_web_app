"use client";
 
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, HelpCircle, Crown, Wrench, Upload, Camera, Settings } from "lucide-react";
import { FiUser, FiPlus, FiDollarSign, FiShoppingBag, FiStar } from "react-icons/fi";
import Header from "../../components/handyHeader";
 
type Service = {
  _id?: string;
  title: string;
  description: string;
  price?: number;
};
 
type Order = {
  _id: string;
  title: string;
  description: string;
  status: string;
  clientName?: string;
  date?: string;
};
 
type Profile = {
  _id: string;
  name: string;
  email: string;
  contact?: string;
  address?: string;
  bio?: string;
  skills?: string[];
  profileImage?: string;
  jobsDone: number;
  jobsDoneCount?: number;
  jobsInProgressCount: number;
  rating: number;
  earnings: number;
  activeOrdersCount: number;
  activeOrderCount?: number;
  jobAcceptCount: number;
  services: Service[];
  recentOrders: Order[];
  planType?: 'Basic' | 'Standard' | 'Premium';
  verified?: boolean;
  notificationsCount: number;
  reviewsCount?: number;
};
 
export default function HandyDashboard() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
 
  useEffect(() => {
    fetchProfile();
   
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProfile();
      }
    };
   
    document.addEventListener('visibilitychange', handleVisibilityChange);
   
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
<<<<<<< Updated upstream
<<<<<<< Updated upstream
 
  }, []);
 
=======
  }, []);
 
=======
  }, []);
 
>>>>>>> Stashed changes
  useEffect(() => {
    const applyThemeSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
 
        const res = await fetch("http://localhost:7000/api/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
 
        if (res.ok) {
          const settings = await res.json();
 
          if (settings.theme === "dark") {
            document.documentElement.classList.add("dark");
          } else if (settings.theme === "light") {
            document.documentElement.classList.remove("dark");
          } else if (settings.theme === "auto") {
            if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }
        }
      } catch (err) {
        console.error("Error applying theme:", err);
      }
    };
 
    applyThemeSettings();
  }, []);
 
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/signup?mode=login");
        return;
      }
 
      const res = await fetch("http://localhost:7000/api/handymen", {
        headers: { "Authorization": `Bearer ${token}` },
      });
 
      if (res.ok) {
        const data: Profile = await res.json();
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
        console.log("Profile data received:", data);
>>>>>>> Stashed changes
=======
        console.log("Profile data received:", data);
>>>>>>> Stashed changes
        setProfile(data);
      } else if (res.status === 401) {
        localStorage.removeItem("token");
        router.push("/signup?mode=login");
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };
 
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
     
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
 
      setSelectedFile(file);
     
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
 
  const handleUploadImage = async () => {
    if (!selectedFile) return;
 
    setUploadingImage(true);
   
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('profileImage', selectedFile);
 
      const res = await fetch("http://localhost:7000/api/handymen/upload-profile-pic", {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });
 
      if (res.ok) {
        const data = await res.json();
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        setProfile(prev => prev ? {
          ...prev,
          profileImage: data.profilePic || data.imageUrl
=======
=======
>>>>>>> Stashed changes
        console.log("Upload response:", data);
        setProfile(prev => prev ? {
          ...prev,
          profileImage: data.profilePic || data.profileImage || data.imageUrl
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        } : null);
        setShowUploadModal(false);
        setSelectedFile(null);
        setPreviewUrl(null);
       
        fetchProfile();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to upload image. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };
 
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };
 
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4A574] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
 
  return (
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    <div className="min-h-screen bg-[#F5F5F0] text-gray-900 flex flex-col">
=======
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#0a0a0a] text-gray-900 dark:text-white flex flex-col">
>>>>>>> Stashed changes
=======
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#0a0a0a] text-gray-900 dark:text-white flex flex-col">
>>>>>>> Stashed changes
      <Header
        pageTitle="Handyman Dashboard"
        onLogout={handleLogout}
        profile={{
          profileImage: profile?.profileImage,
          notificationsCount: profile?.notificationsCount || 0
        }}
      />
 
      <main className="flex-1 overflow-y-auto pb-10">
        <section className="bg-gradient-to-br from-[#D4A574] to-[#B8A565] py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-4">
                {profile?.profileImage ? (
<<<<<<< Updated upstream
<<<<<<< Updated upstream
                  <Image
                    src={profile.profileImage}
                    alt="Profile"
                    width={112}
                    height={112}
                    className="rounded-full border-4 border-white shadow-lg object-cover"
=======
=======
>>>>>>> Stashed changes
                  <img
                    src={`http://localhost:7000${profile.profileImage}`}
                    alt="Profile"
                    className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover"
                    onError={(e) => {
                      console.error('Failed to load profile image:', profile.profileImage);
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-28 h-28 rounded-full border-4 border-white bg-white/20 flex items-center justify-center';
                        fallback.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                        parent.appendChild(fallback);
                      }
                    }}
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full border-4 border-white bg-white/20 flex items-center justify-center">
                    <FiUser size={48} className="text-white" />
                  </div>
                )}
               
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="absolute bottom-0 right-0 bg-[#D4A574] p-2 rounded-full border-4 border-white shadow-lg hover:bg-[#B8A565] transition"
                >
                  <Camera size={20} className="text-white" />
                </button>
              </div>
 
              <div>
                <div className="flex items-center gap-2 justify-center mb-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-white">
                    {profile?.name || "Your Name"}
                  </h2>
<<<<<<< Updated upstream
                 
=======
                  
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
                  {profile?.planType === 'Premium' && (
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                      👑 PREMIUM
                    </span>
                  )}
                  {profile?.planType === 'Standard' && (
                    <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                      ⭐ STANDARD
                    </span>
                  )}
                  {profile?.planType === 'Basic' && (
                    <span className="px-3 py-1 bg-gray-400 text-white text-xs font-bold rounded-full flex items-center gap-1">
                      🆓 BASIC
                    </span>
                  )}
                 
                  {profile?.verified && (
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                      ✅ VERIFIED
                    </span>
                  )}
                </div>
               
                <p className="text-white/90 text-sm">
                  {profile?.email || "your.email@example.com"}
                </p>
                {profile?.contact && (
                  <p className="text-white/80 text-sm mt-1">
                    📱 {profile.contact}
                  </p>
                )}
              </div>
            </div>
 
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30">
                <p className="text-3xl font-bold text-white">{profile?.jobsDone || profile?.jobsDoneCount || 0}</p>
                <p className="text-white/90 text-sm mt-1">Jobs Completed</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30">
                <p className="text-3xl font-bold text-white">{profile?.jobsInProgressCount || 0}</p>
                <p className="text-white/90 text-sm mt-1">In Progress</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-3xl font-bold text-white">{profile?.rating || 0}</p>
                  <FiStar className="text-yellow-300 fill-yellow-300" size={20} />
                </div>
                <p className="text-white/90 text-sm mt-1">Rating</p>
              </div>
            </div>
          </div>
        </section>
 
        <section className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-[#1a1a1a]">${profile?.earnings || 0}</p>
                  <p className="text-gray-400 text-xs mt-1">All Time</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#D4A574] to-[#B8A565] rounded-xl flex items-center justify-center">
                  <FiDollarSign size={24} className="text-white" />
                </div>
              </div>
            </div>
 
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Active Orders</p>
                  <p className="text-3xl font-bold text-[#1a1a1a]">{profile?.activeOrdersCount || profile?.activeOrderCount || 0}</p>
                  <p className="text-gray-400 text-xs mt-1">Currently Working</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#D4A574] to-[#B8A565] rounded-xl flex items-center justify-center">
                  <FiShoppingBag size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </section>
 
        <section className="max-w-7xl mx-auto px-6 mb-8">
          <h3 className="text-xl font-bold text-[#1a1a1a] mb-6">Quick Actions</h3>
 
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link href="/handyman/handyFindJobs" className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-[#D4A574] hover:shadow-xl transition text-center group">
              <Briefcase size={32} className="text-[#D4A574] mx-auto mb-3 group-hover:scale-110 transition" />
              <h4 className="font-bold text-[#1a1a1a]">Find Jobs</h4>
              <p className="text-gray-500 text-sm mt-1">Browse available jobs</p>
            </Link>
 
            <Link href="/handyman/handyPostServices" className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-[#D4A574] hover:shadow-xl transition text-center group">
              <Wrench size={32} className="text-[#D4A574] mx-auto mb-3 group-hover:scale-110 transition" />
              <h4 className="font-bold text-[#1a1a1a]">My Services</h4>
              <p className="text-gray-500 text-sm mt-1">Manage your services</p>
            </Link>
 
            <Link href="/mutual/membership" className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-[#D4A574] hover:shadow-xl transition text-center group">
              <Crown size={32} className="text-[#D4A574] mx-auto mb-3 group-hover:scale-110 transition" />
              <h4 className="font-bold text-[#1a1a1a]">Membership</h4>
              <p className="text-gray-500 text-sm mt-1">View your plan</p>
            </Link>
 
            <Link href="/mutual/support" className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-[#D4A574] hover:shadow-xl transition text-center group">
              <HelpCircle size={32} className="text-[#D4A574] mx-auto mb-3 group-hover:scale-110 transition" />
              <h4 className="font-bold text-[#1a1a1a]">Help</h4>
              <p className="text-gray-500 text-sm mt-1">Get support</p>
            </Link>
 
            <Link href="/mutual/settings" className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-[#D4A574] hover:shadow-xl transition text-center group">
              <Settings size={32} className="text-[#D4A574] mx-auto mb-3 group-hover:scale-110 transition" />
              <h4 className="font-bold text-[#1a1a1a]">Settings</h4>
              <p className="text-gray-500 text-sm mt-1">Account settings</p>
            </Link>
          </div>
        </section>
 
        <section className="max-w-7xl mx-auto px-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#1a1a1a]">Recent Orders</h3>
            <Link href="/handyman/handyOrders" className="text-[#D4A574] hover:text-[#B8A565] font-medium text-sm">
              View All Orders
            </Link>
          </div>
 
          {(!profile?.recentOrders || profile.recentOrders.length === 0) ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShoppingBag size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-400 text-lg mb-2">No recent orders</p>
              <p className="text-gray-500 text-sm mb-4">Accept jobs to see them here</p>
              <Link
                href="/handyman/handyFindJobs"
                className="inline-block px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#B8A565] transition font-semibold shadow-lg hover:shadow-xl"
              >
                Browse Available Jobs
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.recentOrders.slice(0, 3).map((order) => (
                <div key={order._id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#D4A574] to-[#B8A565] rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xl font-bold">{order.title.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-[#1a1a1a] text-lg mb-1">{order.title}</h4>
                        <p className="text-gray-600 text-sm mb-1">{order.description}</p>
                        {order.clientName && (
                          <p className="text-gray-500 text-xs">Client: {order.clientName}</p>
                        )}
                        {order.date && (
                          <p className="text-gray-400 text-xs mt-1">{order.date}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      order.status === 'declined' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
 
        <section className="max-w-7xl mx-auto px-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#1a1a1a]">My Services</h3>
            <Link href="/handyman/handyPostServices" className="text-[#D4A574] hover:text-[#B8A565] font-medium text-sm">
              Manage Services
            </Link>
          </div>
 
          {(!profile?.services || profile.services.length === 0) ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPlus size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-400 text-lg mb-2">No services added</p>
              <p className="text-gray-500 text-sm mb-4">Add your services to attract clients</p>
              <Link
                href="/handyman/handyPostServices"
                className="inline-block px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#B8A565] transition font-semibold shadow-lg hover:shadow-xl"
              >
                Add Services
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.services.slice(0, 6).map((service, i) => (
                <div key={service._id || i} className="bg-white rounded-xl shadow-lg p-5 border-2 border-gray-200 hover:border-[#D4A574] hover:shadow-xl transition">
                  <h4 className="font-bold text-[#1a1a1a] text-lg mb-2">{service.title}</h4>
                  <p className="text-gray-600 text-sm mb-2">{service.description || "Professional service"}</p>
                  {service.price && (
                    <p className="text-[#D4A574] font-bold text-lg">${service.price}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
 
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-[#1a1a1a] mb-4">Upload Profile Picture</h3>
           
            <div className="mb-6">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-40 h-40 mx-auto rounded-full object-cover border-4 border-[#D4A574]"
                />
              ) : (
                <div className="w-40 h-40 mx-auto mb-4 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  <Upload size={48} className="text-gray-400" />
                </div>
              )}
            </div>
 
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
 
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Choose Image
              </button>
             
              {selectedFile && (
                <button
                  onClick={handleUploadImage}
                  disabled={uploadingImage}
                  className="flex-1 px-4 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#B8A565] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? 'Uploading...' : 'Upload'}
                </button>
              )}
             
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
 
            <p className="text-xs text-gray-500 mt-4 text-center">
              Maximum file size: 5MB. Accepted formats: JPG, PNG, GIF
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
