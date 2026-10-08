import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/store/policy-page";
import { downloadPolicy } from "@/lib/config";

export const metadata: Metadata = { title: "Refund & download policy" };

export default function RefundPolicyPage() {
  return (
    <PolicyPage title="Refund & download policy">
      <h2>Downloads</h2>
      <ul>
        <li>Your files are available immediately after payment, on the order page and in your confirmation email.</li>
        <li>
          Each file can be downloaded {downloadPolicy.limit} times within {downloadPolicy.expiryDays} days of purchase. Save the PDF to
          your device the first time, and you can print it whenever you like.
        </li>
        <li>
          Lost your file after the limit? <Link href="/contact">Contact us</Link> with your order number and we&apos;ll renew your link.
        </li>
      </ul>
      <h2>Refunds</h2>
      <p>
        Because digital products can&apos;t be returned, we don&apos;t usually offer refunds once a file has been downloaded. We will
        always refund or replace a product if:
      </p>
      <ul>
        <li>the file is damaged or won&apos;t open and we can&apos;t fix it,</li>
        <li>you were charged more than once for the same order, or</li>
        <li>the product is significantly different from its description.</li>
      </ul>
      <p>Contact us within 7 days of purchase. Approved refunds go back to your original payment method through Razorpay, usually within 5–7 working days.</p>
    </PolicyPage>
  );
}
