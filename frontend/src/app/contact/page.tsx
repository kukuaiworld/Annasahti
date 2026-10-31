"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, AlertCircle } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "Delhi NCR",
    category: "Emergency Surplus Pickup",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        city: "Delhi NCR",
        category: "Emergency Surplus Pickup",
        message: "",
      });
    }, 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Breadcrumbs items={[{ label: "Contact Us" }]} />

      {/* Header */}
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          24/7 Dispatch & Support
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
          Get in Touch With AnnaSathi
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          Need an emergency banquet surplus pickup within the hour? Interested in registering your orphanage
          or joining our corporate sustainability network? Reach out below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
        {/* Contact Info & Hotlines (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Emergency Hotline Card */}
          <div className="bg-red-50 border border-red-200 p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span>24/7 Emergency Surplus Hotline</span>
            </div>
            <div className="text-2xl font-black text-slate-900">+91 1800-ANNASATHI</div>
            <p className="text-xs text-slate-600">
              For event catering surplus exceeding 50kg requiring immediate vehicle dispatch before 3:00 AM.
            </p>
          </div>

          {/* Regional Hubs */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">City Operations Hubs</h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Delhi NCR Hub:</strong>
                  <p>Plot 42, Okhla Industrial Area Phase III, New Delhi 110020</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Bengaluru Hub:</strong>
                  <p>8th Main, Koramangala 4th Block, Bengaluru, Karnataka 560034</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Mumbai Hub:</strong>
                  <p>Sector 19, Vashi APMC Commercial Complex, Navi Mumbai 400703</p>
                </div>
              </div>
            </div>
          </div>

          {/* Email Card */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Mail className="w-4 h-4 text-brand-600" />
              <span>Direct Inquiries</span>
            </div>
            <p className="text-slate-600">General: help@annasathi.org</p>
            <p className="text-slate-600">Corporate CSR: partnerships@annasathi.org</p>
          </div>
        </div>

        {/* Contact Form (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Send Dispatch or Partnership Inquiry</h3>
            <p className="text-xs text-slate-500 mb-6">Our automated dispatch coordinator will respond promptly.</p>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-center space-y-2 animate-fade-in">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-base">Inquiry Dispatched Successfully!</h4>
                <p className="text-xs text-emerald-700">
                  A city dispatch manager has been assigned. You will receive an SMS confirmation at {formData.phone || "your number"}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Chandra"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98000 00000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="name@organization.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Operational City</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                      <option>Delhi NCR</option>
                      <option>Bengaluru</option>
                      <option>Mumbai</option>
                      <option>Hyderabad</option>
                      <option>Chennai</option>
                      <option>Other Region</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option>Emergency Surplus Pickup (Banquet / Hotel)</option>
                    <option>New Shelter / Orphanage Registration</option>
                    <option>Volunteer Fleet Driver Sign-up</option>
                    <option>Corporate CSR & ESG Partnership</option>
                    <option>Gaushala / Animal Shelter Feed Supply</option>
                    <option>BioCNG / Industrial Compost Processing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Message & Pickup Details</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details such as approximate quantity in kg, dietary type (veg/non-veg), location address, and pickup cutoff time..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmit Inquiry to Dispatch Desk</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
