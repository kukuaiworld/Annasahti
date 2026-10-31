import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/shared/AppShell";
import { AuthProvider } from "@/providers/auth-provider";

export const metadata: Metadata = {
  title: "FoodLoop | Food Rescue & Recovery Platform",
  description:
    "FoodLoop connects food donors, verified recipient organizations, volunteers and authorized waste processors to ensure zero edible food waste with strict food-safety compliance.",
  icons: {
    icon: "/favicon.svg",
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
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
