interface AvatarProps {
  name: string;
  seed?: string;
  size?: "sm" | "md" | "lg";
}

const PALETTES = [
  { bg: "#dcebe5", fg: "#0f5545" },
  { bg: "#f9ead0", fg: "#8c5512" },
  { bg: "#e3e9f5", fg: "#34507e" },
  { bg: "#f4e3e8", fg: "#8e3b56" },
  { bg: "#e7ecdc", fg: "#57662e" },
  { bg: "#e0edf0", fg: "#2c6572" },
];

const SIZES = { sm: "h-8 w-8 text-[11px]", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-xl" };

export default function Avatar({ name, seed, size = "md" }: AvatarProps) {
  const key = seed ?? name;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const palette = PALETTES[hash % PALETTES.length];
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : (name.trim()[0] ?? "؟");

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-extrabold ${SIZES[size]}`}
      style={{ backgroundColor: palette.bg, color: palette.fg }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
