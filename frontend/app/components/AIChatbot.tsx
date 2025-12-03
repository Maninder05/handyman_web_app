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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [typingMessage, setTypingMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);
  const [initialMessageShown, setInitialMessageShown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingMessage]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Smooth typing animation function
  const typeMessage = (fullText: string, callback: (message: Message) => void) => {
    setIsTyping(true);
    setTypingMessage("");
    let currentIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setTypingMessage(fullText.substring(0, currentIndex + 1));
        currentIndex++;
        scrollToBottom();
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        
        // Create the final message after typing completes
        const finalMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: fullText,
          sender: "bot",
          timestamp: new Date(),
        };
        
        setTypingMessage("");
        callback(finalMessage);
      }
    }, 15); // Adjust speed: lower = faster typing (15ms = ~67 chars/sec)
  };

  // Show initial welcome message with typing animation when chatbot opens
  useEffect(() => {
    if (isOpen && !isMinimized && !initialMessageShown) {
      const welcomeText = "Hi! I'm your AI assistant. How can I help you today? I can answer questions about bookings, payments, memberships, or guide you through our platform.";
      typeMessage(welcomeText, (welcomeMessage) => {
        setMessages([welcomeMessage]);
        setInitialMessageShown(true);
      });
    }
  }, [isOpen, isMinimized, initialMessageShown]);

  // Expanded FAQ knowledge base for comprehensive responses
  const faqKnowledge = {
    bookings: {
      how: "To book a handyman, first search for the service you need using our search bar. Browse through available handymen in your area, check their ratings and reviews, then select a time slot that works for you. Once you confirm, you'll receive a confirmation email with all booking details including the handyman's contact information.",
      cancel: "Yes, you can cancel or reschedule bookings! Go to your bookings page, select the booking you want to modify, and choose 'Cancel' or 'Reschedule'. You can make changes up to 24 hours before the scheduled time without fees. Late cancellations may incur charges depending on the provider's policy.",
      time: "Booking times are flexible! Most handymen offer slots throughout the week. You can select from available time slots when making a booking. If you need a specific time, use the 'Request Custom Time' option and the handyman will respond within a few hours.",
      modify: "Yes! You can modify your booking details including time, location, or service requirements up to 24 hours before the appointment. Just go to your booking details and click 'Edit Booking'.",
      confirmation: "You'll receive a confirmation email immediately after booking. This includes the handyman's name, contact info, scheduled time, service details, and payment information. Keep this email for your records!",
      tools: "Yes, professional handymen bring their own tools! Most handymen come fully equipped with all the standard tools needed for their services. This typically includes drills, saws, hammers, screwdrivers, measuring tools, and other common equipment. For specialized projects requiring unique tools, the handyman will either bring them or let you know beforehand if any special tools or materials are needed. You can always confirm tool requirements when booking or by messaging the handyman directly through the platform.",
      equipment: "Handymen typically bring all necessary tools and equipment for standard jobs. However, for large projects or specialized work, some materials (like lumber, paint, fixtures, or parts) may need to be purchased separately. The handyman's service listing usually specifies what's included, and you can discuss any specific tool or material requirements when you book. Most handymen will confirm what they're bringing before the appointment.",
      materials: "Handymen usually provide tools, but materials (like wood, paint, nails, screws, fixtures) are typically not included unless specifically stated in the service description. When booking, you'll see what's included. Some handymen offer 'materials included' packages, while others charge separately for materials purchased on your behalf. You can always discuss material needs with the handyman before or after booking through the messaging feature.",
      preparation: "Before your handyman arrives, clear the work area of personal items and furniture if possible. Make sure there's good lighting and access to the workspace. For electrical or plumbing work, ensure the handyman can access circuit breakers or water shut-off valves. Most handymen will arrive with their tools, but you can always confirm what they'll bring when you book.",
    },
    payments: {
      methods: "We accept all major credit and debit cards (Visa, Mastercard, American Express), as well as PayPal and Apple Pay. All payments are processed securely through encrypted payment gateways. Your card information is never stored on our servers.",
      security: "Your payments are completely secure. We use industry-standard encryption and are PCI-DSS compliant. Payments are held securely until the job is completed and confirmed. If there are any issues, we have a dispute resolution process to protect both customers and handymen.",
      refund: "To request a refund, go to your booking details page, click 'Request Refund', select your reason (e.g., work not completed, quality issues, cancellation), and submit. Our support team reviews all refund requests within 24-48 hours. Refunds are typically processed back to your original payment method within 3-5 business days.",
      handyman_payment: "As a handyman, you'll receive payment 24-48 hours after job completion and customer confirmation. Payments are automatically deposited to your linked bank account or PayPal. You can track all earnings and payment history in your dashboard under 'Earnings'.",
      disputes: "If there's a payment dispute, both parties can submit evidence through our dispute resolution center. Our support team will review and make a fair decision within 48 hours. We aim to protect both customers and service providers.",
    },
    membership: {
      plans: "We offer three membership tiers: Basic ($10/month or $96/year) for new handymen, Seasonal ($12/month or $108/year) with featured listings, and Pro ($15/month or $144/year) with unlimited features and priority support. Each plan includes different benefits like verification badges, priority placement in search results, and marketing tools.",
      features: "Membership features include: profile verification badges, priority placement in search results, featured listings, access to analytics dashboard, marketing tools, and priority customer support. Pro members also get unlimited featured listings and a dedicated account manager.",
      cancel: "Yes, you can cancel your membership anytime from your account settings. Your membership will remain active until the end of your billing cycle, and you'll continue to have access to all features until then. No penalties or fees for cancellation.",
      upgrade: "You can upgrade your membership at any time! Go to the membership page, select your desired plan, and complete the upgrade. The new plan features will be activated immediately, and you'll be charged a prorated amount for the remainder of your billing cycle.",
      benefits: "Membership helps you stand out from competitors, get more visibility, build trust with customers through verification badges, and access powerful tools to grow your business. Many handymen see 2-3x more bookings after upgrading to a paid membership.",
    },
    general: {
      verification: "All handymen go through a verification process including ID verification, background checks, and skill assessments. You can see verification badges on each profile. We also monitor ratings and reviews to ensure quality service. Customers can report issues, and verified handymen with consistent high ratings are more trusted.",
      insurance: "Yes! All jobs booked through our platform are covered by HandyCover protection. This includes liability coverage for damages and accidents that occur during the job. Coverage applies automatically when you book through our platform - no additional steps needed.",
      ratings: "Ratings and reviews help maintain quality. After each completed job, both parties can leave ratings (1-5 stars) and written reviews. This helps future customers make informed decisions and helps handymen build their reputation. Reviews are verified to prevent fake reviews.",
      support: "Our support team is available 24/7 through this chat, email, or phone. For urgent issues during an active booking, we have priority support. General questions can be answered by me (your AI assistant) or you can request to speak with a human agent anytime.",
      safety: "Safety is our top priority. All handymen are verified, we have secure payment processing, insurance coverage, and a robust reporting system. If you ever feel unsafe or encounter issues, you can use our emergency contact feature or report concerns immediately through the app.",
      profile: "To create or update your profile, go to Settings. You can add your skills, experience, certifications, portfolio photos, service areas, availability, and pricing. A complete profile with photos and good reviews gets significantly more bookings. Keep your profile updated regularly!",
      service_areas: "Handymen can set their service areas when creating their profile. Customers can search by location to find handymen available in their area. You can add multiple service areas and set different pricing for different locations if needed.",
      what_to_expect: "When you book a handyman through our platform, they'll arrive at the scheduled time with their own tools. They'll assess the job, discuss the work with you, and complete the service professionally. After completion, you'll be asked to confirm the work is done, and payment will be processed. You can leave a review to help other customers. All communication can happen through the platform's messaging system for your convenience and security.",
    },
  };

  // Enhanced AI response generator with expanded knowledge
  const generateAIResponse = async (userMessage: string): Promise<string | null> => {
    // Simulate API delay for realism
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

    const lowerMessage = userMessage.toLowerCase();

    // Check if user wants to contact an agent
    if (
      lowerMessage.includes("contact agent") ||
      lowerMessage.includes("talk to agent") ||
      lowerMessage.includes("speak to agent") ||
      lowerMessage.includes("human agent") ||
      lowerMessage.includes("real person") ||
      lowerMessage.includes("transfer to agent") ||
      lowerMessage.includes("live agent") ||
      (lowerMessage.includes("agent") && (lowerMessage.includes("connect") || lowerMessage.includes("transfer")))
    ) {
      return null; // Signal transfer to agent
    }

    // Tools and Equipment - Check this FIRST as it's a common question
    if (lowerMessage.includes("tool") || lowerMessage.includes("equipment") || lowerMessage.includes("supplies")) {
      if ((lowerMessage.includes("bring") || lowerMessage.includes("have") || lowerMessage.includes("will") || 
           lowerMessage.includes("do they") || lowerMessage.includes("does he") || lowerMessage.includes("does she") ||
           lowerMessage.includes("come with") || lowerMessage.includes("include")) && !lowerMessage.includes("book")) {
        if (lowerMessage.includes("material") && !lowerMessage.includes("tool")) {
          return faqKnowledge.bookings.materials;
        }
        return faqKnowledge.bookings.tools;
      }
    }

    if ((lowerMessage.includes("bring") || lowerMessage.includes("will bring") || lowerMessage.includes("do they bring")) && 
        (lowerMessage.includes("tool") || lowerMessage.includes("equipment"))) {
      return faqKnowledge.bookings.tools;
    }

    if (lowerMessage.includes("material") && (lowerMessage.includes("include") || lowerMessage.includes("bring") || 
        lowerMessage.includes("need") || lowerMessage.includes("provide") || lowerMessage.includes("supply"))) {
      return faqKnowledge.bookings.materials;
    }

    // Bookings - Comprehensive responses
    if (lowerMessage.includes("book") || lowerMessage.includes("booking") || lowerMessage.includes("schedule") || lowerMessage.includes("appointment")) {
      if (lowerMessage.includes("cancel") || lowerMessage.includes("cancel")) {
        return faqKnowledge.bookings.cancel;
      }
      if (lowerMessage.includes("how") || lowerMessage.includes("process") || lowerMessage.includes("steps")) {
        return faqKnowledge.bookings.how;
      }
      if (lowerMessage.includes("time") || lowerMessage.includes("when") || lowerMessage.includes("available")) {
        return faqKnowledge.bookings.time;
      }
      if (lowerMessage.includes("modify") || lowerMessage.includes("change") || lowerMessage.includes("edit")) {
        return faqKnowledge.bookings.modify;
      }
      if (lowerMessage.includes("confirm") || lowerMessage.includes("email")) {
        return faqKnowledge.bookings.confirmation;
      }
      if (lowerMessage.includes("prepare") || lowerMessage.includes("what should i") || lowerMessage.includes("ready")) {
        return faqKnowledge.bookings.preparation;
      }
      return faqKnowledge.bookings.how + " " + faqKnowledge.bookings.cancel;
    }

    if (lowerMessage.includes("prepare") || lowerMessage.includes("what should i do before") || lowerMessage.includes("ready")) {
      return faqKnowledge.bookings.preparation;
    }

    if (lowerMessage.includes("expect") || (lowerMessage.includes("what happens") && lowerMessage.includes("handyman")) || lowerMessage.includes("what to expect")) {
      return faqKnowledge.general.what_to_expect;
    }

    // Payments - Detailed responses
    if (lowerMessage.includes("payment") || lowerMessage.includes("pay") || lowerMessage.includes("money") || lowerMessage.includes("cost") || lowerMessage.includes("price")) {
      if (lowerMessage.includes("refund") || lowerMessage.includes("return")) {
        return faqKnowledge.payments.refund;
      }
      if (lowerMessage.includes("method") || lowerMessage.includes("card") || lowerMessage.includes("how to pay")) {
        return faqKnowledge.payments.methods;
      }
      if (lowerMessage.includes("secure") || lowerMessage.includes("safe") || lowerMessage.includes("protection")) {
        return faqKnowledge.payments.security;
      }
      if (lowerMessage.includes("dispute") || lowerMessage.includes("issue") || lowerMessage.includes("problem")) {
        return faqKnowledge.payments.disputes;
      }
      if (userType === "handyman" && (lowerMessage.includes("receive") || lowerMessage.includes("paid") || lowerMessage.includes("earnings"))) {
        return faqKnowledge.payments.handyman_payment;
      }
      if (userType === "handyman") {
        return faqKnowledge.payments.handyman_payment + " " + faqKnowledge.payments.disputes;
      }
      return faqKnowledge.payments.methods + " " + faqKnowledge.payments.security;
    }

    // Memberships - Expanded information
    if (lowerMessage.includes("membership") || lowerMessage.includes("plan") || lowerMessage.includes("subscription") || lowerMessage.includes("tier")) {
      if (lowerMessage.includes("cancel") || lowerMessage.includes("stop")) {
        return faqKnowledge.membership.cancel;
      }
      if (lowerMessage.includes("upgrade") || lowerMessage.includes("change plan")) {
        return faqKnowledge.membership.upgrade;
      }
      if (lowerMessage.includes("feature") || lowerMessage.includes("benefit") || lowerMessage.includes("include")) {
        return faqKnowledge.membership.features;
      }
      if (lowerMessage.includes("worth") || lowerMessage.includes("benefit") || lowerMessage.includes("why")) {
        return faqKnowledge.membership.benefits;
      }
      return faqKnowledge.membership.plans + " " + faqKnowledge.membership.features;
    }

    // General topics - Comprehensive coverage
    if (lowerMessage.includes("verify") || lowerMessage.includes("verified") || lowerMessage.includes("trust") || lowerMessage.includes("safe") || lowerMessage.includes("legit")) {
      return faqKnowledge.general.verification + " " + faqKnowledge.general.safety;
    }

    if (lowerMessage.includes("insurance") || lowerMessage.includes("cover") || lowerMessage.includes("protected")) {
      return faqKnowledge.general.insurance;
    }

    if (lowerMessage.includes("rating") || lowerMessage.includes("review") || lowerMessage.includes("feedback")) {
      return faqKnowledge.general.ratings;
    }

    if (lowerMessage.includes("profile") || lowerMessage.includes("update profile") || lowerMessage.includes("edit profile")) {
      return faqKnowledge.general.profile;
    }

    if (lowerMessage.includes("support") || lowerMessage.includes("help") || lowerMessage.includes("contact")) {
      return faqKnowledge.general.support + " If you need to speak with a human agent, just type 'contact agent' and I'll connect you right away.";
    }

    if (lowerMessage.includes("service area") || lowerMessage.includes("location") || lowerMessage.includes("where")) {
      return faqKnowledge.general.service_areas;
    }

    if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey") || lowerMessage.includes("greetings")) {
      return `Hello! I'm your AI assistant for the Handyman platform. I can help you with:\n\n• Bookings: How to book, cancel, reschedule, or modify appointments\n• Payments: Payment methods, security, refunds, and dispute resolution\n• Memberships: Plan details, features, upgrades, and benefits\n• Profiles: Creating and updating your profile\n• Safety: Verification, insurance, and security measures\n• General Support: Any other questions about our platform\n\nWhat would you like to know? Or type "contact agent" to speak with a human.`;
    }

    if (lowerMessage.includes("thank") || lowerMessage.includes("thanks")) {
      return "You're very welcome! I'm here 24/7 to help. If you have any more questions, feel free to ask. Have a great day!";
    }

    // Intelligent default response with suggestions
    const suggestions = [];
    if (lowerMessage.includes("how") || lowerMessage.includes("what") || lowerMessage.includes("when") || lowerMessage.includes("where") || lowerMessage.includes("why")) {
      suggestions.push("I can explain how things work on our platform");
    }
    if (lowerMessage.includes("can i") || lowerMessage.includes("is it possible") || lowerMessage.includes("able to")) {
      suggestions.push("I can tell you what's possible on our platform");
    }

    const defaultResponse = `I understand you're asking about: "${userMessage}". ` +
      `I can help you with questions about:\n\n` +
      `📅 Bookings and scheduling\n` +
      `💳 Payments and refunds\n` +
      `⭐ Memberships and plans\n` +
      `👤 Profile management\n` +
      `🔒 Safety and verification\n` +
      `📞 Support and help\n\n` +
      `Could you rephrase your question with more specific details? ` +
      `For example: "How do I book a handyman?" or "What payment methods do you accept?" ` +
      `Or if you'd prefer, type "contact agent" to speak with a human support representative.`;

    return defaultResponse;
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
        typeMessage("I'm connecting you with a real support agent now. They'll be able to help you with more complex issues. Please wait a moment...", (transferMessage) => {
          setMessages((prev) => [...prev, transferMessage]);
          // Wait a moment then transfer
          setTimeout(() => {
            onTransferToAgent();
            onClose();
          }, 1000);
        });
        return;
      }
      
      // Use typing animation for bot response
      if (response) {
        typeMessage(response, (botMessage) => {
          setMessages((prev) => [...prev, botMessage]);
        });
      }
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
                      : "bg-white border border-[#EED9C4] rounded-bl-sm"
                  }`}
                >
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${message.sender === "bot" ? "text-black" : "text-[#5C4033]"}`}>{message.text}</p>
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
            {isLoading && !isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4A574] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#5C4033]" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 border border-[#EED9C4]">
                  <Loader2 className="w-5 h-5 text-[#D4A574] animate-spin" />
                </div>
              </div>
            )}
            {isTyping && typingMessage && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4A574] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#5C4033]" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 border border-[#EED9C4] max-w-[80%]">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-black">{typingMessage}<span className="inline-block w-2 h-4 bg-[#5C4033] ml-1 animate-pulse">|</span></p>
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

