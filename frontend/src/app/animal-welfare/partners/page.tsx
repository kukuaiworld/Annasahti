"use client";

import { Building, PawPrint, MapPin, Phone, ShieldCheck } from "lucide-react";
import AnimalWelfareHeader from "@/components/animal-welfare/AnimalWelfareHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function AnimalWelfarePartnersPage() {
  const partners = [
    {
      name: "Shri Krishna Gaushala & Sanctuary",
      city: "Delhi NCR (Bawana Road)",
      animals: "42 Rescued Dairy Cattle",
      contact: "+91 98290 11223",
      feedType: "Vegetable trimmings, grain mash, ripe melons",
      status: "Verified Partner",
    },
    {
      name: "Pawsitive Haven Stray Dog Care",
      city: "South Delhi (Chhatarpur)",
      animals: "65 Rescued Stray Dogs & Puppies",
      contact: "+91 98110 55442",
      feedType: "Boiled rice & unseasoned chicken broth",
      status: "Verified Partner",
    },
    {
      name: "Karuna Cattle Sanctuary",
      city: "Bengaluru Rural (Nelamangala)",
      animals: "110 Rescued Bullocks & Calves",
      contact: "+91 99002 44331",
      feedType: "Stale bakery loaves & wholesale fruit peels",
      status: "Verified Partner",
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <AnimalWelfareHeader
        title="Verified Gaushalas & Animal Sanctuaries"
        subtitle="Network of accredited non-profit animal rescue centers receiving Tier-3 surplus"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-5xl">
        <Breadcrumbs items={[{ label: "Animal Welfare", href: "/animal-welfare/dashboard" }, { label: "Partner Sanctuaries" }]} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {partners.map((p, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <PawPrint className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
              <p className="text-xs text-slate-500">{p.city}</p>

              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 border border-slate-200">
                <p><strong>Capacity:</strong> {p.animals}</p>
                <p><strong>Feed Mix:</strong> {p.feedType}</p>
                <p><strong>Phone:</strong> {p.contact}</p>
              </div>

              <div className="pt-2 text-emerald-600 font-semibold text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
