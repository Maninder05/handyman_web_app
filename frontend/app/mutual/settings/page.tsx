"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, User, Lock, Monitor, Bell, Trash2, LogOut, Save, Mail, Phone, MapPin, AlertCircle, CheckCircle, Upload, X, Menu } from "lucide-react";

type UserType = 'handyman' | 'client' | 'admin';

interface AccountData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  bio?: string;
  profileImage: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  jobAlerts: boolean;
  messageAlerts: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'account' | 'password' | 'display' | 'notifications' | 'delete'>('account');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userType, setUserType] = useState<UserType>('client');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [language, setLanguage] = useState<'en' | 'es' | 'fr' | 'de'>('en');
  const [timezone, setTimezone] = useState('UTC');
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    jobAlerts: true,
    messageAlerts: true,
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const loadDisplaySettings = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null;
    const savedLanguage = localStorage.getItem('language') as 'en' | 'es' | 'fr' | 'de' | null;
    const savedTimezone = localStorage.getItem('timezone');
    const savedNotifications = localStorage.getItem('notifications');
    
    if (savedTheme) setTheme(savedTheme);
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedTimezone) setTimezone(savedTimezone);
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/signup?mode=login");
        return;
      }

      let res = await fetch("http://localhost:7000/api/client", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUserType(data.userType || 'client');
        setAccountData({
          firstName: data.firstName || data.name?.split(" ")[0] || "",
          lastName: data.lastName || data.name?.split(" ")[1] || "",
          email: data.email || "",
          phone: data.phone || data.contact || "+1 ",
          address: data.address || "",
          bio: data.bio || "",
          profileImage: data.profileImage || data.profilePic || ""
        });
      } else {
        res = await fetch("http://localhost:7000/api/handyman", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setUserType(data.userType || 'handyman');
          setAccountData({
            firstName: data.firstName || data.name?.split(" ")[0] || "",
            lastName: data.lastName || data.name?.split(" ")[1] || "",
            email: data.email || "",
            phone: data.phone || data.contact || "+1 ",
            address: data.address || "",
            bio: data.bio || "",
            profileImage: data.profileImage || data.profilePic || ""
          });
        } else if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/signup?mode=login");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert('error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
    loadDisplaySettings();
  }, [fetchProfile, loadDisplaySettings]);

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
      const endpoint = userType === 'handyman' 
        ? "http://localhost:7000/api/handyman"
        : "http://localhost:7000/api/client";
      
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: accountData.firstName,
          lastName: accountData.lastName,
          name: `${accountData.firstName} ${accountData.lastName}`,
          phone: accountData.phone,
          contact: accountData.phone,
          address: accountData.address,
          bio: accountData.bio
        })
      });

      if (res.ok) {
        showAlert('success', 'Account updated successfully!');
        router.refresh();
      } else {
        const data = await res.json();
        showAlert('error', data.message || 'Failed to update');
      }
    } catch {
      showAlert('error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert('error', 'Passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      showAlert('error', 'Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:7000/api/users/change-password", {
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

      if (res.ok) {
        showAlert('success', 'Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await res.json();
        showAlert('error', data.message || 'Failed to change password');
      }
    } catch {
      showAlert('error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDisplayUpdate = () => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('language', language);
    localStorage.setItem('timezone', timezone);
    applyTheme(theme);
    showAlert('success', 'Display settings saved!');
  };

  const applyTheme = (themeValue: 'light' | 'dark' | 'auto') => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    if (themeValue === 'dark') {
      root.classList.add('dark');
    } else if (themeValue === 'light') {
      root.classList.remove('dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  };

  const handleNotificationUpdate = () => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    showAlert('success', 'Notification preferences saved!');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      formData.append('profileImage', file);
      
      const endpoint = userType === 'handyman'
        ? "http://localhost:7000/api/handyman/upload-profile-pic"
        : "http://localhost:7000/api/client/upload-profile-pic";
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setAccountData({ 
          ...accountData, 
          profileImage: data.profilePic || data.imageUrl 
        });
        showAlert('success', 'Profile picture updated!');
        await fetchProfile();
      } else {
        const data = await res.json();
        showAlert('error', data.message || 'Failed to upload image');
      }
    } catch {
      showAlert('error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== 'delete') {
      showAlert('error', 'Please type DELETE to confirm');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const endpoint = userType === 'handyman'
        ? "http://localhost:7000/api/handyman"
        : "http://localhost:7000/api/client";
      
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        localStorage.removeItem("token");
        showAlert('success', 'Account deleted');
        setTimeout(() => router.push("/signup?mode=signup"), 1500);
      } else {
        const data = await res.json();
        showAlert('error', data.message || 'Failed to delete');
      }
    } catch {
      showAlert('error', 'Network error');
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  const getDashboardLink = () => {
    return userType === 'handyman' ? '/handyman/handyDashboard' : '/client/clientDashboard';
  };

  if (loading && !accountData.email) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D4A574] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const menuItems = [
    { id: 'account', label: 'Account Management', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'display', label: 'Display Settings', icon: Monitor },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'logout', label: 'Logout', icon: LogOut, action: handleLogout },
    { id: 'delete', label: 'Delete Account', icon: Trash2, danger: true }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#0a0a0a]">
      <header className="bg-[#1a1a1a] shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href={getDashboardLink()} className="p-2 rounded-lg hover:bg-[#2a2a2a] transition">
              <ArrowLeft size={24} className="text-white" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>
          <span className="bg-[#D4A574] px-3 py-1 rounded-full capitalize font-medium text-white text-sm">
            {userType}
          </span>
        </div>
      </header>

      {alert && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-xl ${
            alert.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <p className="font-medium">{alert.message}</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-md mb-4"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          <span className="font-medium">Menu</span>
        </button>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className={`lg:col-span-1 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-md p-4 sticky top-24">
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  if (item.id === 'logout') {
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                      >
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  }
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as 'account' | 'password' | 'display' | 'notifications' | 'delete');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive 
                          ? 'bg-[#D4A574] text-white' 
                          : item.danger
                            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
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

          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-md p-6">
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1a1a1a] dark:text-gray-100 mb-6">Account Management</h2>
                  <form onSubmit={handleAccountUpdate} className="space-y-6">
                    <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        {accountData.profileImage ? (
                          <Image 
                            src={accountData.profileImage} 
                            alt="Profile" 
                            width={100} 
                            height={100} 
                            className="rounded-full object-cover border-4 border-[#D4A574]" 
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gradient-to-br from-[#D4A574] to-[#B8A565] rounded-full flex items-center justify-center">
                            <User size={40} className="text-white" />
                          </div>
                        )}
                        <label className="absolute bottom-0 right-0 bg-[#D4A574] p-2 rounded-full cursor-pointer hover:bg-[#B8A565] transition shadow-lg">
                          <Upload size={16} className="text-white" />
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-[#1a1a1a] dark:text-gray-100">Profile Picture</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Upload a new profile picture</p>
                        <p className="text-xs text-gray-500 mt-1">Max 5MB • JPG, PNG, GIF</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <User size={16} /> First Name
                        </label>
                        <input
                          type="text"
                          value={accountData.firstName}
                          onChange={(e) => setAccountData({...accountData, firstName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                          required
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <User size={16} /> Last Name
                        </label>
                        <input
                          type="text"
                          value={accountData.lastName}
                          onChange={(e) => setAccountData({...accountData, lastName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Mail size={16} /> Email
                      </label>
                      <input
                        type="email"
                        value={accountData.email}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2a2a] dark:text-gray-100 rounded-lg"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Phone size={16} /> Phone
                      </label>
                      <input
                        type="tel"
                        value={accountData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <MapPin size={16} /> Address
                      </label>
                      <input
                        type="text"
                        value={accountData.address}
                        onChange={(e) => setAccountData({...accountData, address: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                      />
                    </div>

                    {userType === 'handyman' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Bio</label>
                        <textarea
                          value={accountData.bio}
                          onChange={(e) => setAccountData({...accountData, bio: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574] min-h-[120px]"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#B8A565] transition font-semibold disabled:opacity-50"
                    >
                      <Save size={20} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'password' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1a1a1a] dark:text-gray-100 mb-6">Change Password</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Lock size={16} /> Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                        required
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Lock size={16} /> New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                        required
                        minLength={8}
                      />
                      <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Lock size={16} /> Confirm Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
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

              {activeTab === 'display' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1a1a1a] dark:text-gray-100 mb-6">Display Settings</h2>
                  <div className="space-y-6 max-w-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                      <select 
                        value={theme} 
                        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')} 
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                      <select 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value as 'en' | 'es' | 'fr' | 'de')} 
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                      <select 
                        value={timezone} 
                        onChange={(e) => setTimezone(e.target.value)} 
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                      >
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern (EST)</option>
                        <option value="CST">Central (CST)</option>
                        <option value="MST">Mountain (MST)</option>
                        <option value="PST">Pacific (PST)</option>
                      </select>
                    </div>
                    <button 
                      onClick={handleDisplayUpdate} 
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#B8A565] transition font-semibold"
                    >
                      <Save size={20} />
                      Save Display Settings
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1a1a1a] dark:text-gray-100 mb-6">Notifications</h2>
                  <div className="space-y-4">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                      { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive updates via text' },
                      { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser notifications' },
                      { key: 'jobAlerts', label: 'Job Alerts', desc: 'New job opportunities' },
                      { key: 'messageAlerts', label: 'Message Alerts', desc: 'New messages' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                        <div>
                          <h3 className="font-semibold text-[#1a1a1a] dark:text-gray-100">{item.label}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={notifications[item.key as keyof NotificationSettings]}
                            onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D4A574]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#D4A574]"></div>
                        </label>
                      </div>
                    ))}
                    <button 
                      onClick={handleNotificationUpdate} 
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#B8A565] transition font-semibold"
                    >
                      <Save size={20} />
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'delete' && (
                <div>
                  <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-6">Delete Account</h2>
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-red-900 dark:text-red-100 mb-2">⚠️ Warning: Irreversible!</h3>
                        <p className="text-red-700 dark:text-red-300 text-sm">This will permanently delete all your data.</p>
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

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className="text-red-600" />
              <h3 className="text-xl font-bold text-red-600">Confirm Deletion</h3>
              <button onClick={() => setShowDeleteModal(false)} className="ml-auto"><X size={20} /></button>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">Type <span className="font-bold text-red-600">DELETE</span> to confirm</p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-700 dark:bg-[#2a2a2a] dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-6"
              placeholder="Type DELETE here"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation.toLowerCase() !== 'delete' || saving}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}