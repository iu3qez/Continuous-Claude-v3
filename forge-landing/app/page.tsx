import AgencyHeroSection from "@/components/shadcn-space/blocks/hero-01";
import Features from "./components/features";
import Pricing from "./components/pricing";
import Footer from "./components/footer";

export default function Home() {
  return (
    <main>
      <AgencyHeroSection />
      <Features />
      <Pricing />
      <Footer />
    </main>
  );
}
