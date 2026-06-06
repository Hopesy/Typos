export function SplashIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M32 6 L36 22 L52 10 L42 26 L58 30 L42 34 L50 50 L36 40 L32 58 L28 40 L14 50 L22 34 L6 30 L22 26 L12 10 L28 22 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="6" fill="currentColor" />
    </svg>
  );
}
