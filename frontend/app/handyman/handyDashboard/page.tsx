"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {  Menu,  X,  Briefcase,  Settings,  HelpCircle,  Crown,  Wrench, Bell, Upload, Camera} from "lucide-react";
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
  jobsInProgressCount: number;
  rating: number;
  earnings: number;
  activeOrdersCount: number;
  jobAcceptCount: number;
  services: Service[];
  recentOrders: Order[];
  planType?: 'Basic' | 'Standard' | 'Premium';
  verified?: boolean;
  notificationsCount: number;
  reviewsCount?: number;
};

export default function HandyDashboard() {
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
    
    // Refetch when page becomes visible (e.g., returning from settings)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProfile();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/signup?mode=login");
        return;
      }

      const res = await fetch("http://localhost:7000/api/handymen/me", {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (res.ok) {
        const data: Profile = await res.json();
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
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
      formData.append('profileImage', selectedFile); // Must match backend field name

      const res = await fetch("http://localhost:7000/api/handymen/upload-profile-pic", {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          // DO NOT set Content-Type - browser sets it automatically with boundary
        },
        body: formData, // Send FormData, not JSON
      });

      if (res.ok) {
        const data = await res.json();
        // Update with the URL returned from backend
        setProfile(prev => prev ? { 
          ...prev, 
          profileImage: data.profilePic || data.imageUrl,
          profilePic: data.profilePic || data.imageUrl
        } : null);
        setShowUploadModal(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        
        // Refetch to get fresh data
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

  const toggleMenu = () => { 
    setShowMenu(s => !s); 
    setShowProfileMenu(false); 
  };

  const toggleProfile = () => { 
    setShowProfileMenu(s => !s); 
    setShowMenu(false); 
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
    <div className="min-h-screen bg-[#F5F5F0] text-gray-900 flex flex-col">
      {/* HEADER */}
       <div>
        <Header pageTitle="Handyman Dashboard" onLogout={handleLogout} />
      </div>
      <main className="flex-1 overflow-y-auto pb-10">
        {/* PROFILE CARD WITH INLINE BADGES */}
        <section className="bg-gradient-to-br from-[#D4A574] to-[#B8A565] py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col items-center text-center mb-8">
              {/* Profile Picture with Upload Button */}
              <div className="relative mb-4">
                {profile?.profileImage ? (
                  <img 
                    src={profile.profileImage} 
                    alt="Profile" 
                    className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full border-4 border-white bg-white/20 flex items-center justify-center">
                    <FiUser size={48} className="text-white" />
                  </div>
                )}
                
                {/* Camera Icon Button */}
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="absolute bottom-0 right-0 bg-[#D4A574] p-2 rounded-full border-4 border-white shadow-lg hover:bg-[#B8A565] transition"
                >
                  <Camera size={20} className="text-white" />
                </button>
              </div>

              <div>
                {/* Name with Inline Badges */}
                <div className="flex items-center gap-2 justify-center mb-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-white">
                    {profile?.name || "Your Name"}
                  </h2>
                  
                  {/* Membership Badge - Inline with Name */}
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
                  
                  {/* Verified Badge */}
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

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30">
                <p className="text-3xl font-bold text-white">{profile?.jobsDone || 0}</p>
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

        {/* EARNINGS & ACTIVE ORDERS */}
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
                  <p className="text-3xl font-bold text-[#1a1a1a]">{profile?.activeOrdersCount || 0}</p>
                  <p className="text-gray-400 text-xs mt-1">Currently Working</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#D4A574] to-[#B8A565] rounded-xl flex items-center justify-center">
                  <FiShoppingBag size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="max-w-7xl mx-auto px-6 mb-8">
          <h3 className="text-xl font-bold text-[#1a1a1a] mb-6">Quick Actions</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/handyman/find-jobs" className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-[#D4A574] hover:shadow-xl transition text-center group">
              <Briefcase size={32} className="text-[#D4A574] mx-auto mb-3 group-hover:scale-110 transition" />
              <h4 className="font-bold text-[#1a1a1a]">Find Jobs</h4>
              <p className="text-gray-500 text-sm mt-1">Browse available jobs</p>
            </Link>

            <Link href="/handyman/my-services" className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-[#D4A574] hover:shadow-xl transition text-center group">
              <Wrench size={32} className="text-[#D4A574] mx-auto mb-3 group-hover:scale-110 transition" />
              <h4 className="font-bold text-[#1a1a1a]">My Services</h4>
              <p className="text-gray-500 text-sm mt-1">Manage your services</p>
            </Link>

            <Link href="/handyman/membership" className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-[#D4A574] hover:shadow-xl transition text-center group">
              <Crown size={32} className="text-[#D4A574] mx-auto mb-3 group-hover:scale-110 transition" />
              <h4 className="font-bold text-[#1a1a1a]">Membership</h4>
              <p className="text-gray-500 text-sm mt-1">View your plan</p>
            </Link>

            <Link href="/handyman/help" className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-[#D4A574] hover:shadow-xl transition text-center group">
              <HelpCircle size={32} className="text-[#D4A574] mx-auto mb-3 group-hover:scale-110 transition" />
              <h4 className="font-bold text-[#1a1a1a]">Help</h4>
              <p className="text-gray-500 text-sm mt-1">Get support</p>
            </Link>
          </div>
        </section>

        {/* RECENT ORDERS */}
        <section className="max-w-7xl mx-auto px-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#1a1a1a]">Recent Orders</h3>
            <Link href="/handyman/find-jobs" className="text-[#D4A574] hover:text-[#B8A565] font-medium text-sm">
              View All Jobs
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
                href="/handyman/find-jobs"
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

        {/* MY SERVICES */}
        <section className="max-w-7xl mx-auto px-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#1a1a1a]">My Services</h3>
            <Link href="/handyman/my-services" className="text-[#D4A574] hover:text-[#B8A565] font-medium text-sm">
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
                href="/handyman/my-services"
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

      {/* UPLOAD PROFILE IMAGE MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-[#1a1a1a] mb-4">Upload Profile Picture</h3>
            
            {/* Preview Area */}
            <div className="mb-6">
              {previewUrl ? (
                <div className="relative w-40 h-40 mx-auto mb-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-40 h-40 rounded-full object-cover border-4 border-[#D4A574]"
                  />
                </div>
              ) : (
                <div className="w-40 h-40 mx-auto mb-4 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  <Upload size={48} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Buttons */}
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