"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, User, Loader2 } from "lucide-react";

const EXPRESS_BASE_URL = "http://localhost:7000";

export default function AdminProfilePage() {
  const router = useRouter();
  const [adminDisplayName, setAdminDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const verifyAdminAndFetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/admin/login");
        return;
      }

      try {
        // Verify admin access
        const verifyRes = await fetch(`${EXPRESS_BASE_URL}/api/support/admin/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (verifyRes.status === 403 || verifyRes.status === 401) {
          localStorage.removeItem("token");
          router.push("/admin/login");
          return;
        }

        // Fetch admin profile
        const profileRes = await fetch(`${EXPRESS_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (profileRes.ok) {
          const data = await profileRes.json();
          setUsername(data.username || "");
          setEmail(data.email || "");
          setAdminDisplayName(data.displayName || "");
          setDisplayNameInput(data.displayName || "");
        } else {
          setError("Failed to load profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    verifyAdminAndFetchProfile();
  }, [router]);

  const handleSaveDisplayName = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Not authenticated. Please log in again.");
        return;
      }

      const displayNameValue = displayNameInput.trim();
      if (!displayNameValue) {
        setError("Profile name cannot be empty");
        return;
      }

      console.log("[Save Profile Name] Sending request:", { displayName: displayNameValue });

      const res = await fetch(`${EXPRESS_BASE_URL}/api/auth/update-display-name`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ displayName: displayNameValue })
      });

      console.log("[Save Profile Name] Response status:", res.status, res.statusText);

      let responseData;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await res.json();
      } else {
        const text = await res.text();
        console.error("[Save Profile Name] Non-JSON response:", text);
        responseData = { message: text || `Server error (${res.status})` };
      }

      if (res.ok) {
        console.log("[Save Profile Name] Success:", responseData);
        setAdminDisplayName(responseData.displayName || displayNameValue);
        setIsEditingDisplayName(false);
        setSuccess("Profile name updated successfully! This is the name customers will see when you help them.");
        setTimeout(() => setSuccess(""), 5000);
      } else {
        console.error("[Save Profile Name] Error - Status:", res.status, "Response:", responseData);
        const errorMsg = responseData.message || responseData.error || responseData.msg || `Server error (${res.status})`;
        setError(`Failed to update profile name: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error("Error updating profile name:", error);
      setError(`Failed to update profile name: ${error.message || "Network error. Please check your connection and try again."}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayNameInput(adminDisplayName);
    setIsEditingDisplayName(false);
    setError("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F8F8] via-white to-[#FFF8F2] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A574]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F8F8] via-white to-[#FFF8F2]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-[#5C4033]">Admin Profile</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-[#EED9C4]">
          <div className="mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4A574] to-[#C4956A] flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#5C4033] text-center mb-2">Admin Profile Settings</h2>
            <p className="text-gray-600 text-center">Manage your profile information</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Profile Information */}
          <div className="space-y-6">
            {/* Username (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Profile Name (Editable) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Profile Name <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                This is the name that customers and handymen will see when you connect with them in support chats.
              </p>
              {isEditingDisplayName ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder="Enter your profile name"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-[#D4A574]"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleSaveDisplayName();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    autoFocus
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveDisplayName}
                      disabled={isSaving || !displayNameInput.trim()}
                      className="px-6 py-2.5 bg-[#D4A574] text-[#5C4033] rounded-lg font-semibold hover:bg-[#C4956A] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Profile Name
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={adminDisplayName || "Not set"}
                    disabled
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium"
                  />
                  <button
                    onClick={() => setIsEditingDisplayName(true)}
                    className="px-6 py-3 bg-[#D4A574] text-[#5C4033] rounded-lg font-semibold hover:bg-[#C4956A] transition"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> When you assign yourself to a support conversation, customers and handymen will see
              "You are now connected with [Your Profile Name]". Make sure to set a professional and friendly profile name.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

