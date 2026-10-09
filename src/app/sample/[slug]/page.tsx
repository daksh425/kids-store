import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlipBook } from "@/components/flip-book";
import { LANDING_PAGES } from "@/lib/catalog";
import { db } from "@/lib/db";

export async function generateMetadata({ params }: PageProps<"/sample/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await db.product.findFirst({ where: { slug, status: "PUBLISHED" }, select: { title: true } });
  return p ? { title: `Read a free sample: ${p.title}` } : {};
}

export default async function SamplePage({ params }: PageProps<"/sample/[slug]">) {
  const { slug } = await params;
  const product = await db.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, title: true, sampleFile: true },
  });
  if (!product?.sampleFile) notFound();
  const home = LANDING_PAGES[slug] ?? `/product/${slug}`;
  return (
    <FlipBook
      src={`/api/sample/${slug}`}
      title={`${product.title} · Free sample`}
      backHref={home}
      backLabel="About the book"
      downloadHref={null}
      action={{ href: `/checkout?buy=${product.id}`, label: "Get the full book" }}
    />
  );
}
