import { Clock, Mail, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  return (
    <div className="container-page py-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Contact us</h1>
          <p className="mt-3 text-lg text-muted">A download giving you trouble, an idea for a new printable, or just a hello? We read every message.</p>
          <ul className="mt-6 space-y-4">
            <li className="flex gap-3">
              <MessageCircle className="mt-0.5 shrink-0 text-primary" />
              <span>Download trouble? Include your order number (it starts with #) and we&apos;ll sort it out.</span>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 shrink-0 text-primary" />
              <span>We reply within one working day, Monday to Saturday.</span>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 shrink-0 text-primary" />
              <span>Your confirmation email has your download links too, so check it first.</span>
            </li>
          </ul>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
