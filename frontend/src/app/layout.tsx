import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/shared/AppShell";

export const metadata: Metadata = {
  title: "AnnaSathi 2.0 | Intelligent Surplus Food Recovery & Redistribution Network",
  description:
    "Empowering commercial kitchens, volunteers, orphanages, animal shelters, and bio-energy plants to eliminate surplus food waste with FSSAI safety compliance, live FoodTrace, and AI smart matching.",
  icons: {
    icon: "/favicon.svg",
    apple: "/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-brand-500 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
