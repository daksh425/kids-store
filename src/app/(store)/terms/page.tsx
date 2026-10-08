import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/store/policy-page";
import { STORE_NAME } from "@/lib/catalog";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <PolicyPage title="Terms of use">
      <p>By buying or downloading from {STORE_NAME} you agree to these terms.</p>
      <h2>Your licence</h2>
      <p>
        Each purchase gives you a personal licence to download, print and use the files with your own children, or with
        the students in your own classroom. You may print as many copies as you need for that use.
      </p>
      <h2>What you can&apos;t do</h2>
      <ul>
        <li>Share, upload, resell or give away the PDF files or their contents.</li>
        <li>Sell printed copies, or use the designs in products of your own.</li>
        <li>Remove copyright notices from the files.</li>
      </ul>
      <h2>Digital delivery</h2>
      <p>
        Products are delivered only as downloads. See our <Link href="/refund-policy">refund &amp; download policy</Link> for
        download limits and what happens if something goes wrong.
      </p>
      <h2>Payments</h2>
      <p>Payments are processed securely by Razorpay. Prices are in Indian Rupees and include any applicable taxes.</p>
      <h2>Changes</h2>
      <p>We may update these terms from time to time. The version on this page applies to new purchases.</p>
    </PolicyPage>
  );
}
