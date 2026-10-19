"use client";

import { useActionState, useMemo, useState } from "react";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { SubmitButton } from "@/components/SubmitButton";
import { confirmCampoutUpload, type ConfirmUploadFormState } from "@/app/(app)/campouts/upload/actions";
import type { UploadCandidate, UploadCandidateEdit, UploadFieldKey } from "@/lib/campout-upload/types";

const initialState: ConfirmUploadFormState = { error: null };

const FIELD_LABELS: Record<UploadFieldKey, string> = {
  name: "Name",
  date: "Start date",
  endDate: "End date",
  location: "Location",
  description: "Description",
};

function isIncomplete(candidate: UploadCandidate): boolean {
  return !candidate.name?.trim() || !candidate.date;
}

function CandidateCard({
  candidate,
  onChange,
}: {
  candidate: UploadCandidate;
  onChange: (next: UploadCandidate) => void;
}) {
  const incomplete = !candidate.discarded && isIncomplete(candidate);

  function field<K extends "name" | "date" | "endDate" | "location" | "description">(key: K) {
    return {
      value: candidate[key] ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...candidate, [key]: e.target.value || null }),
    };
  }

  function previousHint(key: UploadFieldKey) {
    if (!candidate.changedFields.includes(key)) return null;
    const prev = candidate.previousValues[key];
    return (
      <Typography variant="caption" color="text.secondary">
        Was: {prev || "(empty)"}
      </Typography>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, opacity: candidate.discarded ? 0.5 : 1 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          {candidate.matchedCampoutId ? (
            <Chip size="small" color="primary" variant="outlined" label={`Updates "${candidate.matchedCampoutName}"`} />
          ) : (
            <Chip size="small" color="success" variant="outlined" label="New campout" />
          )}
          <Button size="small" onClick={() => onChange({ ...candidate, discarded: !candidate.discarded })}>
            {candidate.discarded ? "Keep" : "Discard"}
          </Button>
        </Stack>

        {!candidate.discarded && (
          <>
            {incomplete && <Alert severity="warning">Needs a name and a start date before it can be uploaded.</Alert>}

            <Stack spacing={0.5}>
              <TextField label={FIELD_LABELS.name} {...field("name")} error={!candidate.name?.trim()} fullWidth size="small" />
              {previousHint("name")}
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Stack spacing={0.5} sx={{ flex: 1 }}>
                <TextField
                  label={FIELD_LABELS.date}
                  type="date"
                  {...field("date")}
                  error={!candidate.date}
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                {previousHint("date")}
              </Stack>
              <Stack spacing={0.5} sx={{ flex: 1 }}>
                <TextField
                  label={`${FIELD_LABELS.endDate} (optional)`}
                  type="date"
                  {...field("endDate")}
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                {previousHint("endDate")}
              </Stack>
            </Stack>

            <Stack spacing={0.5}>
              <TextField label={`${FIELD_LABELS.location} (optional)`} {...field("location")} fullWidth size="small" />
              {previousHint("location")}
            </Stack>

            <Stack spacing={0.5}>
              <TextField
                label={`${FIELD_LABELS.description} (optional)`}
                {...field("description")}
                multiline
                rows={2}
                fullWidth
                size="small"
              />
              {previousHint("description")}
            </Stack>

            {candidate.images.length > 0 && (
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Thumbnail {candidate.images.length > 1 ? "(choose one)" : ""}
                </Typography>
                <Stack direction="row" spacing={1}>
                  {candidate.images.map((src, i) => (
                    <Box
                      key={i}
                      component="img"
                      src={src}
                      onClick={() => onChange({ ...candidate, selectedImageIndex: i })}
                      sx={{
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: 1,
                        cursor: "pointer",
                        border: 3,
                        borderColor: candidate.selectedImageIndex === i ? "primary.main" : "transparent",
                      }}
                    />
                  ))}
                </Stack>
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}

// REQ-30.18-30.21: owns the in-progress edit state for every candidate in
// memory -- nothing round-trips to the server per edit. Navigating away
// without submitting simply discards this state; the immutable staging
// row (CampoutUploadBatch) just sits inert until it's swept by age.
//
// ADR 0032: only a lightweight UploadCandidateEdit per candidate is
// actually submitted on confirm (text fields, selected image index,
// discarded flag) -- never the `images` data-URL array itself, which the
// server already holds from upload time and re-attaches by tempId. Local
// state here still keeps the full UploadCandidate (images included) for
// rendering the thumbnail picker.
export function UploadReviewForm({
  batchId,
  initialCandidates,
}: {
  batchId: string;
  initialCandidates: UploadCandidate[];
}) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [state, formAction] = useActionState(confirmCampoutUpload, initialState);

  function updateCandidate(tempId: string, next: UploadCandidate) {
    setCandidates((prev) => prev.map((c) => (c.tempId === tempId ? next : c)));
  }

  const activeCount = candidates.filter((c) => !c.discarded).length;
  const incompleteCount = candidates.filter((c) => !c.discarded && isIncomplete(c)).length;
  const editsJson = useMemo(() => {
    const edits: UploadCandidateEdit[] = candidates.map((c) => ({
      tempId: c.tempId,
      name: c.name,
      date: c.date,
      endDate: c.endDate,
      location: c.location,
      description: c.description,
      selectedImageIndex: c.selectedImageIndex,
      discarded: c.discarded,
    }));
    return JSON.stringify(edits);
  }, [candidates]);

  return (
    <Stack component="form" action={formAction} spacing={2}>
      <input type="hidden" name="batchId" value={batchId} />
      <input type="hidden" name="edits" value={editsJson} />

      {state.error && <Alert severity="error">{state.error}</Alert>}

      {candidates.map((candidate) => (
        <CandidateCard
          key={candidate.tempId}
          candidate={candidate}
          onChange={(next) => updateCandidate(candidate.tempId, next)}
        />
      ))}

      <Divider />

      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <SubmitButton variant="contained" color="primary" disabled={activeCount === 0 || incompleteCount > 0}>
          Upload {activeCount} campout{activeCount === 1 ? "" : "s"}
        </SubmitButton>
        {incompleteCount > 0 && (
          <Typography variant="body2" color="warning.main">
            {incompleteCount} campout{incompleteCount === 1 ? "" : "s"} need{incompleteCount === 1 ? "s" : ""} a name
            and date, or can be discarded.
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
