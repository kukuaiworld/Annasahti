import VolunteerSidebar from "@/components/volunteer/VolunteerSidebar";

export default function VolunteerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <VolunteerSidebar />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
