"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, X, Briefcase, Users, Calendar, HelpCircle, Settings, AlertCircle,Bell,Upload,Camera } from "lucide-react";
import { FiUser, FiDollarSign, FiShoppingBag } from "react-icons/fi";

type Booking = {
  _id: string;
  service: string;
  handyman: string;
  status: 'pending' | 'accepted' | 'declined' | 'in-progress' | 'completed';
  date: string;
};

type ClientProfile = {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  contact?: string;
  address?: string;
  bio?: string;
  profileImage?: string;
  servicesBooked: number;
  ongoingServices: number;
  totalSpent: number;
  activeBookings: number;
  jobPostedCount: number;
  notificationsCount: number;
  recentBookings: Booking[];
};

export default function ClientDashboard() {
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/signup?mode=login");
        return;
      }

      const res = await fetch("http://localhost:7000/api/client", {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setError(null);
      } else if (res.status === 401) {
        localStorage.removeItem("token");
        router.push("/signup?mode=login");
      } else if (res.status === 404) {
        setError("Profile not found. Please complete your profile setup.");
      } else if (res.status >= 500) {
        setError("Our servers are experiencing issues. Please try again in a moment.");
      } else {
        setError("Unable to load your profile. Please try again.");
      }
    } catch (err) {
      setError("Connection error. Please check your internet connection and try again.");
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

      const res = await fetch("http://localhost:7000/api/client/upload-profile-image", {
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
    setShowMenu(!showMenu);
    setShowProfileMenu(false);
  };

  const toggleProfile = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowMenu(false);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'declined': return 'bg-red-100 text-red-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4A574] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => fetchProfile()} 
              className="px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#B8A565] transition font-medium"
            >
              Try Again
            </button>
            <button 
              onClick={() => router.push("/")} 
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col text-gray-900">
      {/* HEADER */}
      <header className="bg-[#1a1a1a] shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Client Dashboard
          </h1>

          <div className="flex items-center gap-4 relative">
            {/* Notifications Bell */}
            <button className="relative p-2 rounded-full hover:bg-[#2a2a2a] transition">
              <Bell size={22} className="text-white" />
              {profile && profile.notificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {profile.notificationsCount > 9 ? '9+' : profile.notificationsCount}
                </span>
              )}
            </button>

            {/* Profile Button */}
            <button
              onClick={toggleProfile}
              className="p-2 rounded-full hover:bg-[#2a2a2a] transition"
            >
              {profile?.profileImage ? (
                <Image 
                  src={profile.profileImage} 
                  alt="Profile" 
                  width={32} 
                  height={32} 
                  className="rounded-full object-cover" 
                />
              ) : (
                <FiUser size={24} className="text-white" />
              )}
            </button>

            {showProfileMenu && (
              <div className="absolute right-14 top-14 bg-white border border-gray-200 rounded-lg shadow-xl w-52 z-50">
                <ul className="text-sm text-gray-800">
                  <li>
                    <Link
                      href="/clientAccount"
                      className="block px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      My Account
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/settings"
                      className="block px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Settings
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

            {/* Menu Button */}
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
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                      onClick={() => setShowMenu(false)}
                    >
                      <Briefcase size={20} className="text-[#D4A574]" />
                      Post a Job
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/client/find-handyman"
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                      onClick={() => setShowMenu(false)}
                    >
                      <Users size={20} className="text-[#D4A574]" />
                      Find Handyman
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/client/bookings"
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                      onClick={() => setShowMenu(false)}
                    >
                      <Calendar size={20} className="text-[#D4A574]" />
                      Recent Bookings
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/client/help"
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                      onClick={() => setShowMenu(false)}
                    >
                      <HelpCircle size={20} className="text-[#D4A574]" />
                      Help & Support
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                      onClick={() => setShowMenu(false)}
                    >
                      <Settings size={20} className="text-[#D4A574]" />
                      Settings
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PROFILE SECTION */}
      <main className="flex-1 overflow-y-auto pb-10">
        <section className="bg-gradient-to-br from-[#D4A574] to-[#B8A565] py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col items-center text-center mb-8">
              {/* Profile Picture with Upload Button */}
              <div className="relative mb-4">
                {profile?.profileImage ? (
                  <Image
                    src={profile.profileImage}
                    alt="Profile"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-white shadow-lg object-cover"
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

              <h2 className="text-2xl font-bold text-white mt-2">
                {profile?.firstName && profile?.lastName 
                  ? `${profile.firstName} ${profile.lastName}` 
                  : profile?.name || "Your Name"}
              </h2>
              <p className="text-sm text-white/90">
                {profile?.email || "your.email@example.com"}
              </p>
              {profile?.contact && (
                <p className="text-sm text-white/80 mt-1">
                  📱 {profile.contact}
                </p>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30">
                <p className="text-3xl font-bold text-white">{profile?.servicesBooked || 0}</p>
                <p className="text-white/90 text-sm mt-1">Services Booked</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30">
                <p className="text-3xl font-bold text-white">{profile?.ongoingServices || 0}</p>
                <p className="text-white/90 text-sm mt-1">Ongoing</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30">
                <p className="text-3xl font-bold text-white">{profile?.activeBookings || 0}</p>
                <p className="text-white/90 text-sm mt-1">Active Bookings</p>
              </div>
            </div>
          </div>
        </section>

        {/* SPENDING & BOOKINGS */}
        <section className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Total Spent</p>
                  <p className="text-3xl font-bold text-[#1a1a1a]">${profile?.totalSpent || 0}</p>
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
                  <p className="text-gray-500 text-sm font-medium mb-1">Jobs Posted</p>
                  <p className="text-3xl font-bold text-[#1a1a1a]">{profile?.jobPostedCount || 0}</p>
                  <p className="text-gray-400 text-xs mt-1">Total Listings</p>
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
            <Link href="/client/post-job" className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-[#D4A574] hover:shadow-xl transition text-center group">
              <Briefcase size={32} className="text-[#D4A574] mx-auto mb-3 group-hover:scale-110 transition" />
              <h4 className="font-bold text-[#1a1a1a]">Post a Job</h4>
              <p className="text-gray-500 text-sm mt-1">Hire handymen</p>
            </Link>

            <Link href="/client/find-handyman" className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-[#D4A574] hover:shadow-xl transition text-center group">
              <Users size={32} className="text-[#D4A574] mx-auto mb-3 group-hover:scale-110 transition" />
              <h4 className="font-bold text-[#1a1a1a]">Find Handyman</h4>
              <p className="text-gray-500 text-sm mt-1">Browse profiles</p>
            </Link>

            <Link href="/client/bookings" className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-[#D4A574] hover:shadow-xl transition text-center group">
              <Calendar size={32} className="text-[#D4A574] mx-auto mb-3 group-hover:scale-110 transition" />
              <h4 className="font-bold text-[#1a1a1a]">Bookings</h4>
              <p className="text-gray-500 text-sm mt-1">Track orders</p>
            </Link>

            <Link href="/client/help" className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-[#D4A574] hover:shadow-xl transition text-center group">
              <HelpCircle size={32} className="text-[#D4A574] mx-auto mb-3 group-hover:scale-110 transition" />
              <h4 className="font-bold text-[#1a1a1a]">Help</h4>
              <p className="text-gray-500 text-sm mt-1">Get support</p>
            </Link>
          </div>
        </section>

        {/* RECENT BOOKINGS WITH STATUS */}
        <section className="max-w-7xl mx-auto px-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#1a1a1a]">Recent Bookings</h3>
            <Link href="/client/bookings" className="text-[#D4A574] hover:text-[#B8A565] font-medium text-sm">
              View All
            </Link>
          </div>

          {(!profile?.recentBookings || profile.recentBookings.length === 0) ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-400 text-lg mb-2">No bookings yet</p>
              <p className="text-gray-500 text-sm mb-4">Post your first job to get started</p>
              <Link 
                href="/client/post-job"
                className="inline-block px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#B8A565] transition font-semibold shadow-lg hover:shadow-xl"
              >
                Post a Job
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.recentBookings.map((booking) => (
                <div key={booking._id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-[#1a1a1a] text-lg mb-1">{booking.service}</h4>
                      <p className="text-gray-600 text-sm mb-2">Handyman: {booking.handyman}</p>
                      <p className="text-gray-500 text-xs">{booking.date}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(booking.status)}`}>
                      {booking.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
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
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    width={160}
                    height={160}
                    className="rounded-full object-cover border-4 border-[#D4A574]"
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
                  className="flex-1 px-4 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#B8A565] transition font-medium disabled:opacity-50"
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
