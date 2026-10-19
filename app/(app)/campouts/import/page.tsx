import { redirect } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getActor } from "@/lib/session";
import { canImportCampouts } from "@/lib/permissions";
import { CampoutImportUploadForm } from "@/components/CampoutImportUploadForm";

// REQ-30.1/30.22: a new ASPL-only entry point alongside the manual
// single-campout form (campouts/new) -- never reachable by a Patrol
// Leader.
export default async function CampoutImportPage() {
  const actor = await getActor();
  if (!canImportCampouts(actor)) {
    redirect("/campouts");
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 600 }}>
      <Stack spacing={1}>
        <Typography variant="h5">Import campouts from a file</Typography>
        <Typography variant="body2" color="text.secondary">
          Upload a PDF or Excel file (a council calendar, a flyer, a term&apos;s camping schedule) and ScoutBuddy will
          find every campout it describes and pull out what it can -- name, dates, location, description, and a
          thumbnail if there&apos;s a usable photo. You&apos;ll review everything before anything is saved.
        </Typography>
      </Stack>
      <CampoutImportUploadForm />
    </Stack>
  );
}
