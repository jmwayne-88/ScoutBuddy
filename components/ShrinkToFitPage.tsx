"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { computeShrinkToFitSize } from "@/lib/shrink-to-fit";

const MIN_FONT_SIZE_PT = 8;
const MAX_FONT_SIZE_PT = 12;
const STEP_PT = 0.5;

// Mirrors Word's own "shrink to fit" / "shrink one page" behavior: render
// at a normal size, measure the actual rendered content height against
// the page's real available space, and step the font size down (never
// below MIN_FONT_SIZE_PT) until it genuinely fits -- real DOM layout
// measurement, not a guess from a row count. This only works client-side
// (nothing server-rendered can measure real layout), which is why this is
// the one Client Component on an otherwise server-rendered print page.
// useLayoutEffect (not useEffect) runs before the browser paints, so the
// un-shrunk size is never actually visible to the user.
//
// If content still doesn't fit even at the 8pt floor, this leaves it at
// 8pt and does nothing further -- print.module.css's `.printPage` already
// switches to `overflow: visible` under `@media print`, so an unusually
// large page naturally spills onto a further printed page via the
// browser's own pagination rather than being silently clipped.
export function ShrinkToFitPage({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(MAX_FONT_SIZE_PT);

  useLayoutEffect(() => {
    const page = pageRef.current;
    const content = contentRef.current;
    if (!page || !content) return;

    const style = getComputedStyle(page);
    const availableHeight = page.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);

    const size = computeShrinkToFitSize(
      (candidate) => {
        content.style.fontSize = `${candidate}pt`;
        return content.scrollHeight;
      },
      availableHeight,
      { min: MIN_FONT_SIZE_PT, max: MAX_FONT_SIZE_PT, step: STEP_PT }
    );
    content.style.fontSize = `${size}pt`;
    setFontSize(size);
  }, []);

  return (
    <div ref={pageRef} className={className}>
      <div ref={contentRef} style={{ fontSize: `${fontSize}pt` }}>
        {children}
      </div>
    </div>
  );
}
