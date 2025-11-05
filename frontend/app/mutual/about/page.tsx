"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AboutPage() {
   const router = useRouter();

  return (
    <main className="bg-[#D4A574] min-h-screen text-neutral-100 transition-colors">
      {/* Navbar */}
      <header className="w-full bg-gray-300 border-b border-gray-600 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/images/handy-web-logo.jpg"
              alt="Handyman Logo"
              width={60}
              height={60}
              className="rounded-full"
            />
            <h1 className="text-xl font-bold text-black">
              Handyman Services
            </h1>
          </div>
          <nav className="flex items-center text-black gap-6 text-sm font-medium">
            {/* redirect to landing page */}
            <a href="/" className="hover:text-[#ec830a] transition">
              Home
            </a>
            <a href="#team" className="hover:text-[#ec830a] transition">
              Team
            </a>
            <a href="#story" className="hover:text-[#ec830a] transition">
              Our Story
            </a>
            <a href="#values" className="hover:text-[#ec830a] transition">
              Values
            </a>
          </nav>
        </div>
      </header>

      {/* Our Story */}
      <section id="story" className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold text-gray-300 mb-6">
              Our Story
            </h3>
            <p className="text-black mb-6">
              Handyman Services started with a simple mission: to make home
              repairs stress-free and reliable. Over the years, we've grown
              into a team of skilled professionals trusted by thousands of
              homeowners across Calgary and beyond.
            </p>
            <p className="text-black">
              From quick fixes to major renovations, we combine expertise,
              efficiency, and trust to deliver top-notch service to every
              client.
            </p>
          </div>
          <div className="relative w-full h-80 md:h-96 rounded-xl overflow-hidden shadow-lg hover:shadow-[#FF7E5F]/40 transition">
            <Image
              src="/images/our-story.png"
              alt="Our Story"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Team Member Cards */}
      <section id="team" className="bg-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-center text-black mb-12">
            Meet the Team
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "Joe Kannis", role: "Founder & CEO", img: "/images/ceo.jpg" },
              { name: "Paul Byrenne", role: "Lead Technician", img: "/images/lead-technician.jpg" },
              { name: "Kristine Thomas", role: "Operations Manager", img: "/images/operation-manager.png" },
              { name: "John Doe", role: "Customer Support", img: "/images/customer-support.jpg" },
            ].map((member, i) => (
              <div
                key={i}
                className="group relative bg-neutral-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-[#FF7E5F]/40 transition"
              >
                <div className="relative w-full h-80">
                  <Image
                    src={member.img}
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 text-center">
                  <h4 className="font-semibold text-[#D4A574]">{member.name}</h4>
                  <p className="text-neutral-400 text-sm">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section id="values" className="max-w-7xl mx-auto px-6 py-16">
        <h3 className="text-3xl font-bold text-center text-black mb-12">
          Our Values
        </h3>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-gray-300 rounded-2xl border border-neutral-800 hover:shadow-lg hover:shadow-[#FFCC66]/20 transition">
            <h4 className="font-semibold text-lg text-[#D4A574] mb-2">Trust</h4>
            <p className="text-black text-sm">
              Building long-lasting relationships through honesty and reliability.
            </p>
          </div>
         <div className="p-6 bg-gray-300 rounded-2xl border border-neutral-800 hover:shadow-lg hover:shadow-[#FFCC66]/20 transition">
            <h4 className="font-semibold text-lg text-[#D4A574] mb-2">Quality</h4>
            <p className="text-black text-sm">
              Delivering exceptional service on every project, big or small.
            </p>
          </div>
          <div className="p-6 bg-gray-300 rounded-2xl border border-neutral-800 hover:shadow-lg hover:shadow-[#FFCC66]/20 transition">
            <h4 className="font-semibold text-lg text-[#D4A574] mb-2">Efficiency</h4>
            <p className="text-black text-sm">
              Completing tasks quickly without compromising quality or safety.
            </p>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="bg-gray-300 py-16">
        <div className="max-w-5xl mx-auto text-center text-neutral-900">
          <h3 className="text-3xl font-bold mb-4">Join Our Community</h3>
          <p className="mb-6 text-lg">
            Become a part of the Handyman family and enjoy reliable services at your doorstep.
          </p>
          <a
            onClick={() => router.push("../signup")}
            className="px-8 py-3 rounded-xl text-lg font-medium shadow-lg bg-neutral-900 text-[#D4A574] hover:bg-neutral-800 transition transform hover:scale-105 active:scale-95 active:translate-y-1 cursor-pointer inline-block"
          >
            Sign Up Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-950 text-neutral-400 py-10">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#D4A574]">
              Handyman Services
            </h4>
            <p className="text-sm">
              Reliable fixes at your doorstep. We make home repairs hassle-free with professional service.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#D4A574]">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-[#D4A574]">Home</a></li>
              <li><a href="#team" className="hover:text-[#D4A574]">Team</a></li>
              <li><a href="#story" className="hover:text-[#D4A574]">Our Story</a></li>
              <li><a href="#values" className="hover:text-[#D4A574]">Values</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#D4A574]">Contact</h4>
            <p className="text-sm"> Calgary, AB</p>
            <p className="text-sm"> +1 825-123-4567</p>
            <p className="text-sm">✉ support@handyman.com</p>
          </div>
        </div>
        <div className="text-center mt-8 text-xs text-neutral-500">
          © {new Date().getFullYear()} Handyman Services. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
