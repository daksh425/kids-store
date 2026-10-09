// Fixed store taxonomy. Products store the slugs; names and colours live here.
//
// CATEGORIES and AGE_GROUPS are the kids store. Grown-up products live in
// separate lists so nothing written for adults can surface on a kids page;
// the ALL_* lists are for admin and lookups only.

export type CategorySlug = "ebooks" | "colouring" | "activities" | "worksheets" | "learning-packs" | "grown-up-reads";

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

export const ADULT_CATEGORIES: Category[] = [
  {
    slug: "grown-up-reads",
    name: "Grown-up Reads",
    short: "Grown-up Reads",
    description: "Novels and novellas for the grown-ups, after the kids are asleep",
    color: "#2E1A47",
    tint: "#F1ECF6",
    ink: "#4A2C6E",
  },
];

export const ALL_CATEGORIES: Category[] = [...CATEGORIES, ...ADULT_CATEGORIES];
export const KIDS_CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);
export const ADULT_CATEGORY_SLUGS = ADULT_CATEGORIES.map((c) => c.slug);

export const ADULT_AGE_GROUPS = [{ slug: "adult", label: "Adults 18+" }] as const;
export const ALL_AGE_GROUPS = [...AGE_GROUPS, ...ADULT_AGE_GROUPS];

export function getCategory(slug: string) {
  return ALL_CATEGORIES.find((c) => c.slug === slug);
}

export function isAdultCategory(slug: string) {
  return ADULT_CATEGORY_SLUGS.includes(slug as CategorySlug);
}

export function ageLabel(slug: string) {
  return ALL_AGE_GROUPS.find((a) => a.slug === slug)?.label ?? slug;
}

export function isCategorySlug(slug: string): slug is CategorySlug {
  return ALL_CATEGORIES.some((c) => c.slug === slug);
}

/** Products with their own marketing landing page instead of the standard product page. */
export const LANDING_PAGES: Record<string, string> = {
  "billionaire-fake-fiancee": "/grown-ups/billionaire-fake-fiancee",
};

export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "BrightBuds";
