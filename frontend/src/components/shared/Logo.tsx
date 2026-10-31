import Link from "next/link";
import { RefreshCw, Leaf } from "lucide-react";

interface LogoProps {
  variant?: "full" | "icon" | "white";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

export default function Logo({
  variant = "full",
  size = "md",
  href = "/",
  className = "",
}: LogoProps) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* FoodLoop Loop Emblem */}
      <div
        className={`${iconSizes[size]} rounded-2xl bg-gradient-to-br from-brand-600 to-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-brand-600/20 transition-transform hover:scale-105 duration-200`}
      >
        <Leaf className="w-5 h-5 text-emerald-100" />
      </div>

      {variant !== "icon" && (
        <div>
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight ${textSizes[size]} ${
                variant === "white" ? "text-white" : "text-slate-900"
              }`}
            >
              Food<span className="text-brand-600">Loop</span>
            </span>
            <span
              className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded tracking-wider ${
                variant === "white"
                  ? "bg-slate-800 text-brand-300"
                  : "bg-brand-50 text-brand-700 border border-brand-200"
              }`}
            >
              Rescue
            </span>
          </div>
          <p
            className={`text-[9px] tracking-wider uppercase font-bold leading-tight mt-1 ${
              variant === "white" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Food Rescue & Recovery
          </p>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
