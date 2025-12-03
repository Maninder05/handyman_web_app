"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "../../../components/handyHeader";
import { getGuideBySlug, guidesData } from "../guidesData";

export default function GuidePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const guide = getGuideBySlug(slug);

  const handleLogout = () => router.push("/");

  if (!guide) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F8F8] via-white to-[#FFF8F2]">
        <Header pageTitle="Guide Not Found" onLogout={handleLogout} />
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-[#5C4033] mb-4">Guide Not Found</h1>
          <p className="text-[#5C4033]/70 mb-8">The guide you're looking for doesn't exist.</p>
          <Link
            href="/mutual/support"
            className="inline-block px-6 py-3 bg-[#D4A574] text-[#5C4033] font-bold rounded-xl hover:bg-[#C4956A] transition"
          >
            Back to Help Center
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F8F8] via-white to-[#FFF8F2]">
      <Header pageTitle={guide.title} onLogout={handleLogout} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[#5C4033]/70">
            <Link href="/mutual/support" className="hover:text-[#D4A574] transition">
              Help Center
            </Link>
            <span>/</span>
            <Link href="/mutual/guides" className="hover:text-[#D4A574] transition">
              Guides
            </Link>
            <span>/</span>
            <span className="text-[#5C4033]">{guide.title}</span>
          </div>
        </nav>

        {/* Header Image */}
        <div className="relative w-full h-64 sm:h-96 rounded-2xl overflow-hidden mb-8 shadow-lg">
          <Image
            src={guide.image}
            alt={guide.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-[#D4A574]/20 text-[#5C4033] text-xs font-semibold rounded-full">
              {guide.category}
            </span>
            <span className="text-sm text-[#5C4033]/60">{guide.duration} read</span>
            <span className="text-sm text-[#5C4033]/60">•</span>
            <span className="text-sm text-[#5C4033]/60">{guide.views} views</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#5C4033] mb-4">
            {guide.title}
          </h1>
          <p className="text-xl text-[#5C4033]/80">
            {guide.description}
          </p>
        </header>

        {/* Article Content */}
        <article className="prose prose-lg max-w-none">
          {/* Introduction */}
          <div className="mb-8 p-6 bg-white rounded-2xl border-2 border-[#EED9C4] shadow-md">
            <p className="text-lg text-[#5C4033]/90 leading-relaxed">
              {guide.content.intro}
            </p>
          </div>

          {/* Sections */}
          {guide.content.sections.map((section, index) => (
            <div key={index} className="mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#5C4033] mb-4">
                {section.title}
              </h2>
              
              {section.image && (
                <div className="relative w-full h-64 rounded-xl overflow-hidden mb-6">
                  <Image
                    src={section.image}
                    alt={section.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <p className="text-base text-[#5C4033]/80 leading-relaxed mb-4">
                {section.content}
              </p>

              {section.steps && (
                <ol className="space-y-4 mb-6">
                  {section.steps.map((step, stepIndex) => (
                    <li
                      key={stepIndex}
                      className="flex items-start gap-4 p-4 bg-white rounded-xl border-2 border-[#EED9C4]"
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4A574] text-[#5C4033] font-bold text-sm flex items-center justify-center">
                        {stepIndex + 1}
                      </span>
                      <span className="text-[#5C4033]/80 flex-1 pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}

          {/* Conclusion */}
          <div className="mt-12 p-6 bg-gradient-to-br from-[#D4A574] to-[#C4956A] rounded-2xl shadow-lg">
            <p className="text-lg text-[#5C4033] font-semibold leading-relaxed">
              {guide.content.conclusion}
            </p>
          </div>
        </article>

        {/* Related Guides */}
        <section className="mt-16 pt-8 border-t-2 border-[#EED9C4]">
          <h2 className="text-2xl font-bold text-[#5C4033] mb-6">Related Guides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {guidesData
              .filter(g => g.id !== guide.id && (g.role === guide.role || g.role === "all"))
              .slice(0, 2)
              .map((relatedGuide) => (
                <Link
                  key={relatedGuide.id}
                  href={`/mutual/guides/${relatedGuide.slug}`}
                  className="p-4 bg-white rounded-xl border-2 border-[#EED9C4] hover:border-[#D4A574] hover:shadow-lg transition"
                >
                  <h3 className="font-bold text-[#5C4033] mb-2">{relatedGuide.title}</h3>
                  <p className="text-sm text-[#5C4033]/70">{relatedGuide.description}</p>
                </Link>
              ))}
          </div>
        </section>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Link
            href="/mutual/support"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4A574] text-[#5C4033] font-bold rounded-xl hover:bg-[#C4956A] transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Help Center
          </Link>
        </div>
      </main>
    </div>
  );
}