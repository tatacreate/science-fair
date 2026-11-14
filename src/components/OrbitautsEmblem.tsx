import React from 'react';

export interface HelioMedEmblemProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const HelioMedEmblem: React.FC<HelioMedEmblemProps> = ({ size = 'md', showSubtitle = true }) => {
  const dimension = size === 'sm' ? 'w-20 h-20' : size === 'lg' ? 'w-44 h-44' : 'w-28 h-28';

  return (
    <div className="flex items-center gap-3">
      {/* Medallion SVG */}
      <div className={`relative ${dimension} flex-shrink-0 drop-shadow-2xl select-none group`}>
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <defs>
            {/* Antique Metallic Patina Gradients */}
            <radialGradient id="brassOuterGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#eab308" />
              <stop offset="35%" stopColor="#ca8a04" />
              <stop offset="70%" stopColor="#854d0e" />
              <stop offset="100%" stopColor="#451a03" />
            </radialGradient>

            <radialGradient id="bronzeInnerGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            <linearGradient id="goldBannerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="30%" stopColor="#eab308" />
              <stop offset="70%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#713f12" />
            </linearGradient>

            <linearGradient id="rocketBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="40%" stopColor="#cbd5e1" />
              <stop offset="70%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            <linearGradient id="thrusterFire" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="40%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
            </linearGradient>

            {/* Canvas Texture Pattern */}
            <filter id="metalNoise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0" />
              <feComposite in2="SourceGraphic" in="gl" operator="in" />
            </filter>
          </defs>

          {/* Outer Brass Riveted Shield / Ring */}
          <circle cx="200" cy="200" r="190" fill="url(#brassOuterGrad)" stroke="#291e0a" strokeWidth="5" />
          <circle cx="200" cy="200" r="176" fill="none" stroke="#fef08a" strokeWidth="2" strokeDasharray="6 4" opacity="0.75" />

          {/* Outer Rivets (16 bolts around the perimeter) */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 360) / 16;
            const rad = (angle * Math.PI) / 180;
            const rx = 200 + 183 * Math.cos(rad);
            const ry = 200 + 183 * Math.sin(rad);
            return (
              <g key={i}>
                <circle cx={rx} cy={ry} r="3.5" fill="#fde047" stroke="#451a03" strokeWidth="1" />
                <circle cx={rx - 1} cy={ry - 1} r="1" fill="#fff" opacity="0.6" />
              </g>
            );
          })}

          {/* Inner Dial Base */}
          <circle cx="200" cy="200" r="165" fill="url(#bronzeInnerGrad)" stroke="#ca8a04" strokeWidth="3" />

          {/* Antique Compass Rose Background */}
          <g opacity="0.45" stroke="#ca8a04" strokeWidth="1.2">
            <line x1="200" y1="45" x2="200" y2="355" />
            <line x1="45" y1="200" x2="355" y2="200" />
            <line x1="90" y1="90" x2="310" y2="310" strokeDasharray="3 3" />
            <line x1="90" y1="310" x2="310" y2="90" strokeDasharray="3 3" />

            {/* Compass Star Points */}
            <polygon points="200,60 206,170 200,160 194,170" fill="#eab308" opacity="0.8" />
            <polygon points="200,340 206,230 200,240 194,230" fill="#ca8a04" opacity="0.8" />
            <polygon points="340,200 230,206 240,200 230,194" fill="#eab308" opacity="0.8" />
            <polygon points="60,200 170,206 160,200 170,194" fill="#ca8a04" opacity="0.8" />

            <circle cx="200" cy="200" r="135" fill="none" stroke="#854d0e" strokeWidth="1" strokeDasharray="4 2" />
            <circle cx="200" cy="200" r="95" fill="none" stroke="#eab308" strokeWidth="1" opacity="0.5" />
          </g>

          {/* Transparent Mathematical Physics Equations (Ghost-like etches) */}
          <g opacity="0.32" fill="#38bdf8" fontFamily="monospace" fontSize="11" fontWeight="bold">
            <text x="75" y="130">Δv = ve · ln(m₀/mf)</text>
            <text x="215" y="115">F = G·(m₁m₂)/r²</text>
            <text x="65" y="275">v = √(GM/r)</text>
            <text x="220" y="290">P_AO₂ = (P_B - 47)·FiO₂</text>
            <text x="140" y="85" fontSize="9" opacity="0.6">ORBITAL MECHANICS &amp; FLIGHT BIO</text>
          </g>

          {/* Cardinal Directions */}
          <text x="200" y="55" fill="#fde047" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="serif">N</text>
          <text x="200" y="352" fill="#ca8a04" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="serif">S</text>
          <text x="350" y="204" fill="#ca8a04" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="serif">E</text>
          <text x="50" y="204" fill="#ca8a04" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="serif">W</text>

          {/* Thruster Plume */}
          <polygon points="195,275 205,275 200,325" fill="url(#thrusterFire)" />
          <polygon points="192,275 208,275 200,305" fill="#e0f2fe" opacity="0.75" />

          {/* Central Classical Retro-Futuristic Rocket */}
          <g transform="translate(200, 205)">
            {/* Rocket Fins */}
            <polygon points="-38,60 -52,72 -22,64" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1.5" />
            <polygon points="38,60 52,72 22,64" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1.5" />
            <polygon points="0,55 -8,72 0,68 8,72" fill="#b91c1c" />

            {/* Rocket Main Hull */}
            <path
              d="M 0,-85 C 24,-50 28,30 22,65 L -22,65 C -28,30 -24,-50 0,-85 Z"
              fill="url(#rocketBodyGrad)"
              stroke="#334155"
              strokeWidth="2"
            />

            {/* Nose Cone Accent */}
            <path d="M 0,-85 C 12,-65 14,-50 0,-50 C -14,-50 -12,-65 0,-85 Z" fill="#dc2626" />

            {/* Porthole Window with Specular Glint */}
            <circle cx="0" cy="-20" r="13" fill="#0284c7" stroke="#eab308" strokeWidth="2.5" />
            <circle cx="-3" cy="-23" r="4" fill="#fff" opacity="0.8" />
            <circle cx="0" cy="-20" r="10" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 2" />

            {/* Hull Rivets & Paneling */}
            <line x1="-20" y1="10" x2="20" y2="10" stroke="#64748b" strokeWidth="1.2" />
            <line x1="-22" y1="38" x2="22" y2="38" stroke="#64748b" strokeWidth="1.2" />
            <circle cx="-16" cy="10" r="1.5" fill="#475569" />
            <circle cx="16" cy="10" r="1.5" fill="#475569" />
            <circle cx="-18" cy="38" r="1.5" fill="#475569" />
            <circle cx="18" cy="38" r="1.5" fill="#475569" />

            {/* Mission Stripes */}
            <rect x="-18" y="44" width="36" height="5" fill="#0284c7" />
            <rect x="-16" y="52" width="32" height="3" fill="#ca8a04" />
          </g>

          {/* Lower Curved Brass Nameplate Banner */}
          <path
            d="M 65,305 Q 200,345 335,305 L 345,335 Q 200,380 55,335 Z"
            fill="url(#goldBannerGrad)"
            stroke="#451a03"
            strokeWidth="3"
          />

          {/* Banner Text 1: HELIOMED */}
          <text
            x="200"
            y="330"
            fill="#1c1204"
            fontFamily="serif"
            fontSize="18"
            fontWeight="900"
            letterSpacing="3"
            textAnchor="middle"
          >
            HELIOMED
          </text>

          {/* Subordinate Plate: AUTONOMOUS HEALTH */}
          <path
            d="M 120,345 Q 200,365 280,345 L 285,365 Q 200,388 115,365 Z"
            fill="#451a03"
            stroke="#eab308"
            strokeWidth="1.5"
          />
          <text
            x="200"
            y="360"
            fill="#fef08a"
            fontFamily="monospace"
            fontSize="10"
            fontWeight="bold"
            letterSpacing="2"
            textAnchor="middle"
          >
            DEEP SPACE CLINICAL
          </text>
        </svg>
      </div>

      {showSubtitle && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-serif font-black tracking-widest text-amber-400 uppercase">
              HelioMed
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Autonomous Medical Station
          </span>
        </div>
      )}
    </div>
  );
};

export const VitaluatsEmblem = HelioMedEmblem;
export const OrbitautsEmblem = HelioMedEmblem;
