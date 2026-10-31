import AnimalWelfareSidebar from "@/components/animal-welfare/AnimalWelfareSidebar";

export default function AnimalWelfareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <AnimalWelfareSidebar />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
