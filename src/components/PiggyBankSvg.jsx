import React from 'react';

export default function PiggyBankSvg({ width = 125, height = 100, className = '' }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 160 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Soft shadow under piggy */}
        <ellipse id="piggy-shadow" cx="78" cy="118" rx="55" ry="10" fill="rgba(0, 0, 0, 0.18)" />
        
        {/* Piggy gradient */}
        <linearGradient id="piggyBody" x1="20" y1="20" x2="135" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFCCD5" />
          <stop offset="50%" stopColor="#FFA6B8" />
          <stop offset="100%" stopColor="#F48B9F" />
        </linearGradient>

        <linearGradient id="piggySnout" x1="120" y1="60" x2="148" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFAEC0" />
          <stop offset="100%" stopColor="#ED7B92" />
        </linearGradient>

        <linearGradient id="coinGrad" x1="88" y1="12" x2="108" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>

      {/* Shadow */}
      <use href="#piggy-shadow" />

      {/* Tail curly */}
      <path
        d="M 28 65 Q 14 55 20 44 Q 26 36 32 46"
        stroke="#F48B9F"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Back foot */}
      <rect x="42" y="94" width="14" height="20" rx="7" fill="#E8768E" />
      <rect x="94" y="94" width="14" height="20" rx="7" fill="#E8768E" />

      {/* Main Body */}
      <ellipse cx="78" cy="70" rx="52" ry="40" fill="url(#piggyBody)" />

      {/* Front foot */}
      <rect x="52" y="98" width="14" height="20" rx="7" fill="#F48B9F" />
      <rect x="104" y="98" width="14" height="20" rx="7" fill="#F48B9F" />

      {/* Back Ear */}
      <path
        d="M 94 40 L 98 22 Q 106 20 110 32 Z"
        fill="#E8768E"
      />

      {/* Front Ear */}
      <path
        d="M 104 44 L 115 25 Q 124 26 122 40 Z"
        fill="#FFAEC0"
      />

      {/* Coin slot */}
      <ellipse cx="80" cy="33" rx="14" ry="3.5" fill="#C95F77" />

      {/* Coin falling in */}
      <g transform="rotate(-18 96 24)">
        <rect x="88" y="10" width="18" height="24" rx="4" fill="url(#coinGrad)" />
        <ellipse cx="97" cy="22" rx="4" ry="7" fill="#86EFAC" />
        <text x="94" y="25" fill="#15803D" fontSize="8" fontWeight="bold">$</text>
      </g>

      {/* Snout */}
      <ellipse cx="128" cy="72" rx="14" ry="11" fill="url(#piggySnout)" />
      <ellipse cx="124" cy="72" rx="2.2" ry="4" fill="#C95F77" />
      <ellipse cx="132" cy="72" rx="2.2" ry="4" fill="#C95F77" />

      {/* Eye */}
      <ellipse cx="106" cy="56" rx="3.5" ry="4" fill="#2C243B" />
      <circle cx="105" cy="54.5" r="1.3" fill="#FFFFFF" />

      {/* Cute blush */}
      <ellipse cx="106" cy="68" rx="6" ry="4" fill="rgba(244, 63, 94, 0.25)" />
    </svg>
  );
}

