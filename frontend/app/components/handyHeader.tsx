"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Briefcase,
  Wrench,
  Crown,
  HelpCircle,
  Settings,
} from "lucide-react";
import { FiUser } from "react-icons/fi";
import NotificationBell from "./notificationBell";
import { useRouter } from "next/navigation";

interface HeaderProps {
  pageTitle: string;
}

export default function HandyHeader({ pageTitle }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch user data from localStorage
    const userData = localStorage.getItem("user");

    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }

    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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

  const closeMenus = () => {
    setShowMenu(false);
    setShowProfileMenu(false);
  };

  if (loading) {
    return null; // Or a loading skeleton
  }

  return (
    <header className="bg-[#1a1a1a] shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          {pageTitle}
        </h1>

        <div className="flex items-center gap-4 relative">
          {/* Notification Bell */}
          {user && <NotificationBell user={user} />}

          {/* Profile Button */}
          <button
            onClick={toggleProfile}
            className="p-2 rounded-full hover:bg-[#2a2a2a] transition flex items-center justify-center"
          >
            <FiUser size={24} className="text-white" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-14 top-14 bg-white border border-gray-200 rounded-lg shadow-xl w-52 z-50">
              <ul className="text-sm text-gray-800">
                <li>
                  <Link
                    href="/handyman/handyProfile"
                    className="block px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                    onClick={closeMenus}
                  >
                    My Account
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mutual/settings"
                    className="block px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                    onClick={closeMenus}
                  >
                    Settings
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => {
                      closeMenus();
                      handleLogout();
                    }}
                    className="w-full text-left px-5 py-3 text-[#C41E3A] hover:bg-red-50 transition font-medium"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* Hamburger Menu Button */}
          <button
            onClick={toggleMenu}
            className="p-2 rounded-md bg-[#D4A574] text-white hover:bg-[#B8A565] transition flex items-center justify-center"
          >
            {showMenu ? <X size={26} /> : <Menu size={26} />}
          </button>

          {/* Main Menu Dropdown */}
          {showMenu && (
            <div className="absolute right-0 top-14 bg-white border border-gray-200 rounded-xl shadow-xl w-72 text-sm z-50 overflow-hidden">
              <ul className="divide-y divide-gray-100">
                <li>
                  <Link
                    href="/handyman/handyDashboard"
                    className="flex items-center text-black gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                    onClick={closeMenus}
                  >
                    <div className="w-5 h-5 bg-[#D4A574] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">H</span>
                    </div>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/handyman/handyFindJobs"
                    className="flex items-center text-black gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                    onClick={closeMenus}
                  >
                    <Briefcase size={20} className="text-[#D4A574]" /> Find Jobs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/handyman/handyPostServices"
                    className="flex items-center text-black gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                    onClick={closeMenus}
                  >
                    <Wrench size={20} className="text-[#D4A574]" /> My Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/handyman/handyOrders"
                    className="flex items-center text-black gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                    onClick={closeMenus}
                  >
                    <div className="w-5 h-5 bg-[#D4A574] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">O</span>
                    </div>
                    My Orders
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mutual/membership"
                    className="flex items-center text-black gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                    onClick={closeMenus}
                  >
                    <Crown size={20} className="text-[#D4A574]" /> Membership
                    Plan
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mutual/support"
                    className="flex items-center text-black gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                    onClick={closeMenus}
                  >
                    <HelpCircle size={20} className="text-[#D4A574]" /> Help &
                    Support
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mutual/settings"
                    className="flex items-center text-black gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium"
                    onClick={closeMenus}
                  >
                    <Settings size={20} className="text-[#D4A574]" /> Settings
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
