import React from 'react';

export const CuteTomPlaceholder = ({ className = "w-full h-full" }) => {
  return (
    <div className={`relative flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 via-sky-50 to-emerald-50 select-none overflow-hidden ${className}`}>
      
      {/* Background soft sunbeams/glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.9),transparent_70%)] pointer-events-none"></div>

      <svg
        viewBox="0 0 240 180"
        className="w-full h-full max-h-40 max-w-[200px] drop-shadow-sm transition-transform duration-300 hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Shadow under Tom */}
        <ellipse cx="120" cy="165" rx="55" ry="8" fill="#cbd5e1" opacity="0.6" />

        {/* Tail */}
        <path
          d="M65 145 C 45 135, 40 105, 55 95 C 60 90, 68 95, 62 105 C 52 118, 62 135, 75 140 Z"
          fill="#5a7184"
        />
        {/* Tail White Tip */}
        <path
          d="M55 95 C 60 90, 68 95, 62 105 C 56 100, 53 96, 55 95 Z"
          fill="#f8fafc"
        />

        {/* Body */}
        <ellipse cx="120" cy="138" rx="42" ry="32" fill="#627d98" />
        {/* White Chest/Belly */}
        <ellipse cx="120" cy="140" rx="26" ry="24" fill="#f8fafc" />

        {/* Left Ear */}
        <polygon points="85,68 68,25 105,45" fill="#627d98" stroke="#486581" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="85,64 74,34 99,48" fill="#f472b6" opacity="0.85" />

        {/* Right Ear */}
        <polygon points="155,68 172,25 135,45" fill="#627d98" stroke="#486581" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="155,64 166,34 141,48" fill="#f472b6" opacity="0.85" />

        {/* Head */}
        <circle cx="120" cy="72" r="38" fill="#627d98" />

        {/* Cheeks Fluff */}
        <path d="M82 72 Q 74 76 80 82 Q 72 86 82 92 Z" fill="#627d98" />
        <path d="M158 72 Q 166 76 160 82 Q 168 86 158 92 Z" fill="#627d98" />

        {/* White Muzzle */}
        <ellipse cx="111" cy="82" rx="12" ry="10" fill="#f8fafc" />
        <ellipse cx="129" cy="82" rx="12" ry="10" fill="#f8fafc" />
        <ellipse cx="120" cy="88" rx="14" ry="10" fill="#f8fafc" />

        {/* Eyes: Big Cartoon Friendly Eyes */}
        {/* Left Eye */}
        <ellipse cx="106" cy="64" rx="9" ry="12" fill="#fef08a" stroke="#334155" strokeWidth="1.5" />
        <ellipse cx="108" cy="64" rx="5" ry="8" fill="#0f172a" />
        <circle cx="106" cy="60" r="2.5" fill="#ffffff" />
        <circle cx="109" cy="67" r="1.2" fill="#ffffff" />

        {/* Right Eye */}
        <ellipse cx="134" cy="64" rx="9" ry="12" fill="#fef08a" stroke="#334155" strokeWidth="1.5" />
        <ellipse cx="132" cy="64" rx="5" ry="8" fill="#0f172a" />
        <circle cx="130" cy="60" r="2.5" fill="#ffffff" />
        <circle cx="133" cy="67" r="1.2" fill="#ffffff" />

        {/* Cute Eyebrows */}
        <path d="M98 48 Q 106 44 114 47" stroke="#334155" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M142 48 Q 134 44 126 47" stroke="#334155" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Rosy Cheeks */}
        <ellipse cx="88" cy="78" rx="5" ry="3" fill="#fb7185" opacity="0.4" />
        <ellipse cx="152" cy="78" rx="5" ry="3" fill="#fb7185" opacity="0.4" />

        {/* Nose: Cute Pink Triangle */}
        <path d="M116 75 L 124 75 Q 120 81 116 75 Z" fill="#f43f5e" />

        {/* Mouth */}
        <path d="M115 81 Q 120 85 125 81" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M117 84 Q 120 89 123 84" stroke="#e11d48" strokeWidth="1.5" fill="#fda4af" />

        {/* Whiskers */}
        <line x1="72" y1="78" x2="98" y2="79" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="70" y1="86" x2="97" y2="84" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="168" y1="78" x2="142" y2="79" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="170" y1="86" x2="143" y2="84" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />

        {/* Cute Little Paws holding the sign */}
        <ellipse cx="86" cy="118" rx="8" ry="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <ellipse cx="154" cy="118" rx="8" ry="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />

        {/* Signboard held by Tom */}
        <g filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.12))">
          {/* Signboard Outer Box */}
          <rect x="52" y="112" width="136" height="42" rx="10" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
          
          {/* Inner accent dashed line */}
          <rect x="56" y="116" width="128" height="34" rx="7" fill="#f0fdf4" stroke="#a7f3d0" strokeWidth="1" strokeDasharray="3 2" />

          {/* Signboard Text */}
          <text x="120" y="131" textAnchor="middle" fill="#065f46" fontSize="10.5" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.2">
            NO PICTURE AVAILABLE
          </text>
          <text x="120" y="143" textAnchor="middle" fill="#047857" fontSize="8.5" fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif">
            🐾 Click Edit to Upload Photo
          </text>
        </g>
      </svg>

      {/* Playful subtle caption below */}
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 opacity-80">
        Cute Tom: Awaiting Produce Photo
      </span>
    </div>
  );
};
