import { redirect } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { canImportCampouts } from "@/lib/permissions";
import { withToast } from "@/lib/toast";
import { ImportReviewForm } from "@/components/ImportReviewForm";
import type { ImportCandidate } from "@/lib/campout-import/types";

// REQ-30.18/30.21: a batch is a short-lived staging row -- if it's missing
// (already confirmed, swept for age, or simply an invalid id), there's
// nothing to review, and nothing was ever saved either way.
export default async function CampoutImportReviewPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const actor = await getActor();
  if (!canImportCampouts(actor)) {
    redirect("/campouts");
  }

  const batch = await db.campoutImportBatch.findUnique({ where: { id: batchId } });
  if (!batch) {
    redirect(withToast("/campouts/import", "This import has expired -- please upload the file again."));
  }

  const candidates = batch.candidates as unknown as ImportCandidate[];

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h5">Review import</Typography>
        <Typography variant="body2" color="text.secondary">
          From {batch.sourceFileName}. Nothing is saved until you confirm below -- edit any field, pick a different
          thumbnail, or discard a campout you don&apos;t want.
        </Typography>
      </Stack>
      <ImportReviewForm batchId={batch.id} sourceFileName={batch.sourceFileName} initialCandidates={candidates} />
    </Stack>
  );
}
