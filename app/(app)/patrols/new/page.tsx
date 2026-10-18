import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CreatePatrolForm } from "@/components/CreatePatrolForm";

export default function NewPatrolPage() {
  return (
    <Stack spacing={3} sx={{ maxWidth: 500 }}>
      <Typography variant="h5">Create a patrol</Typography>
      <CreatePatrolForm />
    </Stack>
  );
}
