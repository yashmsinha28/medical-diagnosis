import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import ROICalculator from "@/components/ROICalculator";
import DashboardSandbox from "@/components/DashboardSandbox";
import SecurityMatrix from "@/components/SecurityMatrix";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <ROICalculator />
      <DashboardSandbox />
      <SecurityMatrix />
      <Testimonials />
      <CTASection />
      <Footer />
    </main>
  );
}
