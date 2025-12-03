"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, MessageCircle, X, Calendar, User, Check, Loader2 } from "lucide-react";

/* -------------------- Types -------------------- */
type BookingStatus = "pending" | "accepted" | "in-progress" | "completed" | "cancelled" | "declined";

type Booking = {
  _id: string;
  service: string;
  category?: string;
  price?: number;
  budgetType?: "fixed" | "hourly" | "negotiable";
  bookingDate: string; // ISO
  scheduledDate?: string; // ISO
  status: BookingStatus;
  handyman: {
    _id: string;
    name: string;
    profileImage?: string;
    rating?: number;
    phone?: string;
    hourlyRate?: number;
  };
  notes?: string;
  attachments?: { name: string; url?: string }[];
  createdAt?: string;
  updatedAt?: string;
  progress?: number; // 0 - 100
};

/* -------------------- Helpers & Mock Data -------------------- */

const STATUS_LABEL: Record<BookingStatus, { label: string; style: string }> = {
  pending: { label: "Pending", style: "bg-yellow-100 text-yellow-800" },
  accepted: { label: "Accepted", style: "bg-green-100 text-green-800" },
  "in-progress": { label: "In Progress", style: "bg-blue-100 text-blue-800" },
  completed: { label: "Completed", style: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Cancelled", style: "bg-red-100 text-red-800" },
  declined: { label: "Declined", style: "bg-red-100 text-red-800" },
};

const MOCK_BOOKINGS: Booking[] = [
  {
    _id: "b_001",
    service: "Kitchen Faucet Replacement",
    category: "Plumbing",
    price: 120,
    budgetType: "fixed",
    bookingDate: "2025-11-02T10:30:00.000Z",
    scheduledDate: "2025-11-10T14:00:00.000Z",
    status: "completed",
    handyman: {
      _id: "h_001",
      name: "Kenji Teneka",
      profileImage: "/images/handyman-profile.jpg",
      rating: 4.9,
      phone: "+1 403 555 1111",
    },
    notes: "Replace cartridge and check water pressure. Remove old faucet and install new one (I will provide faucet).",
    attachments: [{ name: "faucet-photo.jpg", url: "/images/sample-attachment.jpg" }],
    createdAt: "2025-11-02T09:45:00.000Z",
    updatedAt: "2025-11-10T16:30:00.000Z",
    progress: 100,
  },
  {
    _id: "b_002",
    service: "Living Room Light Wiring Fix",
    category: "Electrical",
    price: 80,
    budgetType: "fixed",
    bookingDate: "2025-11-05T09:00:00.000Z",
    scheduledDate: "2025-11-14T09:00:00.000Z",
    status: "in-progress",
    handyman: {
      _id: "h_002",
      name: "Aisha Rahman",
      profileImage: "/images/handyman-2.jpg",
      rating: 4.7,
      phone: "+1 403 555 2222",
    },
    notes: "Intermittent flicker. Check connection at switch and replace worn sockets if required.",
    attachments: [],
    createdAt: "2025-11-05T08:12:00.000Z",
    updatedAt: "2025-11-14T11:00:00.000Z",
    progress: 60,
  },
  {
    _id: "b_003",
    service: "Winter Garden Clean & Hedge Trim",
    category: "Gardening",
    price: 200,
    budgetType: "fixed",
    bookingDate: "2025-10-20T07:30:00.000Z",
    scheduledDate: "2025-11-16T08:00:00.000Z",
    status: "accepted",
    handyman: {
      _id: "h_003",
      name: "Mohammed Ali",
      profileImage: "/images/handyman-3.jpg",
      rating: 4.6,
      phone: "+1 403 555 3333",
    },
    notes: "Trim hedges, remove dead branches, tidy lawn edges.",
    attachments: [],
    createdAt: "2025-10-20T07:00:00.000Z",
    updatedAt: "2025-10-21T10:00:00.000Z",
    progress: 20,
  },
  {
    _id: "b_004",
    service: "Dishwasher Installation",
    category: "Appliance Repair",
    price: 150,
    budgetType: "fixed",
    bookingDate: "2025-11-08T13:00:00.000Z",
    scheduledDate: "2025-11-20T10:00:00.000Z",
    status: "pending",
    handyman: {
      _id: "h_004",
      name: "Priya Patel",
      profileImage: "/images/handyman-4.jpg",
      rating: 4.8,
      phone: "+1 403 555 4444",
    },
    notes: "Install new dishwasher and test drain connection.",
    attachments: [],
    createdAt: "2025-11-08T12:40:00.000Z",
    updatedAt: "2025-11-08T12:40:00.000Z",
    progress: 0,
  },
  // add more mocked bookings if needed
];

/* -------------------- Component -------------------- */

export default function ClientBookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Controls
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus | "my-handyman">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "price-high" | "price-low" | "status">("recent");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // attempt to fetch bookings from API; fallback to mock
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch("/api/client/bookings", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const json = await res.json();
          setBookings(json.bookings || json);
        } else {
          // fallback to mock
          setBookings(MOCK_BOOKINGS);
        }
      } catch (err) {
        // network or other error
        setBookings(MOCK_BOOKINGS);
        setError("Could not load live bookings; showing mock data.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  /* -------------------- Derived Lists -------------------- */

  const filtered = useMemo(() => {
    if (!bookings) return [];
    let list = bookings.slice();

    if (statusFilter !== "all") {
      list = list.filter((b) => b.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.service.toLowerCase().includes(q) ||
          (b.handyman.name && b.handyman.name.toLowerCase().includes(q)) ||
          (b.category && b.category.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case "recent":
        list.sort((a, b) => (b.createdAt || b.bookingDate).localeCompare(a.createdAt || a.bookingDate));
        break;
      case "price-high":
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "price-low":
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "status":
        list.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }

    return list;
  }, [bookings, statusFilter, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* -------------------- Actions -------------------- */

  const openChat = (handymanId: string) => {
    // navigate to chat page; placeholder route
    router.push(`/client/chat?handyman=${handymanId}`);
  };

  const cancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setActionLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`/api/client/bookings/${id}/cancel`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        // update state locally
        setBookings((prev) => (prev ? prev.map((b) => (b._id === id ? { ...b, status: "cancelled", progress: 0 } : b)) : prev));
      } else {
        alert("Unable to cancel booking. Please try again.");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const markComplete = async (id: string) => {
    setActionLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`/api/client/bookings/${id}/complete`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setBookings((prev) => (prev ? prev.map((b) => (b._id === id ? { ...b, status: "completed", progress: 100 } : b)) : prev));
      } else {
        alert("Unable to complete booking. Please try again.");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  /* -------------------- UI Pieces -------------------- */

  const StatusPill: React.FC<{ status: BookingStatus }> = ({ status }) => {
    const s = STATUS_LABEL[status];
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.style}`}>{s.label}</span>;
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "N/A";
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return iso;
    }
  };

  /* -------------------- Render -------------------- */

  return (
    <main className="min-h-screen w-full bg-[#F5F5F0] text-gray-900 flex flex-col">
      {/* Top Controls */}
      <div className="w-full bg-gradient-to-br from-[#D4A574] to-[#B8A565] p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-white">
              <h1 className="text-2xl font-bold">Your Bookings</h1>
              <p className="text-sm text-white/90">All jobs you posted — recent and ongoing with handyman details.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg text-white hover:bg-white/30">
              <Bell size={16} />
              Notifications
            </button>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="bg-white text-[#6b4e32] px-4 py-2 rounded-lg font-semibold"
            >
              New Booking
            </button>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-12 gap-6">
        {/* Left: Filters & Summary (col 3) */}
        <aside className="col-span-12 lg:col-span-3 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-lg text-[#1a1a1a]">Filters</h3>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm text-gray-500">Search</label>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by service, handyman, or category"
                className="mt-2 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A574] border-gray-200"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">Status</label>
              <div className="mt-2 flex flex-col gap-2">
                <button
                  onClick={() => { setStatusFilter("all"); setPage(1); }}
                  className={`text-left px-3 py-2 rounded-lg ${statusFilter === "all" ? "bg-[#D4A574] text-white" : "bg-gray-50"}`}
                >
                  All
                </button>
                {(["pending","accepted","in-progress","completed","cancelled","declined"] as BookingStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setPage(1); }}
                    className={`text-left px-3 py-2 rounded-lg ${statusFilter === s ? "bg-[#D4A574] text-white" : "bg-gray-50"}`}
                  >
                    {STATUS_LABEL[s].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="mt-2 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A574] border-gray-200"
              >
                <option value="recent">Most recent</option>
                <option value="price-high">Price: High → Low</option>
                <option value="price-low">Price: Low → High</option>
                <option value="status">By status</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700">Summary</h4>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="bg-[#F9FAFB] p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-500">Total</div>
                  <div className="text-lg font-bold">{bookings ? bookings.length : "—"}</div>
                </div>
                <div className="bg-[#F9FAFB] p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-500">Ongoing</div>
                  <div className="text-lg font-bold">{bookings ? bookings.filter(b => b.status === "in-progress" || b.status === "accepted").length : "—"}</div>
                </div>
                <div className="bg-[#F9FAFB] p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-500">Completed</div>
                  <div className="text-lg font-bold">{bookings ? bookings.filter(b => b.status === "completed").length : "—"}</div>
                </div>
                <div className="bg-[#F9FAFB] p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-500">Cancelled</div>
                  <div className="text-lg font-bold">{bookings ? bookings.filter(b => b.status === "cancelled" || b.status === "declined").length : "—"}</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Booking list (col 9) */}
        <section className="col-span-12 lg:col-span-9">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#1a1a1a]">Recent Bookings</h2>
              <p className="text-sm text-gray-500">Showing {filtered.length} results</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => { setPage(1); setSortBy("recent"); }}
                className="px-3 py-2 rounded-lg bg-white border border-gray-200"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm text-center">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="animate-spin" />
                <div className="text-gray-600">Loading bookings...</div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-red-100 text-red-700 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Bookings grid */}
          {!loading && currentItems.length === 0 && (
            <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
              <p className="text-gray-500">You have no bookings matching these filters.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentItems.map((b) => (
              <article key={b._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4A574]">
                    <Image src={b.handyman.profileImage || "/images/handyman-placeholder.jpg"} alt={b.handyman.name} width={64} height={64} className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-[#1a1a1a]">{b.service}</h3>
                        <div className="text-sm text-gray-500">{b.category} • {b.handyman.name}</div>
                        <div className="text-xs text-gray-400 mt-1">Booked: {formatDate(b.bookingDate)}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-sm font-semibold">${b.price ?? "—"}</div>
                        <StatusPill status={b.status} />
                      </div>
                    </div>

                    {/* Progress bar & schedule */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div>Scheduled: {b.scheduledDate ? formatDate(b.scheduledDate) : "Not scheduled"}</div>
                        <div>Progress: {b.progress ?? 0}%</div>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                        <div className="h-2 rounded-full" style={{ width: `${b.progress ?? 0}%`, background: b.status === "completed" ? "#6B8E23" : "#D4A574" }} />
                      </div>
                    </div>

                    {/* Notes */}
                    {b.notes && <p className="mt-3 text-sm text-gray-700 line-clamp-3">{b.notes}</p>}

                    {/* Attachments */}
                    {b.attachments && b.attachments.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        {b.attachments.slice(0, 3).map((a, i) => (
                          <div key={i} className="w-14 h-10 rounded overflow-hidden border">
                            <Image src={a.url || "/images/sample-attachment.jpg"} alt={a.name} width={56} height={40} className="object-cover" />
                          </div>
                        ))}
                        {b.attachments.length > 3 && <div className="text-sm text-gray-400">+{b.attachments.length - 3}</div>}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="px-3 py-2 rounded-lg border bg-white text-gray-700"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => openChat(b.handyman._id)}
                        className="px-3 py-2 rounded-lg border bg-white text-gray-700 flex items-center gap-2"
                      >
                        <MessageCircle size={16} /> Message
                      </button>

                      {b.status !== "cancelled" && b.status !== "completed" && (
                        <button
                          onClick={() => cancelBooking(b._id)}
                          disabled={actionLoading}
                          className="px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-100"
                        >
                          Cancel
                        </button>
                      )}

                      {b.status === "in-progress" && (
                        <button
                          onClick={() => markComplete(b._id)}
                          disabled={actionLoading}
                          className="ml-auto px-3 py-2 rounded-lg bg-[#D4A574] text-white"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg bg-white border"
              >
                Prev
              </button>
              <div className="px-3 py-2 rounded-lg bg-white border">{page}/{totalPages}</div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg bg-white border"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-auto max-h-[80vh]">
            <div className="flex items-start justify-between p-5 border-b">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#D4A574]">
                  <Image src={selectedBooking.handyman.profileImage || "/images/handyman-placeholder.jpg"} alt={selectedBooking.handyman.name} width={56} height={56} className="object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedBooking.service}</h3>
                  <div className="text-sm text-gray-500">{selectedBooking.handyman.name} • {selectedBooking.category}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusPill status={selectedBooking.status} />
                <button onClick={() => setSelectedBooking(null)} className="p-2 rounded-full bg-gray-100">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Booking Created</div>
                  <div className="mt-1 text-sm">{formatDate(selectedBooking.createdAt)}</div>

                  <div className="text-sm text-gray-500 mt-3">Scheduled For</div>
                  <div className="mt-1 text-sm">{selectedBooking.scheduledDate ? formatDate(selectedBooking.scheduledDate) : "Not scheduled"}</div>

                  <div className="text-sm text-gray-500 mt-3">Price</div>
                  <div className="mt-1 text-sm">${selectedBooking.price ?? "—"} {selectedBooking.budgetType === "hourly" && "/hr"}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Handyman Contact</div>
                  <div className="mt-1 text-sm">{selectedBooking.handyman.phone || "Not provided"}</div>

                  <div className="text-sm text-gray-500 mt-3">Handyman Rating</div>
                  <div className="mt-1 text-sm">{selectedBooking.handyman.rating ?? "—"} / 5</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800">Job Notes</h4>
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{selectedBooking.notes || "No notes provided."}</p>
              </div>

              {selectedBooking.attachments && selectedBooking.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800">Attachments</h4>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {selectedBooking.attachments.map((a, i) => (
                      <div key={i} className="rounded overflow-hidden border p-2 bg-white">
                        <Image src={a.url || "/images/sample-attachment.jpg"} alt={a.name} width={400} height={240} className="object-cover h-28 w-full" />
                        <div className="mt-2 text-xs text-gray-500">{a.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button onClick={() => openChat(selectedBooking.handyman._id)} className="px-4 py-2 rounded-lg bg-white border">
                  Message Handyman
                </button>

                {selectedBooking.status !== "cancelled" && selectedBooking.status !== "completed" && (
                  <button onClick={() => cancelBooking(selectedBooking._id)} className="px-4 py-2 rounded-lg bg-red-50 text-red-700">
                    Cancel Booking
                  </button>
                )}

                {selectedBooking.status === "in-progress" && (
                  <button onClick={() => markComplete(selectedBooking._id)} className="ml-auto px-4 py-2 rounded-lg bg-[#D4A574] text-white">
                    Mark as Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer small */}
      <div className="max-w-7xl mx-auto px-6 py-6 text-xs text-gray-400">
        Need help? Visit the <span className="text-[#D4A574]">Help Center</span> or contact support.
      </div>
    </main>
  );
}
