import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";

// REQ-21.1/21.2: echoes the patrol list's header-plus-row shape -- a
// move-arrows column, an icon swatch, name/subtitle lines, and an action
// button, per row.
export default function PatrolsLoading() {
  return (
    <Stack spacing={3} sx={{ maxWidth: 800 }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Skeleton variant="text" width={160} height={36} />
        <Skeleton variant="rounded" width={120} height={36} />
      </Stack>
      <Stack spacing={1.5}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Skeleton variant="rounded" width={32} height={32} />
              <Stack sx={{ flex: 1 }}>
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="25%" />
              </Stack>
              <Skeleton variant="rounded" width={64} height={32} />
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
