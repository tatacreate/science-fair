import React, { useState } from 'react';
import { Maximize2, X, Package } from 'lucide-react';

export type EmergencyToolKey =
  | 'o2_mask_bottle'
  | 'hatch_repress'
  | 'pulse_oximeter'
  | 'fan_boost'
  | 'lioh_scrubber'
  | 'pain_pack_water'
  | 'water_wall_dosimeter'
  | 'spe_attitude_console'
  | 'radiation_kit_r1'
  | 'bungee_footloops'
  | 'glucose_gel_meter'
  | 'electrolyte_water'
  | 'eyewash_saline'
  | 'amsler_ultrasound'
  | 'eye_drops_glasses';

interface ToolMetadata {
  badgeTag: string;
  caption: string;
  accentBorder: string;
  accentBg: string;
}

const TOOL_META: Record<EmergencyToolKey, ToolMetadata> = {
  o2_mask_bottle: {
    badgeTag: 'RACK B2 · GREEN',
    caption: 'Green O2 Cylinder + Clear Seal Mask',
    accentBorder: 'border-emerald-500/60',
    accentBg: 'bg-emerald-950/30',
  },
  hatch_repress: {
    badgeTag: 'BULKHEAD WALL',
    caption: 'Hatch Lock Lever + ECLSS Repress Switch',
    accentBorder: 'border-amber-500/60',
    accentBg: 'bg-amber-950/30',
  },
  pulse_oximeter: {
    badgeTag: 'MED POUCH 1',
    caption: 'Fingertip SpO2 Pulse Oximeter Clip',
    accentBorder: 'border-cyan-500/60',
    accentBg: 'bg-cyan-950/30',
  },
  fan_boost: {
    badgeTag: 'WALL PANEL',
    caption: 'Cabin Fan Boost Switch (Set to 100%)',
    accentBorder: 'border-sky-500/60',
    accentBg: 'bg-sky-950/30',
  },
  lioh_scrubber: {
    badgeTag: 'LOCKER A4',
    caption: 'White LiOH CO2 Air Filter Canister',
    accentBorder: 'border-amber-500/60',
    accentBg: 'bg-amber-950/30',
  },
  pain_pack_water: {
    badgeTag: 'BIN 3-BLUE',
    caption: 'Blue Pain Tablet Strip + 500 mL Water Pouch',
    accentBorder: 'border-indigo-500/60',
    accentBg: 'bg-indigo-950/30',
  },
  water_wall_dosimeter: {
    badgeTag: 'CORE SHELTER',
    caption: 'Water-Wall Cubicle + Clip Badge Dosimeter',
    accentBorder: 'border-cyan-500/60',
    accentBg: 'bg-cyan-950/30',
  },
  spe_attitude_console: {
    badgeTag: 'FLIGHT DECK',
    caption: 'Console Attitude Shield Button (SPE-SHIELD)',
    accentBorder: 'border-amber-500/60',
    accentBg: 'bg-amber-950/30',
  },
  radiation_kit_r1: {
    badgeTag: 'ORANGE POUCH R-1',
    caption: 'Bright Orange Radiation Protection Kit',
    accentBorder: 'border-orange-500/70',
    accentBg: 'bg-orange-950/35',
  },
  bungee_footloops: {
    badgeTag: 'CABIN FLOOR',
    caption: 'Restraint Bungee Strap & Floor Footloops',
    accentBorder: 'border-sky-500/60',
    accentBg: 'bg-sky-950/30',
  },
  glucose_gel_meter: {
    badgeTag: 'GLUCOSE PACK',
    caption: 'Orange 15g Sugar Gel Tube + Finger Meter',
    accentBorder: 'border-orange-500/70',
    accentBg: 'bg-orange-950/35',
  },
  electrolyte_water: {
    badgeTag: 'HYDRATION PACK',
    caption: 'Salt Electrolyte Packet + 500 mL Water Pouch',
    accentBorder: 'border-cyan-500/60',
    accentBg: 'bg-cyan-950/30',
  },
  eyewash_saline: {
    badgeTag: 'AIRLOCK MED KIT',
    caption: 'Curved Eyewash Cup + Saline Flush Bottle',
    accentBorder: 'border-sky-500/60',
    accentBg: 'bg-sky-950/30',
  },
  amsler_ultrasound: {
    badgeTag: 'EYE EXAM KIT',
    caption: 'Amsler Eye Grid Card + Ultrasound Wand',
    accentBorder: 'border-indigo-500/60',
    accentBg: 'bg-indigo-950/30',
  },
  eye_drops_glasses: {
    badgeTag: 'VISION RELIEF',
    caption: 'Lubricating Eye Dropper OR +1.25D Glasses',
    accentBorder: 'border-emerald-500/60',
    accentBg: 'bg-emerald-950/30',
  },
};

function renderToolSvg(toolKey: EmergencyToolKey, large = false) {
  const cls = large ? 'w-full h-56' : 'w-full h-36';
  switch (toolKey) {
    case 'o2_mask_bottle':
      return (
        <svg viewBox="0 0 260 130" className={cls} aria-label="Green Oxygen Tank and Clear Mask">
          {/* Green O2 Cylinder */}
          <rect x="24" y="34" width="48" height="80" rx="16" fill="#059669" stroke="#6ee7b7" strokeWidth="2.5" />
          <rect x="38" y="18" width="20" height="18" rx="4" fill="#34d399" stroke="#ecfdf5" strokeWidth="2" />
          <circle cx="48" cy="27" r="6" fill="#0f172a" stroke="#fbbf24" strokeWidth="2" />
          <line x1="48" y1="27" x2="52" y2="23" stroke="#fbbf24" strokeWidth="2" />
          <rect x="30" y="54" width="36" height="24" rx="4" fill="#ecfdf5" />
          <text x="48" y="69" textAnchor="middle" fill="#064e3b" fontSize="11" fontWeight="900" fontFamily="monospace">
            O2
          </text>
          {/* Tubing */}
          <path d="M58 26 C 92 20, 108 88, 146 72" fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 3" />
          {/* Clear Face Mask */}
          <path d="M150 38 C 175 26, 212 40, 218 68 C 222 86, 198 102, 166 96 C 148 92, 140 62, 150 38 Z" fill="#cffafe" fillOpacity="0.28" stroke="#67e8f9" strokeWidth="2.5" />
          <path d="M164 46 L 198 52 L 204 78 L 166 84 Z" fill="#22d3ee" fillOpacity="0.16" />
          <path d="M214 55 Q 238 58 232 82 Q 214 86 206 82" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
          <rect x="130" y="63" width="24" height="14" rx="4" fill="#10b981" stroke="#a7f3d0" strokeWidth="1.5" />
          <text x="184" y="116" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="700" fontFamily="monospace">
            SEAL MASK &amp; GREEN VALVE
          </text>
        </svg>
      );

    case 'hatch_repress':
      return (
        <svg viewBox="0 0 260 130" className={cls} aria-label="Hatch Latch Lever and Repress Switch">
          {/* Hatch Door Frame */}
          <rect x="20" y="14" width="110" height="102" rx="14" fill="#1e293b" stroke="#64748b" strokeWidth="2.5" />
          <rect x="34" y="26" width="82" height="78" rx="10" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          {/* Lever */}
          <circle cx="75" cy="65" r="14" fill="#f59e0b" stroke="#fef3c7" strokeWidth="2" />
          <rect x="70" y="34" width="10" height="36" rx="4" fill="#fbbf24" />
          <rect x="52" y="88" width="46" height="12" rx="4" fill="#10b981" />
          <text x="75" y="97" textAnchor="middle" fill="#022c22" fontSize="8" fontWeight="900" fontFamily="monospace">
            LOCKED
          </text>
          {/* Wall Repress Switch Box */}
          <rect x="150" y="22" width="90" height="86" rx="10" fill="#0f172a" stroke="#f59e0b" strokeWidth="2.5" />
          <text x="195" y="39" textAnchor="middle" fill="#fde68a" fontSize="9" fontWeight="800" fontFamily="monospace">
            N2/O2 REPRESS
          </text>
          <rect x="176" y="48" width="38" height="40" rx="6" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="181" y="52" width="28" height="18" rx="4" fill="#10b981" />
          <text x="195" y="64" textAnchor="middle" fill="#022c22" fontSize="9" fontWeight="900" fontFamily="monospace">
            ON
          </text>
          <circle cx="222" cy="48" r="5" fill="#22c55e" />
        </svg>
      );

    case 'pulse_oximeter':
      return (
        <svg viewBox="0 0 260 130" className={cls} aria-label="Fingertip Pulse Oximeter">
          {/* Finger */}
          <path d="M22 68 C 22 50, 52 48, 118 52 C 130 53, 134 77, 118 78 C 52 82, 22 80, 22 68 Z" fill="#fdba74" stroke="#f97316" strokeWidth="2" />
          {/* Clip Oximeter Body */}
          <rect x="86" y="26" width="136" height="72" rx="14" fill="#0284c7" stroke="#7dd3fc" strokeWidth="2.5" />
          <rect x="102" y="38" width="104" height="44" rx="7" fill="#020617" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="132" y="59" textAnchor="middle" fill="#22d3ee" fontSize="18" fontWeight="900" fontFamily="monospace">
            98%
          </text>
          <text x="132" y="74" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="700" fontFamily="monospace">
            SpO2
          </text>
          <text x="180" y="59" textAnchor="middle" fill="#34d399" fontSize="16" fontWeight="900" fontFamily="monospace">
            72
          </text>
          <text x="180" y="74" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="700" fontFamily="monospace">
            BPM
          </text>
          <text x="154" y="116" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="700" fontFamily="monospace">
            CLIP TO WARM FINGER
          </text>
        </svg>
      );

    case 'fan_boost':
      return (
        <svg viewBox="0 0 260 130" className={cls} aria-label="Cabin Airflow Fan Boost Switch">
          {/* Fan Housing */}
          <circle cx="72" cy="64" r="44" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="72" cy="64" r="10" fill="#38bdf8" />
          <path d="M72 54 C 58 26, 94 22, 84 54 Z" fill="#7dd3fc" />
          <path d="M81 70 C 110 68, 102 102, 74 74 Z" fill="#7dd3fc" />
          <path d="M62 68 C 44 96, 26 70, 62 60 Z" fill="#7dd3fc" />
          {/* Control Panel */}
          <rect x="136" y="22" width="104" height="86" rx="10" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <text x="188" y="40" textAnchor="middle" fill="#bae6fd" fontSize="9" fontWeight="900" fontFamily="monospace">
            CABIN FANS
          </text>
          <rect x="154" y="48" width="68" height="24" rx="6" fill="#06b6d4" />
          <text x="188" y="64" textAnchor="middle" fill="#082f49" fontSize="11" fontWeight="900" fontFamily="monospace">
            MAX 100%
          </text>
          <path d="M156 90 L 216 90" stroke="#34d399" strokeWidth="3" strokeDasharray="5 4" />
          <polygon points="222,90 212,85 212,95" fill="#34d399" />
        </svg>
      );

    case 'lioh_scrubber':
      return (
        <svg viewBox="0 0 260 130" className={cls} aria-label="White LiOH CO2 Scrubber Canister">
          {/* Canister */}
          <rect x="48" y="26" width="110" height="76" rx="12" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3" />
          <rect x="64" y="38" width="78" height="24" rx="4" fill="#fbbf24" />
          <text x="103" y="54" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="900" fontFamily="monospace">
            LiOH CO2
          </text>
          {/* Air filter slats */}
          <line x1="66" y1="74" x2="140" y2="74" stroke="#64748b" strokeWidth="3" />
          <line x1="66" y1="84" x2="140" y2="84" stroke="#64748b" strokeWidth="3" />
          {/* Yellow Latch Arrows */}
          <polygon points="188,64 166,52 166,76" fill="#fbbf24" />
          <rect x="192" y="30" width="44" height="68" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
          <text x="214" y="62" textAnchor="middle" fill="#fde68a" fontSize="9" fontWeight="900" fontFamily="monospace">
            ECLSS
          </text>
          <text x="214" y="75" textAnchor="middle" fill="#fde68a" fontSize="9" fontWeight="900" fontFamily="monospace">
            SLOT
          </text>
          <text x="130" y="119" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="700" fontFamily="monospace">
            ALIGN YELLOW ARROWS &amp; LATCH
          </text>
        </svg>
      );

    case 'pain_pack_water':
      return (
        <svg viewBox="0 0 260 130" className={cls} aria-label="Pain Blister Pack and Water Pouch">
          {/* Blue Tablet Pack */}
          <rect x="28" y="24" width="90" height="74" rx="10" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2.5" />
          <text x="73" y="42" textAnchor="middle" fill="#bfdbfe" fontSize="9" fontWeight="900" fontFamily="monospace">
            IBUPROFEN
          </text>
          <ellipse cx="52" cy="64" rx="11" ry="7" fill="#f8fafc" stroke="#93c5fd" strokeWidth="2" />
          <ellipse cx="92" cy="64" rx="11" ry="7" fill="#f8fafc" stroke="#93c5fd" strokeWidth="2" />
          <ellipse cx="72" cy="83" rx="11" ry="7" fill="#f8fafc" stroke="#93c5fd" strokeWidth="2" />
          {/* Silver-Blue Water Pouch */}
          <rect x="148" y="32" width="76" height="74" rx="12" fill="#0e7490" stroke="#67e8f9" strokeWidth="2.5" />
          <rect x="176" y="14" width="20" height="18" rx="3" fill="#e2e8f0" />
          <text x="186" y="65" textAnchor="middle" fill="#ecfeff" fontSize="13" fontWeight="900" fontFamily="monospace">
            500mL
          </text>
          <text x="186" y="81" textAnchor="middle" fill="#a5f3fc" fontSize="9" fontWeight="700" fontFamily="monospace">
            WATER
          </text>
        </svg>
      );

    case 'water_wall_dosimeter':
      return (
        <svg viewBox="0 0 260 130" className={cls} aria-label="Water-Wall Shelter and Dosimeter Badge">
          {/* Water-Wall Bags */}
          <rect x="24" y="18" width="124" height="90" rx="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
          <rect x="28" y="22" width="20" height="82" rx="4" fill="#0284c7" />
          <rect x="124" y="22" width="20" height="82" rx="4" fill="#0284c7" />
          <rect x="48" y="22" width="76" height="18" rx="4" fill="#0284c7" />
          <text x="86" y="34" textAnchor="middle" fill="#e0f2fe" fontSize="8" fontWeight="900" fontFamily="monospace">
            H2O SHIELD WALL
          </text>
          <circle cx="86" cy="68" r="14" fill="#22d3ee" fillOpacity="0.25" stroke="#22d3ee" strokeWidth="2" />
          <text x="86" y="96" textAnchor="middle" fill="#7dd3fc" fontSize="8" fontWeight="800" fontFamily="monospace">
            SAFE CORE ZONE
          </text>
          {/* Dosimeter Badge */}
          <rect x="172" y="26" width="64" height="74" rx="10" fill="#ea580c" stroke="#fed7aa" strokeWidth="2.5" />
          <rect x="184" y="42" width="40" height="22" rx="4" fill="#0f172a" />
          <text x="204" y="57" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="900" fontFamily="monospace">
            LOW µSv
          </text>
          <text x="204" y="84" textAnchor="middle" fill="#fff7ed" fontSize="8" fontWeight="900" fontFamily="monospace">
            BADGE
          </text>
        </svg>
      );

    case 'spe_attitude_console':
      return (
        <svg viewBox="0 0 260 130" className={cls} aria-label="Spacecraft SPE-SHIELD Console">
          {/* Solar Flare Rays */}
          <circle cx="32" cy="64" r="18" fill="#f59e0b" />
          <line x1="56" y1="48" x2="96" y2="48" stroke="#fbbf24" strokeWidth="3" strokeDasharray="4 3" />
          <line x1="56" y1="64" x2="96" y2="64" stroke="#fbbf24" strokeWidth="3" strokeDasharray="4 3" />
          <line x1="56" y1="80" x2="96" y2="80" stroke="#fbbf24" strokeWidth="3" strokeDasharray="4 3" />
          {/* Spacecraft Shield & Cabin */}
          <rect x="102" y="34" width="22" height="60" rx="6" fill="#10b981" stroke="#a7f3d0" strokeWidth="2" />
          <rect x="128" y="44" width="40" height="40" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <text x="148" y="68" textAnchor="middle" fill="#7dd3fc" fontSize="9" fontWeight="900" fontFamily="monospace">
            CREW
          </text>
          {/* Console Button */}
          <rect x="184" y="30" width="60" height="68" rx="10" fill="#0f172a" stroke="#f59e0b" strokeWidth="2.5" />
          <rect x="192" y="50" width="44" height="26" rx="5" fill="#f59e0b" />
          <text x="214" y="62" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="900" fontFamily="monospace">
            SPE
          </text>
          <text x="214" y="71" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="900" fontFamily="monospace">
            SHIELD
          </text>
        </svg>
      );

    case 'radiation_kit_r1':
      return (
        <svg viewBox="0 0 260 130" className={cls} aria-label="Orange Radiation Kit Pouch R-1">
          <rect x="38" y="24" width="110" height="82" rx="14" fill="#ea580c" stroke="#fed7aa" strokeWidth="3" />
          <line x1="48" y1="42" x2="138" y2="42" stroke="#7c2d12" strokeWidth="4" />
          <rect x="58" y="52" width="70" height="36" rx="6" fill="#fff7ed" />
          <text x="93" y="69" textAnchor="middle" fill="#9a3412" fontSize="13" fontWeight="900" fontFamily="monospace">
            R-1 KIT
          </text>
          <text x="93" y="82" textAnchor="middle" fill="#c2410c" fontSize="8" fontWeight="800" fontFamily="monospace">
            RAD SHIELD
          </text>
          {/* Blister Pack */}
          <rect x="166" y="34" width="66" height="62" rx="8" fill="#1e293b" stroke="#fb923c" strokeWidth="2" />
          <circle cx="186" cy="56" r="8" fill="#fef08a" />
          <circle cx="212" cy="56" r="8" fill="#fef08a" />
          <text x="199" y="84" textAnchor="middle" fill="#fed7aa" fontSize="8" fontWeight="800" fontFamily="monospace">
            ANTIOXIDANT
          </text>
        </svg>
      );

    case 'bungee_footloops':
      return (
        <svg viewBox="0 0 260 130" className={cls} aria-label="Bungee Restraint Strap and Floor Footloops">
          <rect x="26" y="86" width="208" height="16" rx="4" fill="#334155" stroke="#64748b" strokeWidth="2" />
          {/* Footloops */}
          <path d="M58 86 C 58 54, 106 54, 106 86" fill="none" stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />
          <path d="M154 86 C 154 54, 202 54, 202 86" fill="none" stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />
          {/* Yellow Bungee Strap */}
          <path d="M82 40 L 178 40" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
          <rect x="116" y="30" width="28" height="20" rx="4" fill="#ca8a04" stroke="#fef08a" strokeWidth="2" />
          <text x="130" y="118" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="700" fontFamily="monospace">
            STRAP IN OR RAISE LEGS FLAT
          </text>
        </svg>
      );

    case 'glucose_gel_meter':
      return (
        <svg viewBox="0 0 260 130" className={cls} aria-label="15g Orange Glucose Gel and Glucometer">
          {/* Squeeze Gel Pouch */}
          <path d="M38 30 L 108 30 L 116 96 L 30 96 Z" fill="#f97316" stroke="#ffedd5" strokeWidth="2.5" />
          <rect x="64" y="16" width="18" height="14" rx="3" fill="#fff7ed" />
          <text x="73" y="60" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="900" fontFamily="monospace">
            15g
          </text>
          <text x="73" y="76" textAnchor="middle" fill="#ffedd5" fontSize="9" fontWeight="800" fontFamily="monospace">
            GLUCOSE
          </text>
          {/* Glucometer */}
          <rect x="148" y="24" width="76" height="82" rx="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
          <rect x="160" y="36" width="52" height="34" rx="6" fill="#020617" />
          <text x="186" y="58" textAnchor="middle" fill="#fbbf24" fontSize="15" fontWeight="900" fontFamily="monospace">
            80+
          </text>
          <text x="186" y="88" textAnchor="middle" fill="#bae6fd" fontSize="8" fontWeight="800" fontFamily="monospace">
            mg/dL METER
          </text>
        </svg>
      );

    case 'electrolyte_water':
      return (
        <svg viewBox="0 0 260 130" className={cls} aria-label="Electrolyte Mix and 500 mL Water Pouch">
          {/* Electrolyte Packet */}
          <rect x="30" y="28" width="76" height="72" rx="8" fill="#0284c7" stroke="#bae6fd" strokeWidth="2.5" />
          <text x="68" y="58" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="monospace">
            SALTS
          </text>
          <text x="68" y="73" textAnchor="middle" fill="#bae6fd" fontSize="9" fontWeight="800" fontFamily="monospace">
            Na+ / K+
          </text>
          <polygon points="134,64 116,54 116,74" fill="#22d3ee" />
          {/* Water Pouch */}
          <rect x="146" y="28" width="80" height="76" rx="12" fill="#0891b2" stroke="#67e8f9" strokeWidth="2.5" />
          <rect x="176" y="12" width="20" height="16" rx="3" fill="#f1f5f9" />
          <text x="186" y="64" textAnchor="middle" fill="#ecfeff" fontSize="14" fontWeight="900" fontFamily="monospace">
            500mL
          </text>
          <text x="186" y="80" textAnchor="middle" fill="#cffafe" fontSize="9" fontWeight="800" fontFamily="monospace">
            MIX &amp; SIP
          </text>
        </svg>
      );

    case 'eyewash_saline':
      return (
        <svg viewBox="0 0 260 130" className={cls} aria-label="Sterile Eyewash Cup and Saline Bottle">
          {/* Eyewash Cup */}
          <path d="M40 42 C 40 28, 92 28, 92 42 L 82 88 C 80 96, 52 96, 50 88 Z" fill="#67e8f9" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="3" />
          <ellipse cx="66" cy="40" rx="26" ry="8" fill="#0284c7" fillOpacity="0.4" stroke="#7dd3fc" strokeWidth="2" />
          <text x="66" y="112" textAnchor="middle" fill="#bae6fd" fontSize="9" fontWeight="800" fontFamily="monospace">
            EYEWASH CUP
          </text>
          {/* Saline Squeeze Bottle */}
          <rect x="148" y="38" width="66" height="62" rx="12" fill="#f8fafc" stroke="#38bdf8" strokeWidth="2.5" />
          <polygon points="181,14 170,38 192,38" fill="#38bdf8" />
          <text x="181" y="68" textAnchor="middle" fill="#0369a1" fontSize="10" fontWeight="900" fontFamily="monospace">
            SALINE
          </text>
          <text x="181" y="82" textAnchor="middle" fill="#0284c7" fontSize="8" fontWeight="800" fontFamily="monospace">
            STERILE
          </text>
        </svg>
      );

    case 'amsler_ultrasound':
      return (
        <svg viewBox="0 0 260 130" className={cls} aria-label="Amsler Eye Grid and Ultrasound Probe">
          {/* Amsler Grid Card */}
          <rect x="28" y="20" width="84" height="84" rx="6" fill="#020617" stroke="#818cf8" strokeWidth="2.5" />
          {[34, 48, 62, 76, 90].map((pos) => (
            <React.Fragment key={pos}>
              <line x1={pos} y1="22" x2={pos} y2="102" stroke="#475569" strokeWidth="1" />
              <line x1="30" y1={pos - 8} x2="110" y2={pos - 8} stroke="#475569" strokeWidth="1" />
            </React.Fragment>
          ))}
          <circle cx="70" cy="62" r="4" fill="#ffffff" />
          {/* Handheld Ultrasound Probe */}
          <path d="M168 32 C 168 20, 212 20, 212 32 L 200 84 L 180 84 Z" fill="#e2e8f0" stroke="#38bdf8" strokeWidth="2.5" />
          <ellipse cx="190" cy="24" rx="20" ry="6" fill="#38bdf8" />
          <path d="M190 84 L 190 108" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
          <text x="190" y="120" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="800" fontFamily="monospace">
            EYE PROBE + GRID
          </text>
        </svg>
      );

    case 'eye_drops_glasses':
      return (
        <svg viewBox="0 0 260 130" className={cls} aria-label="Eye Drops Bottle and Space Glasses">
          {/* Dropper Bottle */}
          <rect x="34" y="42" width="52" height="58" rx="10" fill="#059669" stroke="#6ee7b7" strokeWidth="2.5" />
          <polygon points="60,18 50,42 70,42" fill="#e2e8f0" />
          <text x="60" y="74" textAnchor="middle" fill="#ecfdf5" fontSize="9" fontWeight="900" fontFamily="monospace">
            DROPS
          </text>
          {/* +1.25D Space Glasses */}
          <rect x="116" y="44" width="48" height="32" rx="8" fill="#38bdf8" fillOpacity="0.22" stroke="#7dd3fc" strokeWidth="3" />
          <rect x="180" y="44" width="48" height="32" rx="8" fill="#38bdf8" fillOpacity="0.22" stroke="#7dd3fc" strokeWidth="3" />
          <line x1="164" y1="56" x2="180" y2="56" stroke="#7dd3fc" strokeWidth="3" />
          <text x="172" y="98" textAnchor="middle" fill="#bae6fd" fontSize="10" fontWeight="900" fontFamily="monospace">
            +1.25D SPACE GLASSES
          </text>
        </svg>
      );
  }
}

interface EmergencyHardwareIllustrationProps {
  toolKey: EmergencyToolKey;
  hardwareLabel: string;
}

export const EmergencyHardwareIllustration: React.FC<EmergencyHardwareIllustrationProps> = ({
  toolKey,
  hardwareLabel,
}) => {
  const [zoomOpen, setZoomOpen] = useState(false);
  const meta = TOOL_META[toolKey];

  return (
    <>
      <div
        className={`rounded-xl border ${meta.accentBorder} ${meta.accentBg} p-3.5 space-y-2.5`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-300 uppercase">
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span>Grab This Exact Kit Item</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold text-cyan-300">
            {meta.badgeTag}
          </span>
        </div>

        {/* Visual Tool Diagram Card */}
        <div
          onClick={() => setZoomOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setZoomOpen(true);
          }}
          className="relative rounded-xl bg-slate-950 border border-slate-700/80 p-2.5 cursor-pointer group hover:border-cyan-400 transition-colors"
        >
          {renderToolSvg(toolKey, false)}
          <span className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300 group-hover:text-cyan-300 flex items-center gap-1">
            <Maximize2 className="w-3 h-3" />
            <span>Zoom</span>
          </span>
        </div>

        <div>
          <p className="text-xs text-white font-bold leading-snug">{hardwareLabel}</p>
          <p className="text-[11px] text-slate-300 mt-0.5">{meta.caption}</p>
        </div>
      </div>

      {/* Enlarged Picture Modal */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
          onClick={() => setZoomOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-slate-900 border-2 border-cyan-400 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-amber-300 uppercase">
                  {meta.badgeTag}
                </span>
                <h4 className="text-base font-extrabold text-white">{hardwareLabel}</h4>
              </div>
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-600 cursor-pointer"
                aria-label="Close zoomed tool picture"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-700 p-4">
              {renderToolSvg(toolKey, true)}
            </div>
            <p className="text-xs text-slate-300 text-center">{meta.caption}</p>
          </div>
        </div>
      )}
    </>
  );
};
