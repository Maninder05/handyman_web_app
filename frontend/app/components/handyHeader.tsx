"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  HelpCircle,
  Settings,
  Briefcase,
  Wrench,
  Crown
} from "lucide-react";
import { FiUser } from "react-icons/fi";

interface HeaderProps {
  pageTitle: string;
  profile?: {
    profileImage?: string;
    notificationsCount?: number;
  };
  onLogout: () => void;
}

export default function HandyHeader({ pageTitle, profile, onLogout }: HeaderProps) {
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

  const closeMenus = () => {
    setShowMenu(false);
    setShowProfileMenu(false);
  };

  return (
    <header className="bg-[#1a1a1a] shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        
        <h1 className="text-2xl font-bold text-white tracking-wide">
          {pageTitle}
        </h1>

        <div className="flex items-center gap-4 relative">

          {/* PROFILE BUTTON header*/}
          <button
            onClick={toggleProfile}
            className="p-2 rounded-full hover:bg-[#2a2a2a] transition"
          >
            {profile?.profileImage ? (
              <img
                src={profile.profileImage}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <FiUser size={24} className="text-white" />
            )}
          </button>

          {/* PROFILE MENU */}
          {showProfileMenu && (
            <div className="absolute right-14 top-14 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-56 z-50 animate-fadeIn">
              <ul className="text-sm text-gray-800 dark:text-gray-200">
                
                <li>
                  <Link
                    href="/handyman/handyProfile"
                    className="block px-5 py-3 hover:bg-gray-100 dark:hover:bg-[#2c2c2c] transition font-medium"
                    onClick={closeMenus}
                  >
                    My Account
                  </Link>
                </li>

                <li>
                  <Link
                    href="/mutual/settings"
                    className="block px-5 py-3 hover:bg-gray-100 dark:hover:bg-[#2c2c2c] transition font-medium"
                    onClick={closeMenus}
                  >
                    Settings
                  </Link>
                </li>

                <li>
                  <button
                    onClick={() => {
                      closeMenus();
                      onLogout();
                    }}
                    className="w-full text-left px-5 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium"
                  >
                    Logout
                  </button>
                </li>

              </ul>
            </div>
          )}

          {/* MENU BUTTON */}
          <button
            onClick={toggleMenu}
            className="p-2 rounded-md bg-[#D4A574] text-white hover:bg-[#b6935a] transition"
          >
            {showMenu ? <X size={26} /> : <Menu size={26} />}
          </button>

          {/* SLIDE MENU — RESTORED BEAUTIFUL VERSION */}
          {showMenu && (
            <div className="absolute right-0 top-14 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-72 text-sm z-50 animate-fadeIn overflow-hidden">
              
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">

                <li>
                  <Link
                    href="/handyman/handyFindJobs"
                    className="flex items-center text-black dark:text-gray-200 gap-3 px-5 py-3 hover:bg-gray-100 dark:hover:bg-[#2c2c2c] transition font-medium"
                    onClick={closeMenus}
                  >
                    <Briefcase size={20} className="text-[#D4A574]" />
                    Find Jobs
                  </Link>
                </li>

                <li>
                  <Link
                    href="/handyman/handyPostServices"
                    className="flex items-center text-black dark:text-gray-200 gap-3 px-5 py-3 hover:bg-gray-100 dark:hover:bg-[#2c2c2c] transition font-medium"
                    onClick={closeMenus}
                  >
                    <Wrench size={20} className="text-[#D4A574]" />
                    My Services
                  </Link>
                </li>

                <li>
                  <Link
                    href="/mutual/membership"
                    className="flex items-center text-black dark:text-gray-200 gap-3 px-5 py-3 hover:bg-gray-100 dark:hover:bg-[#2c2c2c] transition font-medium"
                    onClick={closeMenus}
                  >
                    <Crown size={20} className="text-[#D4A574]" />
                    Membership Plan
                  </Link>
                </li>

                <li>
                  <Link
                    href="/mutual/support"
                    className="flex items-center text-black dark:text-gray-200 gap-3 px-5 py-3 hover:bg-gray-100 dark:hover:bg-[#2c2c2c] transition font-medium"
                    onClick={closeMenus}
                  >
                    <HelpCircle size={20} className="text-[#D4A574]" />
                    Help & Support
                  </Link>
                </li>

                <li>
                  <Link
                    href="/mutual/settings"
                    className="flex items-center text-black dark:text-gray-200 gap-3 px-5 py-3 hover:bg-gray-100 dark:hover:bg-[#2c2c2c] transition font-medium"
                    onClick={closeMenus}
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
  );
}
