import React from "react";
import { cn } from "../../lib/utils";

export function BrandLogo({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/10 overflow-hidden select-none",
        className
      )}
      aria-label="Radio Hargeysa logo"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#E7E9EC" strokeWidth="2" />
        {/* Top green arc */}
        <path d="M 10 38 A 42 42 0 0 1 90 38 L 90 42 L 10 42 Z" fill="#047422" />
        {/* Bottom red arc */}
        <path d="M 10 64 L 90 64 L 90 68 A 42 42 0 0 1 10 68 Z" fill="#C40D0F" />
        {/* White center band */}
        <rect x="6" y="39" width="88" height="26" fill="#FFFFFF" />
        {/* RH monogram */}
        <text
          x="50"
          y="59"
          textAnchor="middle"
          fill="#050505"
          fontFamily="Georgia, serif"
          fontWeight="700"
          fontSize="24"
          letterSpacing="-1"
        >
          RH
        </text>
        {/* 1942 in bottom red band */}
        <text
          x="50"
          y="83"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Manrope, sans-serif"
          fontWeight="800"
          fontSize="11"
          letterSpacing="1.5"
        >
          1942
        </text>
      </svg>
    </div>
  );
}
