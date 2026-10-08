import Link from "next/link";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="container-page flex flex-1 flex-col items-center py-24 text-center">
        <p className="font-display text-8xl font-bold text-primary">404</p>
        <h1 className="mt-4 font-display text-3xl font-bold">Oops, this page went out to play</h1>
        <p className="mt-2 text-muted">We couldn&apos;t find what you were looking for.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/" className="btn btn-primary">Go home</Link>
          <Link href="/kids" className="btn btn-outline">Browse resources</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
