import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";

// REQ-21.1/21.2: echoes the patrol leader page's title-plus-menu-list
// shape.
export default function PatrolLeaderLoading() {
  return (
    <Stack spacing={2} sx={{ maxWidth: 600 }}>
      <Skeleton variant="text" width={220} height={36} />
      <Stack spacing={1}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="text" width="90%" height={24} />
        ))}
      </Stack>
    </Stack>
  );
}
