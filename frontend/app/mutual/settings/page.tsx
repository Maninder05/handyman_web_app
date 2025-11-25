"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Lock, Sun, Moon, Monitor, Bell, Trash2, 
  Camera, AlertCircle, CheckCircle, XCircle, ArrowLeft, LogOut
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userType, setUserType] = useState<"client" | "handyman" | null>(null);
  
  // Alert state
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Account data
  const [accountData, setAccountData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
    profileImage: "",
  });

  // Password data
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Display settings
  const [displaySettings, setDisplaySettings] = useState({
    theme: "light",
    language: "en",
    timezone: "UTC",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    jobAlerts: true,
    messageAlerts: true,
  });

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Profile image upload
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Detect user type and fetch data
  useEffect(() => {
    fetchUserData();
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    if (displaySettings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (displaySettings.theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [displaySettings.theme]);

  const fetchUserData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signup?mode=login");
      return;
    }

    try {
      // Try handyman first (more likely to have issues)
      let response = await fetch("http://localhost:7000/api/handymen", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let detectedType: "client" | "handyman" = "handyman";

      // If handyman fails, try client
      if (!response.ok) {
        response = await fetch("http://localhost:7000/api/clients", {
          headers: { Authorization: `Bearer ${token}` },
        });
        detectedType = "client";
      }

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      
      // Store userType in localStorage for persistence
      localStorage.setItem("userType", detectedType);
      setUserType(detectedType);
      
      console.log("✅ User Type Detected:", detectedType);

      const nameParts = data.name ? data.name.split(" ") : ["", ""];
      setAccountData({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        bio: data.bio || "",
        profileImage: data.profileImage || data.profilePic || "",
      });

      // Fetch display settings
      const settingsRes = await fetch("http://localhost:7000/api/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setDisplaySettings({
          theme: settings.theme || "light",
          language: settings.language || "en",
          timezone: settings.timezone || "UTC",
        });
        setNotifications(settings.notifications || notifications);
      }
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      showAlert("error", "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const getDashboardPath = (): string => {
    // Check localStorage first for persistence
    const storedType = localStorage.getItem("userType") as "client" | "handyman" | null;
    const finalType = storedType || userType;
    
    console.log("🚀 Redirecting to:", finalType === "handyman" ? "/handyman/handyDashboard" : "/client/clientDashboard");
    
    return finalType === "handyman" 
      ? "/handyman/handyDashboard" 
      : "/client/clientDashboard";
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert("error", "Image must be less than 5MB");
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadProfileImage = async () => {
    if (!selectedImage) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("profileImage", selectedImage); // ✅ CORRECT FIELD NAME

    setSaving(true);

    try {
      const storedType = localStorage.getItem("userType") as "client" | "handyman" | null;
      const finalType = storedType || userType;
      
      const endpoint = finalType === "handyman"
        ? "http://localhost:7000/api/handymen/upload-profile-pic"
        : "http://localhost:7000/api/clients/upload-profile-pic";

      console.log("📤 Uploading to:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          // ❌ DON'T SET Content-Type for FormData - browser sets it automatically
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Upload error:", errorData);
        throw new Error(errorData.message || "Failed to upload image");
      }

      const data = await response.json();
      console.log("✅ Upload success:", data);
      
      setAccountData({ 
        ...accountData, 
        profileImage: data.profilePic || data.profileImage || data.imageUrl 
      });
      setSelectedImage(null);
      setImagePreview(null);
      showAlert("success", "Profile picture updated!");
      
      setTimeout(() => {
        router.push(getDashboardPath());
      }, 1500);
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to upload image";
      console.error("❌ Upload failed:", err);
      showAlert("error", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccount = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      // If there's a selected image, upload it first
      if (selectedImage) {
        await uploadProfileImage();
        return;
      }

      const storedType = localStorage.getItem("userType") as "client" | "handyman" | null;
      const finalType = storedType || userType;

      const endpoint = finalType === "handyman"
        ? "http://localhost:7000/api/handymen"
        : "http://localhost:7000/api/clients";

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `${accountData.firstName} ${accountData.lastName}`.trim(),
          phone: accountData.phone,
          address: accountData.address,
          bio: accountData.bio,
        }),
      });

      if (!response.ok) throw new Error("Failed to update account");

      showAlert("success", "Account updated successfully!");
      
      setTimeout(() => {
        router.push(getDashboardPath());
      }, 1500);
    } catch (err) {
      console.error("❌ Update failed:", err);
      showAlert("error", "Failed to update account");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert("error", "Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showAlert("error", "Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:7000/api/settings/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) throw new Error("Failed to change password");

      showAlert("success", "Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      
      setTimeout(() => {
        router.push(getDashboardPath());
      }, 1500);
    } catch (err) {
      showAlert("error", "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDisplay = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:7000/api/settings/display", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(displaySettings),
      });

      if (!response.ok) throw new Error("Failed to update display settings");

      showAlert("success", "Display settings updated!");
      
      setTimeout(() => {
        router.push(getDashboardPath());
      }, 1500);
    } catch (err) {
      showAlert("error", "Failed to update display settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:7000/api/settings/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notifications }),
      });

      if (!response.ok) throw new Error("Failed to update notifications");

      showAlert("success", "Notification settings updated!");
      
      setTimeout(() => {
        router.push(getDashboardPath());
      }, 1500);
    } catch (err) {
      showAlert("error", "Failed to update notifications");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      showAlert("error", 'Please type "DELETE" to confirm');
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const storedType = localStorage.getItem("userType") as "client" | "handyman" | null;
      const finalType = storedType || userType;

      const endpoint = finalType === "handyman"
        ? "http://localhost:7000/api/handymen"
        : "http://localhost:7000/api/clients";

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete account");

      localStorage.removeItem("token");
      localStorage.removeItem("userType");
      router.push("/signup");
    } catch (err) {
      showAlert("error", "Failed to delete account");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    router.push("/signup?mode=login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D4A574] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#0a0a0a]">
      {/* Alert */}
      {alert && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-xl ${
          alert.type === "success" ? "bg-green-500" : "bg-red-500"
        } text-white`}>
          {alert.type === "success" ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span className="font-medium">{alert.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#1a1a1a] dark:bg-black shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(getDashboardPath())}
              className="p-2 rounded-lg hover:bg-[#2a2a2a] transition"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-md p-4">
              <nav className="space-y-2">
                {[
                  { id: "account", label: "Account Management", icon: User },
                  { id: "password", label: "Change Password", icon: Lock },
                  { id: "display", label: "Display Settings", icon: Sun },
                  { id: "notifications", label: "Notifications", icon: Bell },
                  { id: "delete", label: "Delete Account", icon: Trash2 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      activeTab === tab.id
                        ? "bg-[#D4A574] text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                    }`}
                  >
                    <tab.icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-md p-6">
              {/* Account Tab */}
              {activeTab === "account" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Management</h2>

                  {/* Profile Image */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-4 border-[#D4A574]">
                        {imagePreview || accountData.profileImage ? (
                          <img
                            src={imagePreview || `http://localhost:7000${accountData.profileImage}`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User size={48} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-[#D4A574] p-3 rounded-full cursor-pointer hover:bg-[#B8A565] transition shadow-lg">
                        <Camera size={20} className="text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {selectedImage && (
                      <button
                        onClick={uploadProfileImage}
                        disabled={saving}
                        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-semibold disabled:opacity-50"
                      >
                        {saving ? "Uploading..." : "Upload Photo"}
                      </button>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={accountData.firstName}
                        onChange={(e) => setAccountData({ ...accountData, firstName: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:border-[#D4A574] outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={accountData.lastName}
                        onChange={(e) => setAccountData({ ...accountData, lastName: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:border-[#D4A574] outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={accountData.email}
                        disabled
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[#0a0a0a] text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={accountData.phone}
                        onChange={(e) => setAccountData({ ...accountData, phone: e.target.value })}
                        placeholder="+1 (XXX) XXX-XXXX"
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:border-[#D4A574] outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={accountData.address}
                      onChange={(e) => setAccountData({ ...accountData, address: e.target.value })}
                      placeholder="Enter your address"
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:border-[#D4A574] outline-none transition"
                    />
                  </div>

                  {(localStorage.getItem("userType") === "handyman" || userType === "handyman") && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={accountData.bio}
                        onChange={(e) => setAccountData({ ...accountData, bio: e.target.value })}
                        rows={4}
                        placeholder="Tell us about your experience and expertise..."
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:border-[#D4A574] outline-none resize-none transition"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleSaveAccount}
                    disabled={saving}
                    className="w-full py-4 bg-[#D4A574] hover:bg-[#B8A565] text-white font-bold text-lg rounded-lg transition disabled:opacity-50 shadow-lg"
                  >
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === "password" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Change Password</h2>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:border-[#D4A574] outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      New Password (minimum 8 characters)
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:border-[#D4A574] outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:border-[#D4A574] outline-none transition"
                    />
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="w-full py-4 bg-[#D4A574] hover:bg-[#B8A565] text-white font-bold text-lg rounded-lg transition disabled:opacity-50 shadow-lg"
                  >
                    {saving ? "Changing Password..." : "Change Password"}
                  </button>
                </div>
              )}

              {/* Display Tab */}
              {activeTab === "display" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Display Settings</h2>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Theme Preference
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: "light", label: "Light", icon: Sun },
                        { value: "dark", label: "Dark", icon: Moon },
                        { value: "auto", label: "Auto", icon: Monitor },
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => setDisplaySettings({ ...displaySettings, theme: theme.value })}
                          className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition ${
                            displaySettings.theme === theme.value
                              ? "border-[#D4A574] bg-[#D4A574]/10"
                              : "border-gray-300 dark:border-gray-600 hover:border-[#D4A574]"
                          }`}
                        >
                          <theme.icon size={32} className="text-gray-700 dark:text-gray-300" />
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <select
                      value={displaySettings.language}
                      onChange={(e) => setDisplaySettings({ ...displaySettings, language: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:border-[#D4A574] outline-none transition"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Timezone
                    </label>
                    <select
                      value={displaySettings.timezone}
                      onChange={(e) => setDisplaySettings({ ...displaySettings, timezone: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:border-[#D4A574] outline-none transition"
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">EST (Eastern)</option>
                      <option value="CST">CST (Central)</option>
                      <option value="MST">MST (Mountain)</option>
                      <option value="PST">PST (Pacific)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSaveDisplay}
                    disabled={saving}
                    className="w-full py-4 bg-[#D4A574] hover:bg-[#B8A565] text-white font-bold text-lg rounded-lg transition disabled:opacity-50 shadow-lg"
                  >
                    {saving ? "Saving Changes..." : "Save Display Settings"}
                  </button>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Notification Preferences</h2>

                  <div className="space-y-4">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <button
                          onClick={() => setNotifications({ ...notifications, [key]: !value })}
                          className={`relative w-14 h-7 rounded-full transition ${
                            value ? "bg-[#D4A574]" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-md ${
                              value ? "translate-x-7" : ""
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="w-full py-4 bg-[#D4A574] hover:bg-[#B8A565] text-white font-bold text-lg rounded-lg transition disabled:opacity-50 shadow-lg"
                  >
                    {saving ? "Saving Changes..." : "Save Notification Settings"}
                  </button>
                </div>
              )}

              {/* Delete Account Tab */}
              {activeTab === "delete" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-red-600 mb-6">Delete Account</h2>

                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                      <div>
                        <h3 className="font-bold text-red-600 text-lg mb-2">⚠️ Warning: This action is irreversible!</h3>
                        <p className="text-red-700 dark:text-red-300 mb-3 font-medium">
                          Deleting your account will permanently remove:
                        </p>
                        <ul className="list-disc list-inside text-red-700 dark:text-red-300 space-y-2 ml-2">
                          <li>Your profile and all personal information</li>
                          <li>All your bookings and job postings</li>
                          <li>All messages and conversations</li>
                          <li>Access to the platform</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Type `DELETE` to confirm account deletion
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white focus:border-red-500 outline-none transition"
                      placeholder="Type DELETE here"
                    />
                  </div>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleteConfirmation !== "DELETE"}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Trash2 size={20} />
                    Delete My Account Permanently
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-red-600 mb-4">⚠️ Final Confirmation</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
              >
                Yes, Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}