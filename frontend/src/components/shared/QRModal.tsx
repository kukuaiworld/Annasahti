"use client";

import { X, QrCode, Download, Printer, Check, Copy } from "lucide-react";
import { useState } from "react";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  code: string;
  details?: {
    donor: string;
    items: string;
    servings: number;
    weight: string;
    tier?: string;
  };
}

export default function QRModal({ isOpen, onClose, title, code, details }: QRModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-brand-50 border border-brand-200 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Scan to verify cold-chain, FSSAI compliance & distribution status
        </p>

        {/* Real QR SVG generator */}
        <div className="bg-slate-50 border-2 border-dashed border-brand-300 p-4 rounded-xl inline-block mx-auto mb-4">
          {/* Real QR Code image via QR API */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              code
            )}&color=166534`}
            alt={`QR Code ${code}`}
            className="w-44 h-44 rounded-lg shadow-sm mx-auto"
          />
          <div className="mt-2 text-xs font-mono font-bold text-brand-800 tracking-wider">
            {code}
          </div>
        </div>

        {details && (
          <div className="text-left bg-slate-50 p-3 rounded-lg text-xs space-y-1 mb-4 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Source:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[180px]">{details.donor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payload:</span>
              <span className="font-semibold text-slate-800">{details.weight} ({details.servings} meals)</span>
            </div>
            {details.tier && (
              <div className="flex justify-between">
                <span className="text-slate-500">Safety Tier:</span>
                <span className="font-semibold text-brand-700 capitalize">{details.tier.replace(/_/g, " ")}</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied Code" : "Copy Code"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Tag</span>
          </button>
        </div>
      </div>
    </div>
  );
}
