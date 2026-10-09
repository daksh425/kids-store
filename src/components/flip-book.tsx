"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2 } from "lucide-react";
import Link from "next/link";
import type { PageFlip } from "page-flip";
import { useCallback, useEffect, useRef, useState } from "react";
import "page-flip/src/Style/stPageFlip.css";

type Props = {
  src: string;
  title: string;
  backHref: string;
  backLabel?: string;
  downloadHref: string | null;
  /** Extra button in the top bar, e.g. "Buy the full book" on a free sample */
  action?: { href: string; label: string };
};

type Phase = { kind: "loading"; done: number; total: number } | { kind: "ready" } | { kind: "error"; message: string };

// Space kept for the top bar and the bottom controls around the book.
const CHROME_HEIGHT = 150;

/**
 * Renders each PDF page to an image with pdf.js, then hands them to page-flip,
 * which turns pages like a real book: the closed cover sits alone (centred),
 * then two-page spreads where the next page lifts from the right-hand edge.
 * Front and back covers are stiff; inner pages bend. Phones and narrow windows
 * get one page at a time.
 */
export function FlipBook({ src, title, backHref, backLabel = "My order", downloadHref, action }: Props) {
  const roomRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "loading", done: 0, total: 0 });
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("landscape");
  const [fullscreen, setFullscreen] = useState(false);
  // Width of an open two-page spread, so the container hugs the book and the
  // closed-cover centring shift is a true quarter of the book.
  const [bookWidth, setBookWidth] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];

    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const task = pdfjs.getDocument({ url: src });
      const pdf = await task.promise;
      if (cancelled) return;
      setPhase({ kind: "loading", done: 0, total: pdf.numPages });

      // Sharp enough for a full-screen spread on a retina display, small enough to stay quick.
      const pixelWidth = Math.round(Math.min(1100, Math.max(700, (window.innerWidth / 2) * (window.devicePixelRatio || 1))));
      let ratio = 1 / Math.SQRT2;
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const base = page.getViewport({ scale: 1 });
        if (n === 1) ratio = base.width / base.height;
        const viewport = page.getViewport({ scale: pixelWidth / base.width });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        await page.render({ canvas, viewport }).promise;
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
        page.cleanup();
        if (cancelled) return;
        if (blob) urls.push(URL.createObjectURL(blob));
        setPhase({ kind: "loading", done: n, total: pdf.numPages });
      }
      await task.destroy();
      if (cancelled || !hostRef.current) return;

      const { PageFlip } = await import("page-flip");
      if (cancelled || !hostRef.current) return;
      // page-flip removes its element on destroy, so give it one React doesn't own.
      const el = document.createElement("div");
      el.style.margin = "0 auto";
      const pages = urls.map((url, i) => {
        const page = document.createElement("div");
        page.className = "flip-page";
        if (i === 0 || i === urls.length - 1) page.dataset.density = "hard";
        const img = document.createElement("img");
        img.src = url;
        img.alt = `Page ${i + 1}`;
        img.draggable = false;
        page.appendChild(img);
        el.appendChild(page);
        return page;
      });
      hostRef.current.appendChild(el);
      const maxHeight = Math.max(320, window.innerHeight - CHROME_HEIGHT);
      const flip = new PageFlip(el, {
        width: Math.round(maxHeight * ratio),
        height: maxHeight,
        size: "stretch",
        minWidth: 260,
        maxWidth: Math.round(maxHeight * ratio),
        minHeight: Math.round(260 / ratio),
        maxHeight,
        showCover: true,
        usePortrait: true,
        drawShadow: true,
        maxShadowOpacity: 0.45,
        flippingTime: 750,
        mobileScrollSupport: false,
        showPageCorners: true,
      });
      flip.on("flip", (e) => setIndex(e.data));
      flip.on("changeOrientation", (e) => setOrientation(e.data));
      flip.on("init", (e) => setOrientation(e.data.mode));
      flip.loadFromHTML(pages);
      setBookWidth(Math.round(maxHeight * ratio) * 2);
      flipRef.current = flip;
      setTotal(urls.length);
      setPhase({ kind: "ready" });
    })().catch((err) => {
      console.error("[flip-book]", err);
      if (!cancelled) setPhase({ kind: "error", message: "We couldn't open this book. Please try again, or download the PDF instead." });
    });

    return () => {
      cancelled = true;
      flipRef.current?.destroy();
      flipRef.current = null;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [src]);

  const next = useCallback(() => flipRef.current?.flipNext(), []);
  const prev = useCallback(() => flipRef.current?.flipPrev(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") next();
      if (e.key === "ArrowLeft" || e.key === "PageUp") prev();
    };
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [next, prev]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void roomRef.current?.requestFullscreen?.();
  };

  // In a two-page spread the reader sees index and index+1 (the cover stands alone).
  const spread = orientation === "landscape" && index > 0 && index + 1 < total;
  const pageLabel = total ? (spread ? `Pages ${index + 1}–${index + 2} of ${total}` : `Page ${index + 1} of ${total}`) : "";
  const atStart = index === 0;
  const closedShift =
    phase.kind !== "ready" || orientation !== "landscape" ? 0 : index === 0 ? -25 : index === total - 1 && total % 2 === 0 ? 25 : 0;
  const atEnd = total > 0 && index + (spread ? 2 : 1) >= total;

  return (
    <div ref={roomRef} className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_center,#3a3354_0%,#1d1a2b_70%)] text-white">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <Link href={backHref} className="btn btn-sm border border-white/20 text-white hover:bg-white/10">
          <ArrowLeft size={16} /> <span className="hidden sm:inline">{backLabel}</span>
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-center font-display text-lg font-semibold sm:text-xl">{title}</h1>
        {action ? (
          <Link href={action.href} className="btn btn-sm btn-sunny">
            {action.label}
          </Link>
        ) : downloadHref ? (
          <a href={downloadHref} className="btn btn-sm btn-sunny">
            <Download size={16} /> <span className="hidden sm:inline">Download PDF</span>
          </a>
        ) : (
          <span className="w-10" />
        )}
      </header>

      <main className="relative flex flex-1 items-center justify-center px-2 sm:px-6">
        <div
          ref={hostRef}
          className={`w-full transition-[opacity,transform] duration-700 ${phase.kind === "ready" ? "opacity-100" : "opacity-0"}`}
          style={{ transform: `translateX(${closedShift}%)`, maxWidth: bookWidth ?? undefined }}
        />

        {phase.kind === "loading" ? (
          <div className="absolute inset-0 grid place-items-center" role="status" aria-live="polite">
            <div className="w-64 text-center">
              <div className="mx-auto mb-5 h-24 w-20 animate-pulse rounded-r-xl rounded-l-sm border-l-8 border-primary bg-white/90 shadow-2xl" />
              <p className="font-display text-lg font-semibold">Opening your book…</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-sunny transition-all"
                  style={{ width: phase.total ? `${(phase.done / phase.total) * 100}%` : "8%" }}
                />
              </div>
              <p className="mt-2 text-sm text-white/60">{phase.total ? `Page ${phase.done} of ${phase.total}` : "Loading"}</p>
            </div>
          </div>
        ) : null}

        {phase.kind === "error" ? (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div>
              <p className="font-display text-xl font-semibold">{phase.message}</p>
              {downloadHref ? (
                <a href={downloadHref} className="btn btn-sunny mt-5">
                  <Download size={18} /> Download PDF
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </main>

      <footer className="flex items-center justify-center gap-3 px-4 py-4">
        <button type="button" onClick={prev} disabled={phase.kind !== "ready" || atStart} className="btn border border-white/20 !px-3 text-white hover:bg-white/10" aria-label="Previous page">
          <ChevronLeft size={22} />
        </button>
        <span className="min-w-36 text-center text-sm font-bold text-white/80 tabular-nums" aria-live="polite">
          {phase.kind === "ready" ? pageLabel : ""}
        </span>
        <button type="button" onClick={next} disabled={phase.kind !== "ready" || atEnd} className="btn btn-primary !px-3" aria-label="Next page">
          <ChevronRight size={22} />
        </button>
        <button type="button" onClick={toggleFullscreen} className="btn border border-white/20 !px-3 text-white hover:bg-white/10" aria-label={fullscreen ? "Exit full screen" : "Full screen"}>
          {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </footer>
      <p className="px-4 pb-3 text-center text-xs text-white/40">
        <span className="sm:hidden">Swipe the page or tap the arrows to turn pages.</span>
        <span className="hidden sm:inline">Tip: drag a page corner, click the page edges, or use the ← → keys to turn pages.</span>
      </p>
    </div>
  );
}
