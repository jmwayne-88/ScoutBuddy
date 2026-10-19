"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { undoRemoveDish, undoRemoveIngredient } from "@/app/(app)/menus/[id]/actions";
import { restoreOccasion } from "@/app/(app)/campouts/[id]/actions";

// REQ-15.4: the Server Actions a Tier 2 destructive action's Undo button
// can trigger, keyed by the string name that action passes to lib/toast.ts's
// withToast(..., { undo: { action: "<key>", payload } }). "removeOccasion"
// reuses the existing restoreOccasion action rather than a new one -- see
// docs/requirements/15-consistent-destructive-action-pattern.md.
const UNDO_ACTIONS: Record<string, (formData: FormData) => void | Promise<void>> = {
  removeDish: undoRemoveDish,
  removeIngredient: undoRemoveIngredient,
  removeOccasion: restoreOccasion,
};

type ToastState = {
  message: string;
  celebrate: boolean;
  undoAction: string | null;
  undoPayload: Record<string, unknown> | null;
};

// REQ-13.1-13.5: the single shared toast mechanism every mutating Server
// Action uses (via lib/toast.ts's withToast, on its post-mutation redirect).
// A `?toast=` (and optional `?celebrate=1`, or `?undoAction=`/`?undoPayload=`
// per REQ-15.4) on the destination is read once here, shown, then stripped
// from the URL -- so a refresh or back-navigation never re-shows or
// re-fires it. This mounts once in app/(app)/layout.tsx, outside any
// individual page or dialog, so new actions get the same behavior for free.
export function ToastListener() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isUndoing, startUndoTransition] = useTransition();
  const handledRef = useRef<string | null>(null);

  const toastParam = searchParams.get("toast");
  const celebrateParam = searchParams.get("celebrate") === "1";
  const undoActionParam = searchParams.get("undoAction");
  const undoPayloadParam = searchParams.get("undoPayload");

  useEffect(() => {
    if (!toastParam || handledRef.current === toastParam) return;
    handledRef.current = toastParam;

    let undoPayload: Record<string, unknown> | null = null;
    if (undoPayloadParam) {
      try {
        undoPayload = JSON.parse(undoPayloadParam);
      } catch {
        undoPayload = null;
      }
    }

    setToast({ message: toastParam, celebrate: celebrateParam, undoAction: undoActionParam, undoPayload });

    const params = new URLSearchParams(searchParams);
    params.delete("toast");
    params.delete("celebrate");
    params.delete("undoAction");
    params.delete("undoPayload");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [toastParam, celebrateParam, undoActionParam, undoPayloadParam, pathname, router, searchParams]);

  function handleUndo() {
    if (!toast?.undoAction || !toast.undoPayload) return;
    const action = UNDO_ACTIONS[toast.undoAction];
    if (!action) return;

    const formData = new FormData();
    for (const [key, value] of Object.entries(toast.undoPayload)) {
      formData.set(key, typeof value === "string" ? value : JSON.stringify(value));
    }

    startUndoTransition(() => {
      action(formData);
    });
    setToast(null);
  }

  const canUndo = Boolean(toast?.undoAction);

  return (
    <Snackbar
      open={toast !== null}
      autoHideDuration={toast?.celebrate || canUndo ? 6000 : 4000}
      onClose={() => setToast(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      // REQ-23.4: clears components/BottomNav.tsx's fixed mobile bar instead
      // of being hidden behind it.
      sx={{ bottom: { xs: "calc(56px + env(safe-area-inset-bottom) + 8px)", sm: 24 } }}
    >
      <Alert
        severity={toast?.celebrate ? "success" : "info"}
        variant="filled"
        role="status"
        aria-live="polite"
        action={
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            {canUndo && (
              <Button color="inherit" size="small" onClick={handleUndo} disabled={isUndoing}>
                Undo
              </Button>
            )}
            <IconButton size="small" color="inherit" aria-label="Close" onClick={() => setToast(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        }
        sx={
          toast?.celebrate
            ? {
                "@keyframes scoutbuddy-celebrate": {
                  "0%": { transform: "scale(0.85)" },
                  "60%": { transform: "scale(1.04)" },
                  "100%": { transform: "scale(1)" },
                },
                "@media (prefers-reduced-motion: no-preference)": {
                  animation: "scoutbuddy-celebrate 0.4s ease-out",
                },
              }
            : undefined
        }
      >
        {toast?.message}
      </Alert>
    </Snackbar>
  );
}
