import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import { PatrolColorField } from "@/components/PatrolColorField";
import { SubmitButton } from "@/components/SubmitButton";
import { createPatrol } from "../actions";

export default async function NewPatrolPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; name?: string; type?: string; order?: string }>;
}) {
  const { error, name, type, order } = await searchParams;

  return (
    <Stack spacing={3} sx={{ maxWidth: 500 }}>
      <Typography variant="h5">Create a patrol</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack component="form" action={createPatrol} spacing={2}>
        <TextField name="name" label="Patrol name" defaultValue={name ?? ""} required fullWidth />
        <PatrolColorField name="color" defaultValue="#1d4ed8" previewLabel={name ?? "Preview"} />
        <TextField name="type" label="Type" select defaultValue={type ?? "YOUTH"} fullWidth>
          <MenuItem value="YOUTH">Youth</MenuItem>
          <MenuItem value="ADULT">Adult</MenuItem>
        </TextField>
        <TextField
          name="order"
          label="Order (optional — defaults to last)"
          type="number"
          defaultValue={order ?? ""}
          fullWidth
        />
        <SubmitButton variant="contained" sx={{ alignSelf: "flex-start" }}>
          Create patrol
        </SubmitButton>
      </Stack>
    </Stack>
  );
}
