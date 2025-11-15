"use client";

import dynamic from "next/dynamic";

// Loader موحد
function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
      Loading...
    </div>
  );
}

// ✅ Dynamic imports مع fallback
const Hero = dynamic(() => import("@/shared/components/landing/Hero"), {
  ssr: false,
  loading: () => <Loader />,
});
const Features = dynamic(() => import("@/shared/components/landing/Features"), {
  ssr: false,
  loading: () => <Loader />,
});
const Testimonials = dynamic(() => import("@/shared/components/landing/Testimonials"), {
  ssr: false,
  loading: () => <Loader />,
});
const CallToAction = dynamic(() => import("@/shared/components/landing/CallToAction"), {
  ssr: false,
  loading: () => <Loader />,
});

export default function LandingPageClient() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <Features />
      <Testimonials />
      <CallToAction />
    </div>
  );
}
