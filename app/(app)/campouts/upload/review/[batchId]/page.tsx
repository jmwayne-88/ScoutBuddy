import { redirect } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getUnitScope } from "@/lib/session";
import { canUploadCampouts } from "@/lib/permissions";
import { withToast } from "@/lib/toast";
import { UploadReviewForm } from "@/components/UploadReviewForm";
import type { UploadCandidate } from "@/lib/campout-upload/types";

// REQ-30.18/30.21: a batch is a short-lived staging row -- if it's missing
// (already confirmed, swept for age, or simply an invalid id), there's
// nothing to review, and nothing was ever saved either way.
export default async function CampoutUploadReviewPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const scope = await getUnitScope();
  if (!scope || !canUploadCampouts(scope.actor)) {
    redirect("/campouts");
  }
  const { db } = scope;

  const batch = await db.campoutUploadBatch.findUnique({ where: { id: batchId } });
  if (!batch) {
    redirect(withToast("/campouts/upload", "This upload has expired -- please upload the file again."));
  }

  const candidates = batch.candidates as unknown as UploadCandidate[];

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h5">Review upload</Typography>
        <Typography variant="body2" color="text.secondary">
          From {batch.sourceFileName}. Nothing is saved until you confirm below -- edit any field, pick a different
          thumbnail, or discard a campout you don&apos;t want.
        </Typography>
      </Stack>
      <UploadReviewForm batchId={batch.id} initialCandidates={candidates} />
    </Stack>
  );
}
