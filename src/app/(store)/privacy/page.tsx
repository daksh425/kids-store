import type { Metadata } from "next";
import { PolicyPage } from "@/components/store/policy-page";
import { STORE_NAME } from "@/lib/catalog";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy policy">
      <p>{STORE_NAME} collects only what we need to deliver your downloads and look after your orders.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Your name, email and (optionally) phone number when you check out or get a free resource.</li>
        <li>Order details: what you bought, when, and the payment reference from Razorpay.</li>
        <li>Download activity, so we can enforce download limits and help if something goes wrong.</li>
        <li>Anonymous browsing statistics such as which products are viewed.</li>
      </ul>
      <h2>What we don&apos;t collect</h2>
      <p>We never see or store your card, UPI or bank details. Payments are handled entirely by Razorpay.</p>
      <h2>How we use it</h2>
      <p>To send your download links and order confirmations, answer your messages, and improve our products. We don&apos;t sell your data.</p>
      <h2>Children</h2>
      <p>Our products are for children, but purchases are made by parents, guardians and teachers. We don&apos;t knowingly collect data from children.</p>
      <h2>Your choices</h2>
      <p>Contact us at any time to see, correct or delete the information we hold about you.</p>
    </PolicyPage>
  );
}
