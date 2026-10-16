"use client";

import { useFormStatus } from "react-dom";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import type { ButtonProps } from "@mui/material/Button";

// REQ-14.1-14.3: one shared pending-state button for every Server-Action-
// backed submit control, so a slow mutation (or a double click) can't look
// like a dead/broken button.
//
// When rendered as a literal descendant of the <form> it submits, `pending`
// is read automatically via useFormStatus -- the common case, since most
// forms in this app are plain <form action={serverAction}> built directly
// in a Server Component. A dialog whose submit button lives in
// DialogActions, linked to its <form> only by the HTML `form` attribute
// (MUI's usual Dialog layout), is NOT a literal descendant, so
// useFormStatus can't see it there; those callers track pending themselves
// (useTransition) and pass it in as `pendingOverride` instead -- see
// components/RenameDishDialog.tsx.
export function SubmitButton({
  children,
  startIcon,
  iconOnly = false,
  pendingOverride,
  disabled,
  ...props
}: ButtonProps & { iconOnly?: boolean; pendingOverride?: boolean }) {
  const formStatus = useFormStatus();
  const pending = pendingOverride ?? formStatus.pending;
  const spinner = <CircularProgress size={16} color="inherit" />;

  return (
    <Button
      {...props}
      type="submit"
      disabled={pending || disabled}
      startIcon={!iconOnly ? (pending ? spinner : startIcon) : undefined}
    >
      {iconOnly && pending ? spinner : children}
    </Button>
  );
}
