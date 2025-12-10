"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Shield, Lock, Mail, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000";

  // Check if already logged in as admin
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Verify if user is admin
      verifyAdminAccess(token);
    }
  }, []);

  const verifyAdminAccess = async (token: string) => {
    try {
      // Try to fetch admin profile - this will fail if not admin
      const res = await fetch(`${API_BASE}/api/support/admin/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok || res.status === 404) {
        // If we can access admin endpoints, redirect to dashboard
        router.push("/admin");
      }
    } catch (err) {
      // Not admin or token invalid, stay on login page
      console.log("Not logged in as admin");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        
        // Verify user is admin
        if (res.data.userType === "admin") {
          router.push("/admin");
        } else {
          localStorage.removeItem("token");
          setError("Access denied. This is an admin-only login page.");
          setIsLoading(false);
        }
      } else {
        setError("Login failed. Please check your credentials.");
        setIsLoading(false);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Login failed. Please check your credentials.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D4A574] rounded-full mb-4">
            <Shield className="w-8 h-8 text-[#5C4033]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-400">Sign in to access the admin dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20 transition text-gray-900"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20 transition text-gray-900"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#D4A574] text-[#5C4033] font-bold py-3 rounded-lg hover:bg-[#C4956A] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Back to Home Link */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#D4A574] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

          {/* Regular Login Link */}
          <div className="mt-4 text-center">
            <Link
              href="/signup?mode=login"
              className="text-sm text-gray-600 hover:text-[#D4A574] transition"
            >
              Not an admin? <span className="font-semibold">Regular Login</span>
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 Secure admin access • Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}

