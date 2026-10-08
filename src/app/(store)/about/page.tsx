import { Heart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { STORE_NAME } from "@/lib/catalog";

export const metadata: Metadata = { title: "About us" };

export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <Heart size={36} className="fill-coral text-coral" />
      <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">About {STORE_NAME}</h1>
      <div className="prose-simple mt-6 text-lg">
        <p>
          {STORE_NAME} makes printable learning resources for children aged 2 to 12: story e-books, colouring books, activity
          books, worksheets and learning packs.
        </p>
        <p>
          We believe the best learning happens when children are having fun. Every resource is designed to be picked up in a
          spare ten minutes, printed at home or school, and enjoyed again and again.
        </p>
        <h2>What makes us different</h2>
        <ul>
          <li>Instant digital downloads: no shipping, no waiting.</li>
          <li>Resources grouped by age so you always find the right level.</li>
          <li>Fair, low prices with bigger savings on bundles.</li>
          <li>Secure payments through Razorpay.</li>
        </ul>
        <h2>Say hello</h2>
        <p>
          Ideas, feedback or a request for a new activity pack? We&apos;d love to hear from you on our{" "}
          <Link href="/contact">contact page</Link>.
        </p>
      </div>
    </div>
  );
}
