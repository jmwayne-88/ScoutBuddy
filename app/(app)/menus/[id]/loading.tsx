import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";

// REQ-21.1/21.2: echoes the menu page's header-plus-meal-progress-plus-
// occasion-cards shape -- one card skeleton per standard meal occasion.
export default function MenuLoading() {
  return (
    <Stack spacing={4} sx={{ maxWidth: 900 }}>
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Skeleton variant="text" width={220} height={40} />
          <Skeleton variant="rounded" width={80} height={28} />
        </Stack>
        <Skeleton variant="text" width={160} />
      </Stack>
      <Skeleton variant="rounded" height={56} />
      <Stack spacing={3}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Skeleton variant="text" width={180} height={28} />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
            </Stack>
          </Paper>
        ))}
      </Stack>
      <Stack spacing={2}>
        <Skeleton variant="text" width={100} height={28} />
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={72} />
      </Stack>
    </Stack>
  );
}
