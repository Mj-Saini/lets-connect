export function AMeetraLogo({
  size = 48,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="url(#gradient)" opacity="0.1" />

      {/* Left circle (person) */}
      <circle cx="35" cy="35" r="12" fill="url(#gradientLeft)" />

      {/* Right circle (person) */}
      <circle cx="65" cy="35" r="12" fill="url(#gradientRight)" />

      {/* Connection heart in middle */}
      <path
        d="M50 55 C50 55, 40 45, 35 50 C30 55, 35 65, 50 75 C65 65, 70 55, 65 50 C60 45, 50 55, 50 55 Z"
        fill="url(#gradientHeart)"
      />

      {/* Spark elements */}
      <circle cx="25" cy="25" r="2" fill="url(#gradientHeart)" opacity="0.7" />
      <circle cx="75" cy="25" r="2" fill="url(#gradientHeart)" opacity="0.7" />
      <circle cx="50" cy="80" r="2" fill="url(#gradientHeart)" opacity="0.7" />

      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="gradientLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <linearGradient id="gradientRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="gradientHeart" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>
    </svg>
  );
}
