"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Users, Activity, Shield, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F8F8] via-white to-[#FFF8F2]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#5C4033]">Admin Dashboard</h1>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-[#5C4033] transition"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#5C4033] mb-2">Welcome, Admin</h2>
          <p className="text-gray-600">Manage your platform from here</p>
        </div>

        {/* Admin Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Support Chat */}
          <Link
            href="/admin/supportChat"
            className="group bg-white rounded-2xl shadow-lg p-6 border-2 border-[#EED9C4] hover:border-[#D4A574] hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition">
                <MessageSquare className="w-7 h-7 text-blue-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#D4A574] transition" />
            </div>
            <h3 className="text-xl font-bold text-[#5C4033] mb-2">Support Chat</h3>
            <p className="text-sm text-gray-600">
              Manage customer support conversations and respond to inquiries
            </p>
          </Link>

          {/* Manage Users */}
          <Link
            href="/admin/manageUsers"
            className="group bg-white rounded-2xl shadow-lg p-6 border-2 border-[#EED9C4] hover:border-[#D4A574] hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition">
                <Users className="w-7 h-7 text-green-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#D4A574] transition" />
            </div>
            <h3 className="text-xl font-bold text-[#5C4033] mb-2">Manage Users</h3>
            <p className="text-sm text-gray-600">
              View and manage all users, customers, and handymen
            </p>
          </Link>

          {/* Admin Activity */}
          <Link
            href="/admin/adminActivity"
            className="group bg-white rounded-2xl shadow-lg p-6 border-2 border-[#EED9C4] hover:border-[#D4A574] hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition">
                <Activity className="w-7 h-7 text-purple-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#D4A574] transition" />
            </div>
            <h3 className="text-xl font-bold text-[#5C4033] mb-2">Admin Activity</h3>
            <p className="text-sm text-gray-600">
              View admin actions and platform activity logs
            </p>
          </Link>

          {/* Decline Support */}
          <Link
            href="/admin/declineSupport"
            className="group bg-white rounded-2xl shadow-lg p-6 border-2 border-[#EED9C4] hover:border-[#D4A574] hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition">
                <Shield className="w-7 h-7 text-red-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#D4A574] transition" />
            </div>
            <h3 className="text-xl font-bold text-[#5C4033] mb-2">Decline Support</h3>
            <p className="text-sm text-gray-600">
              Review and manage declined job requests
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}

