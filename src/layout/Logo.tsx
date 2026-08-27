interface LogoProps {
  size?: number;
}

/** نشان برنامه — سه دایره هم‌پوشان به نشانه اعضای خانواده */
export default function Logo({ size = 38 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="نشان مدیریت مالی خانواده">
      <rect width="40" height="40" rx="11" fill="#146855" />
      <circle cx="16" cy="16.5" r="6.2" fill="#E9C06A" />
      <circle cx="25" cy="18.5" r="6.2" fill="#FFFFFF" fillOpacity="0.92" />
      <circle cx="19" cy="25.5" r="6.2" fill="#B9D6CB" />
    </svg>
  );
}
