import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MedBI Enterprise | Enterprise-Grade Clinical Intelligence",
  description:
    "Deploy scalable, high-accuracy machine learning to reduce diagnostic latency, capture high-risk outliers, and combat physician fatigue. Integrated directly into your existing EHR via secure FHIR APIs.",
  keywords: [
    "clinical intelligence",
    "hospital analytics",
    "medical AI",
    "diagnostic support",
    "EHR integration",
    "FHIR API",
    "HIPAA compliant",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-navy-950 text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
