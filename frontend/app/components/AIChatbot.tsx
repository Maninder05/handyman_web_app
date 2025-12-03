"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, X, Minimize2, Maximize2, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: "customer" | "handyman" | null;
  onTransferToAgent?: () => void;
}

export default function AIChatbot({ isOpen, onClose, userType, onTransferToAgent }: AIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your AI assistant. How can I help you today? I can answer questions about bookings, payments, memberships, or guide you through our platform.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // FAQ knowledge base for context-aware responses
  const faqKnowledge = {
    bookings: [
      "How do I book a handyman? Search for a service, pick a time that works, and confirm your booking. You'll get a confirmation email with the details.",
      "Can I cancel or reschedule? Yes. You can cancel or reschedule from your bookings page. Fees may apply for late cancellations depending on the provider's policy.",
      "Can I change my booking after payment? Yes! You can reschedule or modify bookings up to 24 hours before the scheduled time.",
    ],
    payments: [
      "What are the payment options? We accept credit/debit cards and major digital wallets. Payments are held securely and released after the job is completed.",
      "When do I get paid? Payment is released 24-48 hours after job completion and customer confirmation.",
      "How do I request a refund? Go to your booking details, click 'Request Refund', select your reason, and submit. Refunds are typically processed within 24-48 hours after review.",
      "Is my payment secure? Yes. All payments go through our secure system. Providers are paid only after the work is confirmed as complete.",
    ],
    membership: [
      "How do I become a handyman on the platform? Sign up, complete verification, and list your services. Once approved, you'll start receiving customer requests in your area.",
      "What membership plans are available? We offer Basic, Seasonal, and Pro plans with different features and pricing options.",
    ],
    general: [
      "Are handymen verified? All pros complete ID verification and profile checks. Check ratings and reviews on each profile before booking.",
      "What if I'm not satisfied with the work? You can report issues directly in the app. Our support team will step in to resolve disputes and ensure fair outcomes.",
      "Do you offer insurance or protection? Yes, jobs booked through our platform are covered by HandyCover for customers, giving you peace of mind in case of accidents or damages.",
    ],
  };

  // Simple AI response generator (can be replaced with actual API call)
  const generateAIResponse = async (userMessage: string): Promise<string | null> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const lowerMessage = userMessage.toLowerCase();

    // Check if user wants to contact an agent
    if (
      lowerMessage.includes("contact agent") ||
      lowerMessage.includes("talk to agent") ||
      lowerMessage.includes("speak to agent") ||
      lowerMessage.includes("human agent") ||
      lowerMessage.includes("real person") ||
      lowerMessage.includes("transfer to agent") ||
      (lowerMessage.includes("agent") && (lowerMessage.includes("connect") || lowerMessage.includes("transfer")))
    ) {
      // Return null to signal transfer
      return null;
    }

    // Check for keywords and provide relevant answers
    if (lowerMessage.includes("book") || lowerMessage.includes("booking") || lowerMessage.includes("schedule")) {
      return faqKnowledge.bookings[0] + " You can also cancel or reschedule from your bookings page up to 24 hours before the appointment.";
    }
    if (lowerMessage.includes("payment") || lowerMessage.includes("pay") || lowerMessage.includes("refund")) {
      if (userType === "handyman") {
        return faqKnowledge.payments[1] + " All payments are secure and processed automatically after job completion.";
      }
      return faqKnowledge.payments[0] + " " + faqKnowledge.payments[2] + " If you need help with a specific payment issue, please contact our support team.";
    }
    if (lowerMessage.includes("membership") || lowerMessage.includes("plan") || lowerMessage.includes("subscription")) {
      return "We offer three membership plans: Basic ($10/month), Seasonal ($12/month), and Pro ($15/month). Each plan comes with different features like featured listings, priority placement, and verification badges. You can view all plans and subscribe from the membership page. Would you like to know more about a specific plan?";
    }
    if (lowerMessage.includes("cancel") || lowerMessage.includes("reschedule")) {
      return faqKnowledge.bookings[1] + " For more specific questions about cancellation policies, please check your booking details or contact support.";
    }
    if (lowerMessage.includes("verified") || lowerMessage.includes("safe") || lowerMessage.includes("security")) {
      return faqKnowledge.general[0] + " " + faqKnowledge.general[2];
    }
    if (lowerMessage.includes("profile") || lowerMessage.includes("update")) {
      return "To update your profile, go to the Settings page. You can edit your name, contact information, bio, skills, and upload a profile picture. Keeping your profile updated helps you get better matches!";
    }
    if (lowerMessage.includes("help") || lowerMessage.includes("support") || lowerMessage.includes("contact")) {
      return "I'm here to help! I can answer questions about bookings, payments, memberships, and more. If you need to speak with a real person, just type 'contact agent' and I'll connect you with one of our support agents.";
    }
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
      return `Hello! I'm your AI assistant. I can help you with questions about bookings, payments, memberships, profile management, and more. What would you like to know?`;
    }

    // Default response
    return "I understand you're asking about: \"" + userMessage + "\". I can help you with questions about bookings, payments, memberships, and using our platform. Could you provide more details, or would you like me to connect you with our human support team?";
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await generateAIResponse(userMessage.text);
      
      // If response is null, transfer to agent
      if (response === null && onTransferToAgent) {
        const transferMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "I'm connecting you with a real support agent now. They'll be able to help you with more complex issues. Please wait a moment...",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, transferMessage]);
        
        // Wait a moment then transfer
        setTimeout(() => {
          onTransferToAgent();
          onClose();
        }, 1500);
        return;
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error. Please try again or contact our support team for assistance.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="mb-4 mr-4 px-6 py-3 bg-[#D4A574] text-[#5C4033] rounded-t-xl rounded-l-xl shadow-2xl font-semibold hover:bg-[#C4956A] transition flex items-center gap-2"
        >
          <Maximize2 className="w-5 h-5" />
          <span>Open Chat</span>
        </button>
      ) : (
        <div className="mb-4 mr-4 w-96 h-[600px] bg-white rounded-t-xl rounded-l-xl shadow-2xl flex flex-col border-2 border-[#EED9C4] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#D4A574] to-[#C4956A] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-[#5C4033]" />
              </div>
              <div>
                <h3 className="font-bold text-[#5C4033] text-lg">AI Assistant</h3>
                <p className="text-xs text-[#5C4033]/80">Usually replies instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 hover:bg-white/20 rounded-lg transition"
                aria-label="Minimize"
              >
                <Minimize2 className="w-5 h-5 text-[#5C4033]" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-[#5C4033]" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FFF8F2]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "bot" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4A574] flex items-center justify-center">
                    <Bot className="w-5 h-5 text-[#5C4033]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.sender === "user"
                      ? "bg-[#D4A574] text-[#5C4033] rounded-br-sm"
                      : "bg-white text-[#5C4033] border border-[#EED9C4] rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  <span className="text-xs opacity-60 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {message.sender === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#5C4033] flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4A574] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#5C4033]" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 border border-[#EED9C4]">
                  <Loader2 className="w-5 h-5 text-[#D4A574] animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#EED9C4] p-4 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[#EED9C4] focus:outline-none focus:border-[#D4A574] text-[#5C4033] placeholder:text-[#5C4033]/50"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="px-5 py-2.5 bg-[#D4A574] text-[#5C4033] rounded-xl font-semibold hover:bg-[#C4956A] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-[#5C4033]/60 mt-2 text-center">
              AI assistant • May produce inaccurate information
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

