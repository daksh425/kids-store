import { BookX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FlipBook } from "@/components/flip-book";
import { findReadableDownload } from "@/lib/downloads";

export const metadata: Metadata = { title: "Reading", robots: { index: false } };

const MESSAGES = {
  invalid: "This book link isn't valid.",
  expired: "This book link has expired. Contact us and we'll happily renew it.",
  "not-pdf": "This product can't be opened as a book. Download it from your order page instead.",
};

export default async function ReadPage({ params }: PageProps<"/read/[token]">) {
  const { token } = await params;
  const found = await findReadableDownload(token);

  if ("error" in found) {
    const back = "orderId" in found && found.orderId ? `/order/${found.orderId}` : "/orders";
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div className="card max-w-md p-8">
          <BookX size={40} className="mx-auto text-primary" />
          <p className="mt-4 font-display text-2xl font-semibold">{MESSAGES[found.error ?? "invalid"]}</p>
          <Link href={back} className="btn btn-primary mt-6">
            Back to my order
          </Link>
        </div>
      </main>
    );
  }

  const { dl } = found;
  const downloadsLeft = dl.maxDownloads - dl.downloadCount;
  return (
    <FlipBook
      src={`/api/read/${token}`}
      title={dl.product.title}
      backHref={`/order/${dl.orderId}`}
      downloadHref={downloadsLeft > 0 ? `/download/${token}` : null}
    />
  );
}
