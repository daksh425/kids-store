// Fixed store taxonomy. Products store the slugs; names and colours live here.

export type CategorySlug = "ebooks" | "colouring" | "activities" | "worksheets" | "learning-packs";

export type Category = {
  slug: CategorySlug;
  name: string;
  short: string;
  description: string;
  /** Solid brand colour for icons and accents */
  color: string;
  /** Pale tint for backgrounds */
  tint: string;
  /** Darker shade that passes contrast as text on the tint */
  ink: string;
};

export const CATEGORIES: Category[] = [
  {
    slug: "ebooks",
    name: "Kids E-books",
    short: "E-books",
    description: "Stories, educational books and activity e-books",
    color: "#5B4BDB",
    tint: "#EEEBFF",
    ink: "#3F31B8",
  },
  {
    slug: "colouring",
    name: "Colouring Books",
    short: "Colouring",
    description: "Printable colouring pages and themed packs",
    color: "#FF7B6B",
    tint: "#FFECE9",
    ink: "#B8392A",
  },
  {
    slug: "activities",
    name: "Activity Books",
    short: "Activities",
    description: "Puzzles, games, tracing, matching and creative activities",
    color: "#4DA3FF",
    tint: "#E6F2FF",
    ink: "#1F65B8",
  },
  {
    slug: "worksheets",
    name: "Worksheets",
    short: "Worksheets",
    description: "Math, English, GK, handwriting and practice sheets",
    color: "#72D6B1",
    tint: "#E3F7EF",
    ink: "#1D7A58",
  },
  {
    slug: "learning-packs",
    name: "Learning Packs",
    short: "Learning Packs",
    description: "Multi-product bundles by age or learning goal",
    color: "#FFD95A",
    tint: "#FFF6D6",
    ink: "#8A6400",
  },
];

export const AGE_GROUPS = [
  { slug: "2-4", label: "Ages 2–4" },
  { slug: "4-6", label: "Ages 4–6" },
  { slug: "6-8", label: "Ages 6–8" },
  { slug: "8-10", label: "Ages 8–10" },
  { slug: "10-12", label: "Ages 10–12" },
] as const;

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function ageLabel(slug: string) {
  return AGE_GROUPS.find((a) => a.slug === slug)?.label ?? slug;
}

export function isCategorySlug(slug: string): slug is CategorySlug {
  return CATEGORIES.some((c) => c.slug === slug);
}

export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Little Sparks";
