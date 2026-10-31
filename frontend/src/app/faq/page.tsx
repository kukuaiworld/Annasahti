"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, ShieldCheck, Heart, Search } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { PUBLIC_FAQS } from "@/data/demoData";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFaqs = PUBLIC_FAQS.filter(
    (item) =>
      item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Breadcrumbs items={[{ label: "Frequently Asked Questions" }]} />

      {/* Header */}
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Knowledge Base
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          Learn about our FSSAI safety procedures, Good Samaritan immunity, matching algorithms,
          and how different entities participate in the AnnaSathi network.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mb-10">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions (e.g. safety, liability, animal shelters, ESG)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="max-w-4xl space-y-4 mb-16">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
            No questions matched your search query. Try another keyword or contact our team directly.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition"
                >
                  <span className="font-bold text-slate-900 text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-brand-600" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Help Banner */}
      <div className="max-w-4xl bg-brand-50 border border-brand-200 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-brand-950">Still have questions?</h3>
          <p className="text-xs text-brand-800 mt-1">
            Our central safety directorate and city leads are available around the clock.
          </p>
        </div>
        <a
          href="/contact"
          className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition shrink-0"
        >
          Contact Our Helpline
        </a>
      </div>
    </div>
  );
}
