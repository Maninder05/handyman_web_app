"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
  FiHome,
  FiMessageCircle,
  FiHelpCircle,
  FiBell,
  FiSettings,
  FiPlus,
  FiSend,
} from "react-icons/fi";

export default function MessagesPage() {
  const handyman = {
    name: "Kenji Teneka",
    image: "/images/profile.jpg",
    price: 55,
  };

  const messages = [
    { text: "Hello, I need your help with wiring repair.", sender: "client" },
    { text: "Sure! I can help you tomorrow.", sender: "handyman" },
    { text: "Great! What time are you available?", sender: "client" },
    { text: "I can come at 10 AM.", sender: "handyman" },
    { text: "Perfect, see you then.", sender: "client" },
    { text: "See you!", sender: "handyman" },
  ];

  return (
    <main className="bg-neutral-900 min-h-screen flex flex-col text-neutral-100">
      {/* Main Header */}
      <section className="bg-[#D4A574] py-4 text-center shadow-md">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
          Messages
        </h1>
      </section>

      {/* Handyman Header */}
      <section className="bg-neutral-950 py-4 px-4 flex items-center justify-between shadow-lg border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 relative rounded-full overflow-hidden border-2 border-[#FFCC66]">
            <Image
              src={handyman.image}
              alt={handyman.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="text-left">
            <p className="font-bold text-[#FFCC66]">{handyman.name}</p>
            <p className="text-neutral-400 font-semibold">
              ${handyman.price} CAD/HR
            </p>
          </div>
        </div>

        <div>
          <Link
            href="/hire-handyman"
            className="flex items-center gap-2 rounded-lg bg-[#D4A574] px-5 py-2 text-white font-medium shadow-[0_0_10px_rgba(255,204,102,0.6),0_0_20px_rgba(255,126,95,0.5)] transition-transform duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Hire Me
          </Link>
        </div>
      </section>

      {/* Messages Screen */}
      <section className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-amber-50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender === "client" ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-xl break-words ${
                msg.sender === "client"
                  ? "bg-neutral-700 text-neutral-100 rounded-bl-none"
                  : "bg-[#D4A574] text-neutral-900 font-medium rounded-br-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </section>

      {/* Input Bar */}
      <section className="bg-neutral-950 flex items-center px-4 py-3 gap-3 border-t border-neutral-800">
        <button className="bg-neutral-800 p-3 rounded-full hover:bg-neutral-700 text-[#FFCC66] transition">
          <FiPlus size={20} />
        </button>

        <input
          type="text"
          placeholder="Type Here"
          className="flex-1 border border-neutral-700 rounded-full px-4 py-2 text-neutral-100 bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FFCC66] placeholder:text-neutral-400"
        />
        <FiSend
          size={24}
          className="text-[#FFCC66] cursor-pointer hover:scale-110 transition-transform"
        />
      </section>

      {/* Footer */}
      <footer className="bg-neutral-950 text-neutral-400">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex justify-around py-5 text-sm">
            <Link
              href="/"
              className="flex flex-col items-center gap-1 hover:text-[#FFCC66] transition"
            >
              <FiHome size={20} /> Home
            </Link>
            <Link
              href="/messages"
              className="flex flex-col items-center gap-1 hover:text-[#FFCC66] transition"
            >
              <FiMessageCircle size={20} /> Messages
            </Link>
            <Link
              href="/help"
              className="flex flex-col items-center gap-1 hover:text-[#FFCC66] transition"
            >
              <FiHelpCircle size={20} /> Help
            </Link>
            <Link
              href="/notifications"
              className="flex flex-col items-center gap-1 hover:text-[#FFCC66] transition"
            >
              <FiBell size={20} /> Notifications
            </Link>
            <Link
              href="/settings"
              className="flex flex-col items-center gap-1 hover:text-[#FFCC66] transition"
            >
              <FiSettings size={20} /> Settings
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

//I take help from W3 school//
//https://medium.com/tag/coding//
//https://tailwindcss.com//
//https://youtu.be/DZKOunP-WLQ?si=u2jdWzgrZYCwfIzA
