import { BookOpen, Gift, Palette, PencilLine, Puzzle, type LucideProps } from "lucide-react";

const CATEGORY_ICONS = {
  ebooks: BookOpen,
  colouring: Palette,
  activities: Puzzle,
  worksheets: PencilLine,
  "learning-packs": Gift,
} as const;

export function CategoryIcon({ slug, ...props }: { slug: string } & LucideProps) {
  const Icon = CATEGORY_ICONS[slug as keyof typeof CATEGORY_ICONS] ?? BookOpen;
  return <Icon {...props} />;
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#5B4BDB" />
      <path
        d="M20 7.5l3.3 8.1 8.7.6-6.7 5.6 2.1 8.5L20 25.6l-7.4 4.7 2.1-8.5L8 16.2l8.7-.6z"
        fill="#FFD95A"
        stroke="#FFD95A"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="31.5" cy="8.5" r="2.4" fill="#72D6B1" />
      <circle cx="7.5" cy="30" r="1.8" fill="#FF7B6B" />
    </svg>
  );
}
