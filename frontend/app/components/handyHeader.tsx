"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Bell, Settings, HelpCircle, Briefcase, Wrench, Crown } from "lucide-react";
import { FiUser } from "react-icons/fi";

interface HeaderProps {
  pageTitle: string; // The title shown on the header
  profile?: {
    profileImage?: string;
    notificationsCount?: number;
  };
  onLogout: () => void;
}

export default function Header({ pageTitle, profile, onLogout }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
    setShowProfileMenu(false);
  };

  const toggleProfile = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowMenu(false);
  };

  return (
    <header className="bg-[#1a1a1a] shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold text-white tracking-wide">{pageTitle}</h1>

        <div className="flex items-center gap-4 relative">
          {/* Notifications */}
          <button className="relative p-2 rounded-full hover:bg-[#2a2a2a] transition">
            <Bell size={22} className="text-white" />
            {profile?.notificationsCount && profile.notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {profile.notificationsCount > 9 ? '9+' : profile.notificationsCount}
              </span>
            )}
          </button>

          {/* Profile */}
          <button onClick={toggleProfile} className="p-2 rounded-full hover:bg-[#2a2a2a] transition">
            {profile?.profileImage ? (
              <img src={profile.profileImage} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <FiUser size={24} className="text-white" />
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-14 top-14 bg-white border border-gray-200 rounded-lg shadow-xl w-52 z-50">
              <ul className="text-sm text-gray-800">
                <li>
                  <Link href="/handyAccount" className="block px-5 py-3 hover:bg-[#F5F5F0] transition font-medium">
                    My Account
                  </Link>
                </li>
                <li>
                  <Link href="/settings" className="block px-5 py-3 hover:bg-[#F5F5F0] transition font-medium">
                    Settings
                  </Link>
                </li>
                <li>
                  <button onClick={onLogout} className="w-full text-left px-5 py-3 text-[#C41E3A] hover:bg-red-50 transition font-medium">
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* Menu Button */}
          <button onClick={toggleMenu} className="p-2 rounded-md bg-[#D4A574] text-white hover:bg-[#B8A565] transition">
            {showMenu ? <X size={26} /> : <Menu size={26} />}
          </button>

          {showMenu && (
            <div className="absolute right-0 top-14 bg-white border border-gray-200 rounded-xl shadow-xl w-72 text-sm z-50 overflow-hidden">
              <ul className="divide-y divide-gray-100">
                <li>
                  <Link href="/handyman/find-jobs" className="flex items-center text-black gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium">
                    <Briefcase size={20} className="text-[#D4A574]" /> Find Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/handyman/my-services" className="flex items-center text-black gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium">
                    <Wrench size={20} className="text-[#D4A574]" /> My Services
                  </Link>
                </li>
                <li>
                  <Link href="/handyman/membership" className="flex items-center text-black gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium">
                    <Crown size={20} className="text-[#D4A574]" /> Membership Plan
                  </Link>
                </li>
                <li>
                  <Link href="/handyman/help" className="flex items-center  text-black gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium">
                    <HelpCircle size={20} className="text-[#D4A574]" /> Help & Support
                  </Link>
                </li>
                <li>
                  <Link href="/settings" className="flex items-center  text-black gap-3 px-5 py-3 hover:bg-[#F5F5F0] transition font-medium">
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
