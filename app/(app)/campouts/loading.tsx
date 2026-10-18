import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";

// REQ-21.1: echoes the campouts layout's own shape -- sidebar header,
// campout-card-shaped rows, and a content placeholder -- while its db
// query (campouts + active patrols) resolves.
export default function CampoutsLoading() {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
      <Box component="aside" sx={{ width: { xs: "100%", md: 288 }, flexShrink: 0 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Skeleton variant="text" width={120} height={32} />
            <Skeleton variant="rounded" width={88} height={32} />
          </Stack>
          <Stack spacing={1}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={64} />
            ))}
          </Stack>
        </Stack>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={192} />
          <Skeleton variant="rounded" height={64} />
        </Stack>
      </Box>
    </Stack>
  );
}
