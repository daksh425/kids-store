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
  // A bud on a stem: the "bright bud" of the name.
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#D02B65" />
      <path d="M20 31V19" stroke="#72D6B1" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M20 26c-5.5 0-8-3-8.5-6.5 4.5-.3 8 1.8 8.5 6.5Z" fill="#72D6B1" />
      <path d="M20 23.5c5.2 0 7.6-2.8 8-6.2-4.3-.2-7.6 1.7-8 6.2Z" fill="#72D6B1" />
      <path d="M20 8c3.6 2.4 5 5.6 4.2 8.6-.6 2.3-2.3 3.6-4.2 3.6s-3.6-1.3-4.2-3.6C15 13.6 16.4 10.4 20 8Z" fill="#FFD95A" />
      <circle cx="31" cy="9" r="2.2" fill="#FFD95A" />
    </svg>
  );
}
