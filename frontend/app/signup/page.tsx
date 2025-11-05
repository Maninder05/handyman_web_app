"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";

export default function Signup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultMode = searchParams.get("mode") === "login";

  const [showSignup, setShowSignup] = useState(!defaultMode);
  const [showLogin, setShowLogin] = useState(defaultMode);

  // Signup state
  const [username, setUsername] = useState("");
  const [userType, setUserType] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000";

  // ---------- Validation ----------
  const validateSignup = () => {
    const errs: Record<string, string> = {};
    if (username.trim().length < 3)
      errs.username = "Username must be at least 3 characters";
    if (!email.includes("@")) errs.email = "Invalid email format";
    if (password.length < 6)
      errs.password = "Password must be at least 6 characters";
    if (!["customer", "handyman"].includes(userType))
      errs.userType = "Select a valid user type";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateLogin = () => {
    const errs: Record<string, string> = {};
    if (!loginEmail.includes("@")) errs.email = "Invalid email format";
    if (loginPassword.length < 6)
      errs.password = "Password must be at least 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // If OAuth returned token in query -> save and redirect
  useEffect(() => {
    const token = searchParams.get("token");
    const type = searchParams.get("userType");

    if (token) {
      localStorage.setItem("token", token);

      if (type === "customer") {
        router.push("client/clientDashboard");
      } else {
        router.push("handyman/handyDashboard");
      }
    }
  }, [searchParams, router]);

  // ---------- API Calls ----------
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;

    try {
      const res = await axios.post(
        `${API_BASE}/api/users/signup`,
        { username, email, password, userType },
        { withCredentials: true }
      );

      alert(res.data.message || "Signup successful");
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      setShowSignup(false);

      // Redirect based on userType
      if (userType === "customer") {
        router.push("../client/clientDashboard");
      } else {
        router.push("../handyman//handyDashboard");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;

    try {
      const res = await axios.post(
        `${API_BASE}/api/users/login`,
        { email: loginEmail, password: loginPassword },
        { withCredentials: true }
      );

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      setShowLogin(false);

      //  FIXED: Redirect based on userType from backend response
      // Redirect based on userType from backend response
      if (res.data.userType === "customer") {
        router.push("../client/clientDashboard");
      } else {
        router.push("../handyman/handyDashboard");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  // OAuth redirects to backend. Backend will redirect back to this page with ?token=...
  const oauthGoogle = () => {
    window.location.href = `${API_BASE}/api/users/auth/google`;
  };
  const oauthFacebook = () => {
    window.location.href = `${API_BASE}/api/users/auth/facebook`;
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 bg-gray-300 flex items-center justify-center z-50">
          <div className="relative bg-black border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-md p-8 scale-95 hover:scale-100 transition-transform">
            <button
              onClick={() => {
                setShowSignup(false);
                router.push("/");
              }}
              className="absolute top-3 right-3 text-neutral-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-[#D4A574] mb-2 text-center">
              Create Your Account
            </h2>
            <p className="text-sm text-neutral-400 mb-6 text-center">
              Join thousands of homeowners trusting us every day.
            </p>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:border-[#D4A574] outline-none"
                  required
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:border-[#D4A574] outline-none"
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:border-[#D4A574] outline-none"
                  required
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* User Type Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setUserType("customer")}
                  className={`w-1/2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${
                    userType === "customer"
                      ? "bg-[#D4A574] text-black border-[#D4A574]"
                      : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-[#D4A574]"
                  }`}
                >
                  <Image
                    src="/images/dummy-client.jpg"
                    alt="Customer"
                    width={30}
                    height={30}
                  />
                  <span>Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("handyman")}
                  className={`w-1/2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${
                    userType === "handyman"
                      ? "bg-[#D4A574] text-black border-[#D4A574]"
                      : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-[#D4A574]"
                  }`}
                >
                  <Image
                    src="/images/dummy-handyman.jpg"
                    alt="Handyman"
                    width={30}
                    height={30}
                    className="rounded-full"
                  />
                  <span>Handyman</span>
                </button>
              </div>
              {errors.userType && (
                <p className="text-red-500 text-sm mt-1">{errors.userType}</p>
              )}

              <button
                type="submit"
                className="w-full bg-[#D4A574] hover:opacity-90 text-black py-2 rounded-lg transition"
              >
                Sign Up
              </button>
            </form>

            {/* Social Buttons */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-neutral-700"></div>
              <span className="px-2 text-neutral-500 text-xs">OR</span>
              <div className="flex-1 h-px bg-neutral-700"></div>
            </div>
            {/* Google Sign In */}
            <div className="flex flex-col gap-3">
              <button
                onClick={oauthGoogle}
                className="flex items-center gap-2 justify-center px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm cursor-pointer hover:border-[#D4A574] transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign up with Google</span>
              </button>
              <button
                onClick={oauthFacebook}
                className="flex items-center gap-2 justify-center px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm cursor-pointer hover:border-[#D4A574] transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#1877F2"
                    d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 5.988 4.388 10.954 10.125 11.854v-8.385H7.078V12.07h3.047V9.412c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.49 0-1.953.93-1.953 1.887v2.251h3.328l-.532 3.473h-2.796v8.385C19.612 23.027 24 18.061 24 12.073z"
                  />
                </svg>
                <span>Sign up with Facebook</span>
              </button>
            </div>

            <p className="text-sm text-neutral-400 mt-4 text-center">
              Already have an account?{" "}
              <a
                onClick={() => {
                  setShowSignup(false);
                  setShowLogin(true);
                }}
                className="text-[#D4A574] cursor-pointer hover:underline"
              >
                Login
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-md p-8 scale-95 hover:scale-100 transition-transform">
            <button
              onClick={() => {
                setShowLogin(false);
                router.push("/");
              }}
              className="absolute top-3 right-3 text-neutral-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-[#D4A574] mb-2 text-center">
              Welcome Back
            </h2>
            <p className="text-sm text-neutral-400 mb-6 text-center">
              Login to continue managing your home services.
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:border-[#D4A574] outline-none"
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:border-[#D4A574] outline-none"
                  required
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-[#D4A574] hover:opacity-90 text-black py-2 rounded-lg transition font-semibold"
              >
                Login
              </button>
            </form>

            {/* Social */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-neutral-700"></div>
              <span className="px-2 text-neutral-500 text-xs">OR</span>
              <div className="flex-1 h-px bg-neutral-700"></div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={oauthGoogle}
                className="flex items-center gap-2 justify-center px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm cursor-pointer hover:border-[#D4A574] transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Login with Google</span>
              </button>
              <button
                onClick={oauthFacebook}
                className="flex items-center gap-2 justify-center px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm cursor-pointer hover:border-[#D4A574] transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#1877F2"
                    d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 5.988 4.388 10.954 10.125 11.854v-8.385H7.078V12.07h3.047V9.412c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.49 0-1.953.93-1.953 1.887v2.251h3.328l-.532 3.473h-2.796v8.385C19.612 23.027 24 18.061 24 12.073z"
                  />
                </svg>
                <span>Login with Facebook</span>
              </button>
            </div>

            <p className="text-sm text-neutral-400 mt-4 text-center">
              Don&apos;t have an account?{" "}
              <a
                onClick={() => {
                  setShowLogin(false);
                  setShowSignup(true);
                }}
                className="text-[#D4A574] hover:underline cursor-pointer"
              >
                Sign Up
              </a>
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
