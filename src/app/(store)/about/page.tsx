import { Sprout } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { STORE_NAME } from "@/lib/catalog";

export const metadata: Metadata = { title: "About us" };

export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <Sprout size={40} className="text-mint-ink" />
      <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Every child is a bright little bud</h1>
      <div className="prose-simple mt-6 text-lg">
        <p>
          At {STORE_NAME} we believe children grow the way gardens do: a little every day, with plenty of sunshine and
          someone cheering them on. Our printables are the watering can.
        </p>
        <p>
          We make story e-books, colouring pages, puzzles, worksheets and learning packs for ages 2 to 12. Each one is
          designed to fit into a spare ten minutes, print at the kitchen table or in the classroom, and be enjoyed again
          and again.
        </p>
        <h2>What we care about</h2>
        <ul>
          <li>Ready in a minute: download straight away, nothing to wait for in the post.</li>
          <li>Made for their age, so it&apos;s never too easy and never too hard.</li>
          <li>Small prices for single printables, and bigger savings in bundles.</li>
          <li>Safe, secure payments through Razorpay.</li>
        </ul>
        <h2>Come and say hello</h2>
        <p>
          Got an idea for a new printable, or a story about your little one? We&apos;d love to hear it on our{" "}
          <Link href="/contact">contact page</Link>.
        </p>
      </div>
    </div>
  );
}
