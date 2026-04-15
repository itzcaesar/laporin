// ── app/page.tsx ──
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Footer } from "@/components/layout/Footer";

// Lazy load below-the-fold sections for better initial load performance
const Problem = dynamic(() => import("@/components/sections/Problem").then(mod => ({ default: mod.Problem })), {
  loading: () => <div className="h-screen" />,
});

const HowItWorks = dynamic(() => import("@/components/sections/HowItWorks").then(mod => ({ default: mod.HowItWorks })), {
  loading: () => <div className="h-screen" />,
});

const Features = dynamic(() => import("@/components/sections/Features").then(mod => ({ default: mod.Features })), {
  loading: () => <div className="h-screen" />,
});

const Categories = dynamic(() => import("@/components/sections/Categories").then(mod => ({ default: mod.Categories })), {
  loading: () => <div className="h-screen" />,
});

const Stats = dynamic(() => import("@/components/sections/Stats").then(mod => ({ default: mod.Stats })), {
  loading: () => <div className="h-screen" />,
});

const Testimonials = dynamic(() => import("@/components/sections/Testimonials").then(mod => ({ default: mod.Testimonials })), {
  loading: () => <div className="h-screen" />,
});

const StatusFlow = dynamic(() => import("@/components/sections/StatusFlow").then(mod => ({ default: mod.StatusFlow })), {
  loading: () => <div className="h-screen" />,
});

const FinalCTA = dynamic(() => import("@/components/sections/FinalCTA").then(mod => ({ default: mod.FinalCTA })), {
  loading: () => <div className="h-32" />,
});

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <Categories />
        <Stats />
        <Testimonials />
        <StatusFlow />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
