export function CategoryIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
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
      <circle cx="12" cy="12" r="6" fill="currentColor" />
      <circle cx="52" cy="12" r="6" fill="currentColor" />
      <circle cx="52" cy="52" r="6" fill="currentColor" />
      <circle cx="12" cy="52" r="6" fill="currentColor" />
      <path
        d="M18 12H46M52 18V46M46 52H18M12 46V18"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="6" fill="currentColor" />
    </svg>
  );
}
