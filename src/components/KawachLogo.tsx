import React from 'react';

interface KawachLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showText?: boolean;
  subtitle?: string;
  animated?: boolean;
  className?: string;
}

export const KawachLogo: React.FC<KawachLogoProps> = ({
  size = 'md',
  showText = false,
  subtitle,
  animated = true,
  className = ''
}) => {
  const sizeMap = {
    xs: { box: 28, text: 'text-sm', badge: 'text-[9px]' },
    sm: { box: 36, text: 'text-base', badge: 'text-[10px]' },
    md: { box: 48, text: 'text-xl', badge: 'text-xs' },
    lg: { box: 64, text: 'text-2xl', badge: 'text-xs' },
    xl: { box: 88, text: 'text-3xl', badge: 'text-sm' },
    hero: { box: 120, text: 'text-4xl', badge: 'text-base' }
  };

  const { box, text, badge } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Insane Holographic Cyber-Shield Emblem */}
      <div
        className="relative flex items-center justify-center shrink-0 group cursor-pointer"
        style={{ width: box, height: box }}
      >
        {/* Ambient Bloom / Halo */}
        <div
          className={`absolute -inset-1 rounded-2xl bg-gradient-to-tr from-rose-600 via-amber-500 to-rose-600 opacity-60 blur-md transition-all duration-700 ${
            animated ? 'group-hover:opacity-100 group-hover:scale-110 animate-pulse' : ''
          }`}
        />

        {/* Rotating Outer Orbital Radar Ring */}
        {animated && (
          <div className="absolute -inset-1.5 rounded-full border border-dashed border-rose-500/30 animate-[spin_12s_linear_infinite] pointer-events-none" />
        )}

        {/* Core Shield Vector Artwork */}
        <svg
          viewBox="0 0 100 100"
          className="relative z-10 w-full h-full drop-shadow-[0_10px_20px_rgba(225,29,72,0.45)] transition-transform duration-300 group-hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Holographic metallic shield gradient */}
            <linearGradient id="shieldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff4d6d" />
              <stop offset="40%" stopColor="#e11d48" />
              <stop offset="75%" stopColor="#9f1239" />
              <stop offset="100%" stopColor="#4c0519" />
            </linearGradient>

            {/* Glowing gold/amber edge highlight */}
            <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>

            {/* Inner defense core radial gradient */}
            <radialGradient id="coreGlow" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="25%" stopColor="#fecdd3" stopOpacity="0.8" />
              <stop offset="65%" stopColor="#e11d48" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </radialGradient>

            {/* Cyan telemetry sweep */}
            <linearGradient id="cyberSweep" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Layer 1: Outer Faceted Armor Shield Plate */}
          <path
            d="M50 4 L86 16 C86 52, 70 82, 50 96 C30 82, 14 52, 14 16 Z"
            fill="url(#shieldMetallic)"
            stroke="url(#goldRim)"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />

          {/* Layer 2: Inner Chamfered Bezel Plate */}
          <path
            d="M50 12 L78 22 C78 50, 65 74, 50 86 C35 74, 22 50, 22 22 Z"
            fill="#090d16"
            stroke="#fda4af"
            strokeWidth="1.2"
            strokeOpacity="0.6"
          />

          {/* Layer 3: Concentric Defense Radar Arcs */}
          <path
            d="M50 24 C62 24, 70 34, 70 48 C70 60, 60 70, 50 78 C40 70, 30 60, 30 48 C30 34, 38 24, 50 24 Z"
            fill="url(#coreGlow)"
            stroke="#fb7185"
            strokeWidth="0.8"
            strokeDasharray="3 2"
            opacity="0.9"
          />

          {/* Layer 4: Central Cyber Guardian Star & Hindi Calligraphy Node */}
          <g transform="translate(50, 48)">
            {/* 8-Point Protective Crest */}
            <polygon
              points="0,-18 4,-6 16,-6 7,2 11,14 0,7 -11,14 -7,2 -16,-6 -4,-6"
              fill="#ffffff"
              stroke="#fb7185"
              strokeWidth="1"
            />
            {/* Center Luminous Diamond */}
            <circle cx="0" cy="0" r="3.5" fill="#f43f5e" />
            <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
          </g>

          {/* Layer 5: Modern Protective Crown Arcs */}
          <path
            d="M32 20 L50 8 L68 20"
            stroke="#fef08a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Layer 6: Lower Energy Wing Flares */}
          <path
            d="M32 68 L50 84 L68 68"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
        </svg>

        {/* Live Protection Pulse Dot */}
        <span className="absolute bottom-0 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950" />
        </span>
      </div>

      {/* Typography & Callout */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`font-black tracking-wider uppercase font-display bg-gradient-to-r from-white via-slate-100 to-rose-200 bg-clip-text text-transparent drop-shadow-sm ${text}`}
            >
              KAWACH
            </span>
            <span
              className={`font-extrabold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white shadow-sm shadow-rose-600/30 ${badge}`}
            >
              कवच
            </span>
          </div>
          <span className="text-[10px] font-semibold tracking-wider text-rose-500/90 dark:text-rose-400/90 uppercase font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {subtitle || 'Real-Time Guardian Network · 112 ERSS'}
          </span>
        </div>
      )}
    </div>
  );
};
