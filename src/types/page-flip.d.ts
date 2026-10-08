// page-flip ships no type definitions; this covers the parts the book reader uses.
declare module "page-flip" {
  export type FlipSettings = {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    showCover?: boolean;
    usePortrait?: boolean;
    drawShadow?: boolean;
    maxShadowOpacity?: number;
    flippingTime?: number;
    mobileScrollSupport?: boolean;
    showPageCorners?: boolean;
    startPage?: number;
  };
  export class PageFlip {
    constructor(element: HTMLElement, settings: FlipSettings);
    loadFromImages(urls: string[]): void;
    loadFromHTML(items: HTMLElement[] | NodeListOf<HTMLElement>): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    turnToPage(index: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): "portrait" | "landscape";
    update(): void;
    destroy(): void;
    on(event: "flip", cb: (e: { data: number }) => void): this;
    on(event: "changeOrientation", cb: (e: { data: "portrait" | "landscape" }) => void): this;
    on(event: "init", cb: (e: { data: { page: number; mode: "portrait" | "landscape" } }) => void): this;
  }
}
