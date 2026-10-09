import { Abril_Fatface, Great_Vibes, Libre_Baskerville } from "next/font/google";

// The book's own typefaces, so the landing page looks like the cover.
export const display = Abril_Fatface({ weight: "400", subsets: ["latin"], variable: "--font-book-display" });
export const script = Great_Vibes({ weight: "400", subsets: ["latin"], variable: "--font-book-script" });
export const serif = Libre_Baskerville({ weight: ["400", "700"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-book-serif" });

export const bookFonts = `${display.variable} ${script.variable} ${serif.variable}`;
