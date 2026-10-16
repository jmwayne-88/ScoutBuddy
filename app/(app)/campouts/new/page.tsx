import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { SubmitButton } from "@/components/SubmitButton";
import { createCampout } from "../actions";

export default function NewCampoutPage() {
  return (
    <Stack spacing={3} sx={{ maxWidth: 600 }}>
      <Typography variant="h5">Create a campout</Typography>
      <form action={createCampout}>
        <Stack spacing={2}>
          <TextField name="name" label="Campout name" required fullWidth />
          <TextField
            name="date"
            label="Date"
            type="date"
            required
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField name="location" label="Location (optional)" placeholder="e.g. Eagle Lake, Pine Ridge" fullWidth />
          <TextField name="description" label="Description (optional)" multiline rows={2} fullWidth />
          <TextField name="imageUrl" label="Photo URL (optional)" type="url" placeholder="https://..." fullWidth />
          <SubmitButton variant="contained" color="primary" sx={{ alignSelf: "flex-start" }}>
            Create campout
          </SubmitButton>
        </Stack>
      </form>
    </Stack>
  );
}
