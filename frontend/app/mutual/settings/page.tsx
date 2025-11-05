"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, User, Lock, Monitor, Bell, Trash2,LogOut,Save,Mail,Phone,MapPin,AlertCircle,CheckCircle,Moon,Sun,Upload,X } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { useTranslation } from "../../lib/translations";

type UserType = 'handyman' | 'client' | 'customer' | 'admin';

interface AccountData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  contact?: string;
  address: string;
  bio?: string;
  profileImage: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const settings = useSettings();
  const { t } = useTranslation(settings.language);
  
  const [activeTab, setActiveTab] = useState<'account' | 'password' | 'display' | 'notifications' | 'delete'>('account');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userType, setUserType] = useState<UserType>('client');
  
  const [accountData, setAccountData] = useState<AccountData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+1 ',
    address: '',
    bio: '',
    profileImage: ''
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/signup?mode=login");
        return;
      }

      // Try client first, then handyman
      let profileRes = await fetch("http://localhost:7000/api/clients/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!profileRes.ok) {
        profileRes = await fetch("http://localhost:7000/api/handymen/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserType(profileData.userType || 'client');
        
        setAccountData({
          firstName: profileData.firstName || profileData.name?.split(" ")[0] || "",
          lastName: profileData.lastName || profileData.name?.split(" ")[1] || "",
          email: profileData.email || "",
          phone: profileData.phone || profileData.contact || "+1 ",
          contact: profileData.contact || profileData.phone || "",
          address: profileData.address || "",
          bio: profileData.bio || "",
          profileImage: profileData.profileImage || profileData.profilePic || ""
        });
      } else if (profileRes.status === 401) {
        localStorage.removeItem("token");
        router.push("/signup?mode=login");
      }

      // Refresh settings from context
      await settings.refreshSettings();
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [router, settings]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handlePhoneChange = (value: string) => {
    let cleaned = value.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+1')) {
      cleaned = '+1 ' + cleaned.replace(/^\+?1?/, '');
    } else if (!cleaned.startsWith('+1 ')) {
      cleaned = cleaned.replace('+1', '+1 ');
    }
    const numbers = cleaned.substring(3).replace(/\D/g, '');
    let formatted = '+1 ';
    if (numbers.length > 0) formatted += numbers.substring(0, 3);
    if (numbers.length > 3) formatted += '-' + numbers.substring(3, 6);
    if (numbers.length > 6) formatted += '-' + numbers.substring(6, 10);
    setAccountData({ ...accountData, phone: formatted });
  };

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const endpoint = userType === "handyman" 
        ? "http://localhost:7000/api/handymen/update" 
        : "http://localhost:7000/api/clients/update";
      
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: accountData.firstName,
          lastName: accountData.lastName,
          email: accountData.email,
          phone: accountData.phone,
          contact: accountData.phone,
          address: accountData.address,
          bio: accountData.bio,
          name: `${accountData.firstName} ${accountData.lastName}`
        })
      });

      const data = await res.json();
      if (res.ok) {
        showAlert('success', t('accountUpdatedSuccess') || 'Account updated successfully!');
        // Refresh the router to update cached data
        router.refresh();
      } else {
        showAlert('error', data.message || 'Failed to update account');
      }
    } catch (err) {
      console.error("Update error:", err);
      showAlert('error', t('networkError') || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert('error', t('passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      showAlert('error', t('passwordMust8Chars') || 'Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:7000/api/settings/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        showAlert('success', t('passwordChangedSuccess') || 'Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showAlert('error', data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error("Password error:", err);
      showAlert('error', t('networkError') || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDisplayUpdate = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:7000/api/settings/display", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          theme: settings.theme,
          language: settings.language,
          timezone: settings.timezone
        })
      });

      const data = await res.json();
      if (res.ok) {
        showAlert('success', t('displaySettingsUpdatedSuccess') || 'Display settings updated!');
        await settings.refreshSettings();
      } else {
        showAlert('error', data.message || 'Failed to update display settings');
      }
    } catch (err) {
      console.error("Display error:", err);
      showAlert('error', t('networkError') || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:7000/api/settings/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings.notifications)
      });

      const data = await res.json();
      if (res.ok) {
        showAlert('success', t('notificationsSavedSuccess') || 'Notification preferences saved!');
        await settings.refreshSettings();
      } else {
        showAlert('error', data.message || 'Failed to update notifications');
      }
    } catch (err) {
      console.error("Notification error:", err);
      showAlert('error', t('networkError') || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/signup?mode=login");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== 'delete') {
      showAlert('error', 'Please type DELETE to confirm');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:7000/api/settings/account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        localStorage.removeItem("token");
        showAlert('success', 'Account deleted successfully');
        setTimeout(() => router.push("/signup?mode=signup"), 1500);
      } else {
        const data = await res.json();
        showAlert('error', data.message || 'Failed to delete account');
      }
    } catch (err) {
      console.error("Delete error:", err);
      showAlert('error', t('networkError') || 'Network error');
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
      setDeleteConfirmation('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showAlert('error', 'Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      showAlert('error', 'File size must be less than 5MB');
      return;
    }

    setSaving(true);
    
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('profileImage', file); // Must match backend field name
      
      // Use the proper upload endpoint
      const endpoint = userType === "handyman" 
        ? "http://localhost:7000/api/handymen/upload-profile-pic" 
        : "http://localhost:7000/api/clients/upload-profile-image";
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          // DO NOT set Content-Type - browser sets it automatically
        },
        body: formData // Send FormData, not JSON
      });

      if (res.ok) {
        const data = await res.json();
        setAccountData({ 
          ...accountData, 
          profileImage: data.profilePic || data.imageUrl 
        });
        showAlert('success', 'Profile picture updated successfully!');
        
        // Refetch profile to update everywhere
        await fetchProfileData();
      } else {
        const data = await res.json();
        showAlert('error', data.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error("Image upload error:", err);
      showAlert('error', t('networkError') || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { id: 'account', label: 'Account Management', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'display', label: 'Display Settings', icon: Monitor },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'logout', label: 'Logout', icon: LogOut, action: handleLogout },
    { id: 'delete', label: 'Delete Account', icon: Trash2, danger: true }
  ];

  const getDashboardLink = () => {
    return userType === 'handyman' ? '/handyDashboard' : '/clientDashboard';
  };

  if (loading && !accountData.email) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4A574] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* HEADER */}
      <header className="bg-[#1a1a1a] shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href={getDashboardLink()}
              className="p-2 rounded-lg hover:bg-[#2a2a2a] transition"
            >
              <ArrowLeft size={24} className="text-white" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>
          <div className="text-white text-sm">
            <span className="bg-[#D4A574] px-3 py-1 rounded-full capitalize font-medium">
              {userType}
            </span>
          </div>
        </div>
      </header>

      {/* ALERT */}
      {alert && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-xl ${
            alert.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <p className="font-medium">{alert.message}</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* SIDEBAR NAVIGATION */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-24">
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  // Handle Logout specially
                  if (item.id === 'logout') {
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-gray-700 hover:bg-gray-100"
                      >
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  }
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as 'account' | 'password' | 'display' | 'notifications' | 'delete')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive 
                          ? 'bg-[#D4A574] text-white' 
                          : item.danger
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-md p-6">
              {/* ACCOUNT MANAGEMENT */}
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">Account Management</h2>
                  <form onSubmit={handleAccountUpdate} className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
                      <div className="relative">
                        {accountData.profileImage ? (
                          <Image 
                            src={accountData.profileImage} 
                            alt="Profile" 
                            width={80} 
                            height={80} 
                            className="rounded-full object-cover border-4 border-[#D4A574]" 
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-[#D4A574] to-[#B8A565] rounded-full flex items-center justify-center">
                            <User size={32} className="text-white" />
                          </div>
                        )}
                        <label className="absolute bottom-0 right-0 bg-[#D4A574] p-2 rounded-full cursor-pointer hover:bg-[#B8A565] transition shadow-lg">
                          <Upload size={16} className="text-white" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-[#1a1a1a]">Profile Picture</h3>
                        <p className="text-sm text-gray-600">Upload a new profile picture</p>
                        <p className="text-xs text-gray-500 mt-1">Max 5MB • JPG, PNG, GIF</p>
                      </div>
                    </div>

                    {/* Name Fields */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <User size={16} />
                          First Name
                        </label>
                        <input
                          type="text"
                          value={accountData.firstName}
                          onChange={(e) => setAccountData({...accountData, firstName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                          placeholder="John"
                          required
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <User size={16} />
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={accountData.lastName}
                          onChange={(e) => setAccountData({...accountData, lastName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Mail size={16} />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={accountData.email}
                        onChange={(e) => setAccountData({...accountData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574] bg-gray-50"
                        placeholder="john@example.com"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Phone size={16} />
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        value={accountData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                        placeholder="+1 555-123-4567"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <MapPin size={16} />
                        Address
                      </label>
                      <input
                        type="text"
                        value={accountData.address}
                        onChange={(e) => setAccountData({...accountData, address: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                        placeholder="123 Main St, City, State, ZIP"
                      />
                    </div>

                    {/* Bio */}
                    {userType === 'handyman' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Bio
                        </label>
                        <textarea
                          value={accountData.bio}
                          onChange={(e) => setAccountData({...accountData, bio: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574] min-h-[120px]"
                          placeholder="Tell clients about your skills and experience..."
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#B8A565] transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={20} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* CHANGE PASSWORD */}
              {activeTab === 'password' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">Change Password</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Lock size={16} />
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                        placeholder="Enter current password"
                        required
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Lock size={16} />
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                        placeholder="Enter new password"
                        required
                        minLength={8}
                      />
                      <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Lock size={16} />
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#B8A565] transition font-semibold disabled:opacity-50"
                    >
                      <Save size={20} />
                      {saving ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              )}

              {/* DISPLAY SETTINGS */}
              {activeTab === 'display' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">Display Settings</h2>
                  <div className="space-y-6 max-w-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">Theme</label>
                      <div className="grid grid-cols-3 gap-4">
                        <button
                          type="button"
                          onClick={() => settings.setTheme('light')}
                          className={`p-4 border-2 rounded-lg transition ${
                            settings.theme === 'light' 
                              ? 'border-[#D4A574] bg-[#D4A574]/10' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Sun size={32} className="mx-auto mb-2 text-yellow-500" />
                          <p className="font-medium text-gray-900 text-sm">Light</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => settings.setTheme('dark')}
                          className={`p-4 border-2 rounded-lg transition ${
                            settings.theme === 'dark' 
                              ? 'border-[#D4A574] bg-[#D4A574]/10' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Moon size={32} className="mx-auto mb-2 text-gray-700" />
                          <p className="font-medium text-gray-900 text-sm">Dark</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => settings.setTheme('auto')}
                          className={`p-4 border-2 rounded-lg transition ${
                            settings.theme === 'auto' 
                              ? 'border-[#D4A574] bg-[#D4A574]/10' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Monitor size={32} className="mx-auto mb-2 text-gray-600" />
                          <p className="font-medium text-gray-900 text-sm">Auto</p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Language</label>
                      <select 
                        value={settings.language} 
                        onChange={(e) => settings.setLanguage(e.target.value as 'en' | 'es' | 'fr' | 'de')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                      >
                        <option value="en">🇺🇸 English</option>
                        <option value="es">🇪🇸 Spanish</option>
                        <option value="fr">🇫🇷 French</option>
                        <option value="de">🇩🇪 German</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Timezone</label>
                      <select 
                        value={settings.timezone} 
                        onChange={(e) => settings.setTimezone(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="EST">EST (Eastern Time)</option>
                        <option value="CST">CST (Central Time)</option>
                        <option value="MST">MST (Mountain Time)</option>
                        <option value="PST">PST (Pacific Time)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleDisplayUpdate}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#B8A565] transition font-semibold disabled:opacity-50"
                    >
                      <Save size={20} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* NOTIFICATION SETTINGS */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">Notification Settings</h2>
                  <div className="space-y-4">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                      { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS' },
                      { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications in browser' },
                      { key: 'jobAlerts', label: 'Job Alerts', desc: 'Get notified about new job opportunities' },
                      { key: 'messageAlerts', label: 'Message Alerts', desc: 'Get notified when you receive new messages' }
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#D4A574] transition">
                        <div>
                          <p className="font-medium text-gray-900">{label}</p>
                          <p className="text-sm text-gray-500">{desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications[key as keyof typeof settings.notifications]}
                            onChange={(e) => settings.updateNotifications({
                              ...settings.notifications, 
                              [key]: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#D4A574] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                      </div>
                    ))}

                    <button
                      onClick={handleNotificationUpdate}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#B8A565] transition font-semibold disabled:opacity-50 mt-6"
                    >
                      <Save size={20} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* DELETE ACCOUNT */}
              {activeTab === 'delete' && (
                <div>
                  <h2 className="text-2xl font-bold text-red-600 mb-6">Delete Account</h2>
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-red-900 mb-2">⚠️ Warning: This action is irreversible!</h3>
                        <p className="text-red-700 text-sm mb-2">
                          Deleting your account will permanently remove:
                        </p>
                        <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
                          <li>Your profile and all personal information</li>
                          <li>All your {userType === 'handyman' ? 'services and job history' : 'bookings and job postings'}</li>
                          <li>All messages and conversations</li>
                          <li>Access to the platform</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                  >
                    <Trash2 size={20} />
                    Delete My Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-red-600">Confirm Account Deletion</h3>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="ml-auto p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-gray-700 mb-4">
              This action cannot be undone. All your data will be permanently deleted.
            </p>

            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-4 py-3 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Type DELETE here"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation.toLowerCase() !== 'delete' || saving}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}