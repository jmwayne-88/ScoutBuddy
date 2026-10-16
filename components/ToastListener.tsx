"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// REQ-13.1-13.5: the single shared toast mechanism every mutating Server
// Action uses (via lib/toast.ts's withToast, on its post-mutation redirect).
// A `?toast=` (and optional `?celebrate=1`) query param on the destination
// is read once here, shown, then stripped from the URL -- so a refresh or
// back-navigation never re-shows or re-fires it. This mounts once in
// app/(app)/layout.tsx, outside any individual page or dialog, so new
// actions get the same behavior for free.
export function ToastListener() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{ message: string; celebrate: boolean } | null>(null);
  const handledRef = useRef<string | null>(null);

  const toastParam = searchParams.get("toast");
  const celebrateParam = searchParams.get("celebrate") === "1";

  useEffect(() => {
    if (!toastParam || handledRef.current === toastParam) return;
    handledRef.current = toastParam;
    setToast({ message: toastParam, celebrate: celebrateParam });

    const params = new URLSearchParams(searchParams);
    params.delete("toast");
    params.delete("celebrate");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [toastParam, celebrateParam, pathname, router, searchParams]);

  return (
    <Snackbar
      open={toast !== null}
      autoHideDuration={toast?.celebrate ? 6000 : 4000}
      onClose={() => setToast(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        onClose={() => setToast(null)}
        severity={toast?.celebrate ? "success" : "info"}
        variant="filled"
        role="status"
        aria-live="polite"
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
