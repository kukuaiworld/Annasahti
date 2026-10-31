"use client";

import { useState } from "react";
import { Award, Download, CheckCircle2, ShieldCheck, Printer, Calendar } from "lucide-react";
import DonorHeader from "@/components/donor/DonorHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function DonorCertificatesPage() {
  const [downloadedCert, setDownloadedCert] = useState<string | null>(null);

  const certificates = [
    {
      id: "CERT-2026-Q3",
      title: "Q3 2026 BRSR ESG Carbon Offset Certificate",
      period: "July 1 - Sept 30, 2026",
      kg: "2,470 kg Surplus Food",
      co2: "5.92 Metric Tons CO₂e",
      beneficiaries: "6,600 meals served",
      status: "Verified & Digitally Signed",
    },
    {
      id: "CERT-2026-Q2",
      title: "Q2 2026 BRSR ESG Carbon Offset Certificate",
      period: "April 1 - June 30, 2026",
      kg: "1,810 kg Surplus Food",
      co2: "4.34 Metric Tons CO₂e",
      beneficiaries: "4,850 meals served",
      status: "Verified & Digitally Signed",
    },
    {
      id: "CERT-FSSAI-ANNUAL",
      title: "Annual Good Samaritan Food Recovery Immunity Seal",
      period: "Calendar Year 2026",
      kg: "All verified consignments",
      co2: "Zero-landfill compliance",
      beneficiaries: "Legal protection certificate",
      status: "Active Standing",
    },
  ];

  const handleDownload = (id: string) => {
    setDownloadedCert(id);
    setTimeout(() => setDownloadedCert(null), 3000);
  };

  return (
    <div className="flex-1 flex flex-col">
      <DonorHeader
        title="Official ESG & Carbon Offset Certificates"
        subtitle="Download verifiable documentation for corporate sustainability disclosures"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-5xl">
        <Breadcrumbs items={[{ label: "Donor Portal", href: "/donor/dashboard" }, { label: "ESG Certificates" }]} />

        <div className="bg-gradient-to-r from-brand-700 to-emerald-800 text-white p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-200">
              Cryptographically Stamped
            </span>
            <h3 className="text-xl font-bold">Grand Heritage Banquets & Caterers</h3>
            <p className="text-xs text-brand-100">
              Designated as a 5-Star Zero Food Waste Kitchen by the AnnaSathi Central Directorate.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-white text-brand-900 rounded-xl text-xs font-bold hover:bg-brand-50 transition shadow shrink-0 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Annual Summary</span>
          </button>
        </div>

        {/* Certificate Cards */}
        <div className="space-y-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                    {cert.id}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{cert.status}</span>
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-base">{cert.title}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                  <span>Period: {cert.period}</span>
                  <span>•</span>
                  <span>{cert.kg}</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">{cert.co2}</span>
                </div>
              </div>

              <div>
                {downloadedCert === cert.id ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Downloaded!</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleDownload(cert.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
