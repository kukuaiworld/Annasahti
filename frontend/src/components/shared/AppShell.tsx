"use client";

import { usePathname } from "next/navigation";
import PublicNavbar from "../public/PublicNavbar";
import PublicFooter from "../public/PublicFooter";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Role portal routes have their own full-screen layouts with dedicated sidebars & headers
  const isRolePortal =
    pathname.startsWith("/donor") ||
    pathname.startsWith("/volunteer") ||
    pathname.startsWith("/recipient") ||
    pathname.startsWith("/animal-welfare") ||
    pathname.startsWith("/processor") ||
    (pathname.startsWith("/admin") && pathname !== "/admin/login");

  if (isRolePortal) {
    return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
