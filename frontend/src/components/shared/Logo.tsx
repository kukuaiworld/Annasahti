import Image from "next/image";
import Link from "next/link";

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
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Emblem */}
      <div className={`${iconSizes[size]} shrink-0 transition-transform hover:scale-105 duration-200`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-icon.svg"
          alt="AnnaSathi Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {variant !== "icon" && (
        <div>
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight ${textSizes[size]} ${
                variant === "white" ? "text-white" : "text-slate-900"
              }`}
            >
              Anna<span className="text-brand-500">Sathi</span>
            </span>
            <span
              className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                variant === "white"
                  ? "bg-slate-800 text-brand-300"
                  : "bg-brand-100 text-brand-800"
              }`}
            >
              2.0
            </span>
          </div>
          <p
            className={`text-[10px] tracking-wider uppercase font-semibold leading-tight mt-1 ${
              variant === "white" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Smart Food Rescue
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
