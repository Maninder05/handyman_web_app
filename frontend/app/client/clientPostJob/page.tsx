"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Upload, MapPin, Clock, Tag, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { FiPlus, FiTrash2 } from "react-icons/fi";

// ----- Types -----

type BudgetType = "fixed" | "hourly" | "negotiable";

type Category =
  | "Plumbing"
  | "Electrical"
  | "Painting"
  | "Carpentry"
  | "Cleaning"
  | "Appliance Repair"
  | "Gardening"
  | "General Handyman"
  | "Other";

interface JobPost {
  title: string;
  category: Category | string;
  description: string;
  price?: number;
  budgetType: BudgetType;
  estimatedHours?: number;
  skills: string[];
  preferredDate?: string;
  preferredTime?: string;
  location?: string;
  attachments?: File[];
  contactPhone?: string;
  allowOffers?: boolean;
}

// ----- Helper constants -----

const CATEGORIES: Category[] = [
  "Plumbing",
  "Electrical",
  "Painting",
  "Carpentry",
  "Cleaning",
  "Appliance Repair",
  "Gardening",
  "General Handyman",
  "Other",
];

const SKILL_SUGGESTIONS = [
  "Tile work",
  "Drywall",
  "Fixture installation",
  "Cabinet repair",
  "Outdoor fencing",
  "Pressure washing",
  "Flooring",
  "Light fitting",
  "Basic wiring",
  "Leak repair",
  "Painting prep",
];

// ----- Small UI components -----

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function SmallHelp({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 mt-1">{children}</p>;
}

// ----- Main Export -----

export default function ClientPostJob() {
  const router = useRouter();

  // Form state
  const [form, setForm] = useState<JobPost>({
    title: "",
    category: "General Handyman",
    description: "",
    price: undefined,
    budgetType: "fixed",
    estimatedHours: undefined,
    skills: [],
    preferredDate: "",
    preferredTime: "",
    location: "",
    attachments: [],
    contactPhone: "",
    allowOffers: true,
  });

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setCharCount(form.description.length);
  }, [form.description]);

  // ----- Helper functions -----

  const updateField = <K extends keyof JobPost>(key: K, value: JobPost[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((e) => ({ ...e, [String(key)]: "" }));
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    setForm((prev) => ({ ...prev, skills: Array.from(new Set([...prev.skills, trimmed])) }));
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const maxFiles = 5;
    const allowed = Array.from(files).slice(0, maxFiles);

    const newAttachments = [...(form.attachments || []), ...allowed];
    // limit attachments to 5
    const limited = newAttachments.slice(0, maxFiles);
    updateField("attachments", limited);

    // create previews for images only (small data URL)
    const previews: string[] = [];
    allowed.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const res = reader.result as string;
            previews.push(res);
            if (previews.length === allowed.filter((f) => f.type.startsWith("image/")).length) {
              // append to existing previews
              setAttachmentPreviews((prev) => [...prev, ...previews].slice(0, maxFiles));
            }
          } catch (e) {
            // ignore preview error
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeAttachmentAt = (index: number) => {
    const attachments = [...(form.attachments || [])];
    attachments.splice(index, 1);
    updateField("attachments", attachments);
    setAttachmentPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!form.title || form.title.trim().length < 6) {
      errs.title = "Give your job a clear title (at least 6 characters).";
    }

    if (!form.description || form.description.trim().length < 20) {
      errs.description = "Provide a detailed description (at least 20 characters).";
    }

    if (form.budgetType !== "negotiable") {
      if (form.price === undefined || Number.isNaN(Number(form.price))) {
        errs.price = "Enter a valid price or set budget to negotiable.";
      } else if (form.price! < 0) {
        errs.price = "Price cannot be negative.";
      }
    }

    if (!form.location || form.location.trim().length < 3) {
      errs.location = "Provide a brief location or address.";
    }

    if (form.preferredDate && isNaN(Date.parse(form.preferredDate))) {
      errs.preferredDate = "Invalid date.";
    }

    if (form.contactPhone && !/^\+?[0-9 \-()]{7,20}$/.test(form.contactPhone)) {
      errs.contactPhone = "Enter a valid phone number, including country code if needed.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ----- Submit -----
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);

    try {
      // Build form data to send files
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("category", String(form.category));
      fd.append("description", form.description);
      fd.append("budgetType", form.budgetType);
      if (form.price !== undefined) fd.append("price", String(form.price));
      if (form.estimatedHours !== undefined) fd.append("estimatedHours", String(form.estimatedHours));
      if (form.preferredDate) fd.append("preferredDate", form.preferredDate);
      if (form.preferredTime) fd.append("preferredTime", form.preferredTime);
      if (form.location) fd.append("location", form.location);
      if (form.contactPhone) fd.append("contactPhone", form.contactPhone);
      fd.append("allowOffers", String(form.allowOffers));

      form.skills?.forEach((s, idx) => fd.append(`skills[${idx}]`, s));

      (form.attachments || []).forEach((file, idx) => {
        fd.append("attachments", file, file.name);
      });

      const response = await fetch("/api/client/post-job", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: fd,
      });

      if (response.ok) {
        // reset form or redirect
        setPreviewOpen(false);
        router.push("/client/bookings");
      } else {
        const json = await response.json().catch(() => null);
        const msg = json?.message || "Failed to post job. Please try again.";
        setErrors((e) => ({ ...e, form: msg }));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setErrors((e) => ({ ...e, form: "Network error. Please check your connection." }));
    } finally {
      setSubmitting(false);
    }
  };

  // ----- Component UI -----
  return (
    <div className="min-h-screen bg-[#F5F5F0] py-8 px-4">
      <main className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Top banner */}
        <div className="bg-gradient-to-br from-[#D4A574] to-[#B8A565] p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white/20 p-3">
              <Camera size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">Post a Job</h1>
              <p className="text-white/90 text-sm mt-1">Write a clear job post to attract qualified handymen quickly.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Global error */}
          {errors.form && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 mt-1" />
              <div>
                <p className="text-sm text-red-700 font-medium">{errors.form}</p>
              </div>
            </div>
          )}

          {/* Title + Category Row */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FieldLabel required>Job Title</FieldLabel>
              <input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g., Fix leaking kitchen sink and replace faucet"
                className={`mt-2 block w-full rounded-lg border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4A574] ${errors.title ? 'border-red-200' : 'border-gray-200'}`}
                aria-invalid={!!errors.title}
              />
              {errors.title ? <SmallHelp>{errors.title}</SmallHelp> : <SmallHelp>Be specific — clear titles get more responses.</SmallHelp>}
            </div>

            <div>
              <FieldLabel required>Category</FieldLabel>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value as Category)}
                className="mt-2 block w-full rounded-lg border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4A574] border-gray-200"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <SmallHelp>Pick the category that best fits your job.</SmallHelp>
            </div>
          </div>

          {/* Price & Budget */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <FieldLabel>Budget Type</FieldLabel>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => updateField("budgetType", "fixed")}
                  className={`flex-1 px-3 py-2 rounded-lg border ${form.budgetType === 'fixed' ? 'bg-[#D4A574] text-white border-[#D4A574]' : 'bg-white text-gray-700 border-gray-200'}`}
                >
                  Fixed
                </button>
                <button
                  type="button"
                  onClick={() => updateField("budgetType", "hourly")}
                  className={`flex-1 px-3 py-2 rounded-lg border ${form.budgetType === 'hourly' ? 'bg-[#D4A574] text-white border-[#D4A574]' : 'bg-white text-gray-700 border-gray-200'}`}
                >
                  Hourly
                </button>
                <button
                  type="button"
                  onClick={() => updateField("budgetType", "negotiable")}
                  className={`flex-1 px-3 py-2 rounded-lg border ${form.budgetType === 'negotiable' ? 'bg-[#D4A574] text-white border-[#D4A574]' : 'bg-white text-gray-700 border-gray-200'}`}
                >
                  Negotiable
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <FieldLabel required>Price or Estimate</FieldLabel>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.price ?? ""}
                    onChange={(e) => updateField("price", e.target.value === "" ? undefined : Number(e.target.value))}
                    placeholder={form.budgetType === 'hourly' ? 'e.g. 25 (per hour)' : 'e.g. 120 (total)'}
                    className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4A574] border-gray-200 ${errors.price ? 'border-red-200' : ''}`}
                    aria-invalid={!!errors.price}
                  />
                  {errors.price && <SmallHelp>{errors.price}</SmallHelp>}
                </div>

                <div className="col-span-1">
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} />
                    <select
                      value={form.budgetType}
                      onChange={(e) => updateField("budgetType", e.target.value as BudgetType)}
                      className="rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D4A574] border-gray-200 w-full"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="hourly">Hourly</option>
                      <option value="negotiable">Negotiable</option>
                    </select>
                  </div>
                </div>
              </div>
              <SmallHelp>Set an approximate budget. If you prefer to receive offers, choose Negotiable.</SmallHelp>
            </div>
          </div>

          {/* Estimated Hours */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Estimated Hours (optional)</FieldLabel>
              <input
                type="number"
                min={0}
                value={form.estimatedHours ?? ""}
                onChange={(e) => updateField("estimatedHours", e.target.value === "" ? undefined : Number(e.target.value))}
                placeholder="e.g., 2.5"
                className="mt-2 block w-full rounded-lg border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4A574] border-gray-200"
              />
              <SmallHelp>Helpful for hourly jobs or to attract precise offers.</SmallHelp>
            </div>

            <div>
              <FieldLabel>Preferred Date & Time</FieldLabel>
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <input
                    type="date"
                    value={form.preferredDate ?? ""}
                    onChange={(e) => updateField("preferredDate", e.target.value)}
                    className="w-full rounded-lg border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4A574] border-gray-200"
                  />
                </div>
                <div className="w-36">
                  <input
                    type="time"
                    value={form.preferredTime ?? ""}
                    onChange={(e) => updateField("preferredTime", e.target.value)}
                    className="w-full rounded-lg border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4A574] border-gray-200"
                  />
                </div>
              </div>
              <SmallHelp>Optional — helps handymen know your availability.</SmallHelp>
            </div>
          </div>

          {/* Location + Contact */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Location</FieldLabel>
              <div className="mt-2 relative">
                <input
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="City, neighbourhood or full address"
                  className={`w-full rounded-lg border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4A574] border-gray-200 ${errors.location ? 'border-red-200' : ''}`}
                />
                <MapPin size={18} className="absolute right-3 top-3 text-gray-400" />
              </div>
              {errors.location && <SmallHelp>{errors.location}</SmallHelp>}
            </div>

            <div>
              <FieldLabel>Contact Phone (optional)</FieldLabel>
              <input
                value={form.contactPhone}
                onChange={(e) => updateField("contactPhone", e.target.value)}
                placeholder="e.g., +1 403 555 1234"
                className={`mt-2 block w-full rounded-lg border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4A574] border-gray-200 ${errors.contactPhone ? 'border-red-200' : ''}`}
              />
              {errors.contactPhone && <SmallHelp>{errors.contactPhone}</SmallHelp>}
            </div>
          </div>

          {/* Description */}
          <div>
            <FieldLabel required>Job Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder={
                "Describe the problem, materials needed, access information, any special instructions, and what a successful completion looks like."
              }
              rows={6}
              className={`mt-2 block w-full rounded-lg border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4A574] border-gray-200 ${errors.description ? 'border-red-200' : ''}`}
            />
            <div className="flex items-center justify-between mt-2">
              <SmallHelp>{errors.description || "Tip: mention dimensions, brands, or quantities where relevant."}</SmallHelp>
              <div className={`text-xs ${charCount > 1000 ? 'text-red-500' : 'text-gray-400'}`}>{charCount}/2000</div>
            </div>
          </div>

          {/* Skills input */}
          <div>
            <FieldLabel>Required Skills & Tags</FieldLabel>
            <div className="mt-2">
              <div className="flex gap-2 mb-2">
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                  placeholder="Add a skill and press Enter (e.g., tile work)"
                  className="flex-1 rounded-lg border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4A574] border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => addSkill(skillInput)}
                  className="px-4 py-3 rounded-lg bg-[#D4A574] text-white font-medium"
                >
                  <FiPlus />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {form.skills.map((s) => (
                  <div key={s} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm">
                    <Tag size={14} />
                    <span>{s}</span>
                    <button type="button" onClick={() => removeSkill(s)} className="ml-2">
                      <FiTrash2 size={14} className="text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2">
                {SKILL_SUGGESTIONS.slice(0, 6).map((s) => (
                  <button key={s} type="button" onClick={() => addSkill(s)} className="text-xs rounded-lg border px-3 py-2 text-gray-700 border-gray-200">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <FieldLabel>Attachments (photos, manuals) — optional</FieldLabel>
            <SmallHelp>Max 5 attachments. Images show a preview; other files are accepted but won\'t preview.</SmallHelp>
            <div className="mt-3">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.doc,.docx"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-gray-700 border-gray-200"
                >
                  <Upload size={16} />
                  <span className="text-sm">Choosee files</span>
                </button>

                <div className="text-sm text-gray-400">{(form.attachments || []).length} / 5 attached</div>

                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, attachments: [] }));
                      setAttachmentPreviews([]);
                    }}
                    className="px-3 py-2 rounded-lg border bg-gray-50 text-gray-700 border-gray-200"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewOpen((p) => !p)}
                    className="px-3 py-2 rounded-lg border bg-[#D4A574] text-white border-[#D4A574]"
                  >
                    {previewOpen ? "Close Preview" : "Preview"}
                  </button>
                </div>
              </div>

              {/* Previews */}
              {attachmentPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {attachmentPreviews.map((src, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden border">
                      <Image src={src} alt={`attachment-${i}`} width={320} height={240} className="object-cover w-full h-28" />
                      <button
                        onClick={() => removeAttachmentAt(i)}
                        className="absolute top-1 right-1 bg-white/80 rounded-full p-1"
                        aria-label={`Remove attachment ${i + 1}`}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Non-preview files list */}
              {(form.attachments || []).length > 0 && (
                <ul className="mt-4 space-y-2">
                  {(form.attachments || []).map((f, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg border p-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center">
                          {f.type.startsWith("image/") ? (
                            <Image src={attachmentPreviews[i] || "/file-icon.png"} alt={f.name} width={40} height={40} className="object-cover" />
                          ) : (
                            <div className="text-xs text-gray-500">{f.name.split('.').pop()}</div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{f.name}</div>
                          <div className="text-xs text-gray-400">{Math.round(f.size / 1024)} KB</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => removeAttachmentAt(i)} className="px-2 py-1 rounded bg-gray-100 text-sm">
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Advanced settings */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800">Advanced</h4>
                <SmallHelp>Extra options to help you get the right candidates.</SmallHelp>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    id="allowOffers"
                    type="checkbox"
                    checked={form.allowOffers}
                    onChange={(e) => updateField("allowOffers", e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="allowOffers" className="text-sm text-gray-600">Allow handymen to submit offers</label>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1">
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  // open preview modal / overlay
                  setPreviewOpen(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full md:w-auto px-6 py-3 rounded-lg bg-white border border-gray-200 text-[#1a1a1a] font-semibold"
              >
                Quick Preview
              </button>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-3 rounded-lg bg-[#D4A574] text-white font-semibold ${submitting ? 'opacity-60' : 'hover:bg-[#B8A565]'}`}
              >
                {submitting ? 'Posting...' : 'Post Job'}
              </button>

              <button
                type="button"
                onClick={() => {
                  // reset form to defaults
                  setForm({
                    title: "",
                    category: "General Handyman",
                    description: "",
                    price: undefined,
                    budgetType: "fixed",
                    estimatedHours: undefined,
                    skills: [],
                    preferredDate: "",
                    preferredTime: "",
                    location: "",
                    attachments: [],
                    contactPhone: "",
                    allowOffers: true,
                  });
                  setAttachmentPreviews([]);
                  setErrors({});
                }}
                className="px-6 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700"
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* --- PREVIEW OVERLAY --- */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-6">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl overflow-auto max-h-[90vh]">
            <div className="p-6 border-b flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Preview Job Post</h3>
                <p className="text-sm text-gray-500 mt-1">Review how your job will appear to handymen.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPreviewOpen(false)} className="px-3 py-2 rounded bg-gray-100">Close</button>
                <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 rounded bg-[#D4A574] text-white">
                  {submitting ? 'Posting...' : 'Confirm & Post'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8A565] flex items-center justify-center text-white text-lg font-bold">
                  {form.title ? form.title.split(' ').slice(0,2).map(s=>s[0]).join('') : 'JP'}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-800">{form.title || 'Untitled Job'}</h2>
                  <div className="text-sm text-gray-500 mt-1">{form.category} • {form.location}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Budget</div>
                  <div className="text-lg font-bold text-gray-800">{form.budgetType === 'negotiable' ? 'Negotiable' : `$${form.price ?? '—'}`}</div>
                  {form.budgetType === 'hourly' && <div className="text-xs text-gray-400">per hour</div>}
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{form.description || 'No description provided.'}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <h5 className="text-sm text-gray-500">Skills</h5>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.skills.length === 0 ? <div className="text-sm text-gray-400">No skills specified</div> : form.skills.map(s => (
                      <div key={s} className="bg-white px-3 py-1 rounded-full border text-sm">{s}</div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h5 className="text-sm text-gray-500">Schedule & Contact</h5>
                  <div className="mt-3 text-sm text-gray-700 space-y-1">
                    <div>Preferred: {form.preferredDate || 'Anytime'} {form.preferredTime ? `at ${form.preferredTime}` : ''}</div>
                    <div>Location: {form.location || 'Not provided'}</div>
                    <div>Phone: {form.contactPhone || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Attachments preview in modal */}
              <div>
                <h5 className="text-sm text-gray-500 mb-2">Attachments</h5>
                {(form.attachments || []).length === 0 ? (
                  <div className="text-sm text-gray-400">No attachments</div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {(form.attachments || []).map((f, i) => (
                      <div key={i} className="rounded-lg overflow-hidden border p-2 bg-white">
                        {f.type.startsWith('image/') ? (
                          <Image src={attachmentPreviews[i] || '/file-icon.png'} alt={f.name} width={400} height={240} className="object-cover w-full h-36" />
                        ) : (
                          <div className="flex items-center justify-center h-36 text-gray-500 text-sm">{f.name}</div>
                        )}
                        <div className="mt-2 text-xs text-gray-500">{f.name} • {Math.round(f.size / 1024)} KB</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle size={18} className="text-green-500" />
                <div className="text-sm text-gray-600">Tips: Add photos of the area, note locks/parking, and list what tools are required.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility footer small help */}
      <div className="max-w-4xl mx-auto mt-6 text-xs text-gray-400 text-center">By posting a job you agree to our <a className="text-[#D4A574]">terms</a> and <a className="text-[#D4A574]">community guidelines</a>.</div>
    </div>
  );
}
