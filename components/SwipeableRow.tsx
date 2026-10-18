"use client";

import { useRef, useState, type ReactNode, type TouchEvent } from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

// REQ-16.5-16.7: on a touch-sized viewport (below the theme's `sm`
// breakpoint), swiping a row left reveals `actions` -- an alternate
// gesture for the same rename/remove icon buttons REQ-16.1-16.3 already
// render, never new functionality of its own. Dragging past a second,
// larger threshold submits the form named by `deleteFormId` directly
// (REQ-16.6), via the same id-linking convention RenameDishDialog/
// EditIngredientDialog already use for their own Save buttons, rather
// than requiring ref-forwarding through RemoveIconButton.
//
// At `sm` and above, this renders a plain inline row with no swipe
// mechanics at all (REQ-16.7).
//
// The actions tray is revealed by animating its own *width* from 0 up to
// ACTIONS_WIDTH, not by translating the whole row left -- translating the
// row instead (an earlier version of this component did that) scrolls
// short, left-aligned content like a one-word dish name entirely out of
// view once the shift exceeds the text's own width, which is confirmed
// wrong by running the app: swiping revealed the icons but made the dish
// name disappear instead of staying put while the tray opens beside it.
const ACTIONS_WIDTH = 96;
const DELETE_THRESHOLD = ACTIONS_WIDTH * 1.6;

export function SwipeableRow({
  children,
  actions,
  deleteFormId,
}: {
  children: ReactNode;
  actions: ReactNode;
  deleteFormId?: string;
}) {
  const theme = useTheme();
  const isTouchSized = useMediaQuery(theme.breakpoints.down("sm"));
  const [dragAmount, setDragAmount] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);

  if (!actions) {
    return <>{children}</>;
  }

  if (!isTouchSized) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
        {actions}
      </Box>
    );
  }

  function handleTouchStart(e: TouchEvent) {
    startX.current = e.touches[0].clientX;
    setDragging(true);
  }

  function handleTouchMove(e: TouchEvent) {
    if (startX.current === null) return;
    const base = revealed ? ACTIONS_WIDTH : 0;
    const delta = startX.current - e.touches[0].clientX; // positive while dragging left
    setDragAmount(Math.min(DELETE_THRESHOLD, Math.max(0, base + delta)));
  }

  function handleTouchEnd() {
    setDragging(false);
    startX.current = null;

    if (dragAmount >= DELETE_THRESHOLD && deleteFormId) {
      const form = document.getElementById(deleteFormId);
      if (form instanceof HTMLFormElement) form.requestSubmit();
      setRevealed(false);
      setDragAmount(0);
      return;
    }

    if (dragAmount > ACTIONS_WIDTH / 2) {
      setRevealed(true);
      setDragAmount(ACTIONS_WIDTH);
    } else {
      setRevealed(false);
      setDragAmount(0);
    }
  }

  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{ display: "flex", alignItems: "center", touchAction: "pan-y" }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      <Box
        sx={{
          display: "flex",
          flexShrink: 0,
          justifyContent: "flex-end",
          overflow: "hidden",
          // Visually caps at ACTIONS_WIDTH even while dragAmount keeps
          // growing toward DELETE_THRESHOLD, so over-swiping past the
          // tray's natural size reads as resistance, not a widening gap.
          width: Math.min(ACTIONS_WIDTH, dragAmount),
          transition: dragging ? "none" : "width 0.2s ease",
        }}
      >
        {actions}
      </Box>
    </Box>
  );
}
