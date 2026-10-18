import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";

// REQ-21.1/21.2: echoes the campout detail page's hero-image-plus-
// progress-bar-plus-patrol-cards shape.
export default function CampoutDetailLoading() {
  return (
    <Stack spacing={4}>
      <Skeleton variant="rounded" height={192} />
      <Skeleton variant="rounded" height={64} />
      <Stack spacing={2}>
        <Skeleton variant="text" width={100} height={32} />
        <Grid container spacing={2}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6 }}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}
        </Grid>
      </Stack>
      <Stack spacing={1}>
        <Skeleton variant="text" width={240} height={32} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="60%" />
      </Stack>
    </Stack>
  );
}
