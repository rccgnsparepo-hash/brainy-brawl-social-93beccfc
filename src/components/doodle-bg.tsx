export function DoodleBg() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-[0.06]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="ms-doodles" width="160" height="160" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <circle cx="20" cy="22" r="9" />
            <path d="M55 18 l10 -6 l10 6 l-4 12 h-12 z" />
            <path d="M105 14 q10 -10 20 0 q-10 10 -20 0 z" />
            <path d="M138 30 l8 -8 m0 8 l-8 -8" />
            <path d="M14 70 l14 14 m0 -14 l-14 14" />
            <circle cx="60" cy="78" r="6" />
            <path d="M85 70 l10 16 h-20 z" />
            <path d="M118 78 q8 -16 16 0 t16 0" />
            <path d="M22 118 q12 -10 24 0 t24 0" />
            <path d="M70 110 a14 14 0 1 1 0 0.1" />
            <path d="M110 108 l8 24 m-8 0 l8 -24" />
            <path d="M140 130 c-8 -2 -8 -14 0 -16 c8 2 8 14 0 16 z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ms-doodles)" />
    </svg>
  );
}
