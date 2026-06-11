/** The peeking-walrus mark from the app icon, without the tile — for in-app branding. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="192 220 640 610" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bm-folder" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7d87f4" />
          <stop offset="1" stopColor="#5560c9" />
        </linearGradient>
        <linearGradient id="bm-tab" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8f98f7" />
          <stop offset="1" stopColor="#6b76e0" />
        </linearGradient>
      </defs>
      <rect fill="url(#bm-tab)" height="80" rx="26" width="130" x="212" y="402" />
      <g>
        <rect fill="#f3f2fb" height="300" rx="140" width="320" x="352" y="302" />
        <circle cx="442" cy="416" fill="#23243a" r="24" />
        <circle cx="582" cy="416" fill="#23243a" r="24" />
        <circle cx="435" cy="408" fill="#ffffff" r="8" />
        <circle cx="575" cy="408" fill="#ffffff" r="8" />
        <ellipse cx="512" cy="458" fill="#23243a" rx="22" ry="15" />
      </g>
      <rect fill="url(#bm-folder)" height="356" rx="56" width="640" x="192" y="472" />
      <rect fill="#ffffff" fillOpacity="0.28" height="5" rx="2.5" width="596" x="214" y="486" />
      <rect fill="#ffffff" height="138" rx="20" transform="rotate(3 470 535)" width="40" x="450" y="466" />
      <rect fill="#ffffff" height="138" rx="20" transform="rotate(-3 554 535)" width="40" x="534" y="466" />
      <g>
        <ellipse cx="384" cy="472" fill="#f3f2fb" rx="38" ry="30" />
        <path d="M 374 455 L 370 488" fill="none" stroke="#c9cdf0" strokeLinecap="round" strokeWidth="9" />
        <path d="M 396 455 L 398 488" fill="none" stroke="#c9cdf0" strokeLinecap="round" strokeWidth="9" />
      </g>
      <g>
        <ellipse cx="640" cy="472" fill="#f3f2fb" rx="38" ry="30" />
        <path d="M 628 455 L 626 488" fill="none" stroke="#c9cdf0" strokeLinecap="round" strokeWidth="9" />
        <path d="M 650 455 L 654 488" fill="none" stroke="#c9cdf0" strokeLinecap="round" strokeWidth="9" />
      </g>
    </svg>
  );
}
