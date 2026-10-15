import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import { db } from "@/lib/db";
import { getActivePatrols, getAllPatrols } from "@/lib/patrols";
import { MEAL_OCCASIONS, mealOccasionLabel } from "@/lib/constants";
import { contrastText } from "@/lib/colors";
import { campoutProgress, menuDishCount, menuStatusColor } from "@/lib/progress";
import { NavLink } from "@/components/NavLink";
import { RemoveFromCampoutDialog } from "@/components/RemoveFromCampoutDialog";
import { AddPatrolToCampoutDialog } from "@/components/AddPatrolToCampoutDialog";
import { assignMenu, removeOccasion, removePatrolFromCampout, restoreOccasion } from "./actions";

export default async function CampoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const campout = await db.campout.findUnique({
    where: { id },
    include: {
      menus: { include: { patrol: true, meals: { include: { dishes: true } } } },
      mealFrameworkExceptions: { include: { patrol: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!campout) notFound();

  const activePatrols = await getActivePatrols();
  const allPatrols = await getAllPatrols();

  const menuByPatrolId = new Map(campout.menus.map((menu) => [menu.patrolId, menu]));
  // REQ-10: the patrol roster is unbounded (Requirement 8), so this page no
  // longer shows a row for every active patrol — only for patrols that
  // currently have a menu here (active or not, so deactivating a patrol
  // still never hides its existing history — Requirement 8, Decision 3).
  // Everything else is reachable through the single Add-patrol picker below.
  const assignedPatrols = allPatrols.filter((p) => menuByPatrolId.has(p.id));
  const addablePatrols = activePatrols.filter((p) => !menuByPatrolId.has(p.id));
  const progress = campoutProgress(
    campout.menus.map((m) => m.status),
    activePatrols.length
  );

  return (
    <Stack spacing={4}>
      <Box
        sx={{
          position: "relative",
          borderRadius: 2,
          overflow: "hidden",
          height: 192,
          display: "flex",
          alignItems: "flex-end",
          p: 2,
          color: "common.white",
          ...(campout.imageUrl
            ? { backgroundImage: `url(${campout.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { bgcolor: "brand.olive" }),
        }}
      >
        <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.4)" }} aria-hidden="true" />
        <Chip
          label={`${progress.approved}/${progress.total} approved`}
          size="small"
          sx={{ position: "absolute", top: 12, right: 12, bgcolor: "rgba(0,0,0,0.6)", color: "common.white" }}
        />
        <Stack sx={{ position: "relative" }} spacing={0.5}>
          <Typography variant="h4" component="h1">
            {campout.name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {campout.date.toDateString()}
            {campout.location && <> · {campout.location}</>}
          </Typography>
        </Stack>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              MENU PROGRESS
            </Typography>
            <Typography variant="body2" sx={{ color: progress.dotColor }}>
              {progress.label}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress.percent}
            sx={{
              height: 8,
              borderRadius: 1,
              bgcolor: "brand.lightTan",
              "& .MuiLinearProgress-bar": { bgcolor: progress.dotColor },
            }}
          />
          <Typography variant="body2" color="text.secondary" align="right">
            {progress.percent}%
          </Typography>
        </Stack>
      </Paper>

      {campout.description && (
        <Typography
          sx={{ borderLeft: 4, borderColor: "divider", pl: 2, fontStyle: "italic", color: "text.secondary" }}
        >
          {campout.description}
        </Typography>
      )}

      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Patrols
          </Typography>
          <AddPatrolToCampoutDialog
            campoutId={campout.id}
            patrols={addablePatrols}
            assignAction={assignMenu}
          />
        </Stack>
        <Grid container spacing={2}>
          {assignedPatrols.map((p) => {
            const menu = menuByPatrolId.get(p.id)!;
            return (
              <Grid key={p.id} size={{ xs: 12, sm: 6 }}>
                <Paper variant="outlined" sx={{ overflow: "hidden" }}>
                  <Stack
                    direction="row"
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 2,
                      py: 1.5,
                      bgcolor: p.color,
                      color: contrastText(p.color),
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {p.name}
                    </Typography>
                    <Chip
                      label={menu.status.replace(/_/g, " ")}
                      size="small"
                      sx={{ bgcolor: menuStatusColor(menu.status).bg, color: menuStatusColor(menu.status).text }}
                    />
                  </Stack>
                  <Stack spacing={1.5} sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Due {menu.dueDate.toDateString()} · {menuDishCount(menu.meals)} dishes planned
                    </Typography>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <NavLink href={`/menus/${menu.id}`} variant="body2">
                        View menu
                      </NavLink>
                      <RemoveFromCampoutDialog
                        campoutId={campout.id}
                        patrolId={p.id}
                        patrolName={p.name}
                        dishCount={menuDishCount(menu.meals)}
                        isApproved={menu.status === "APPROVED"}
                        removeAction={removePatrolFromCampout}
                      />
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Stack>

      <Stack spacing={1.5} sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Meal framework for this campout
        </Typography>
        {campout.mealFrameworkExceptions.length > 0 && (
          <Stack spacing={1} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {campout.mealFrameworkExceptions.map((exception) => (
              <Stack
                key={exception.id}
                component="li"
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", typography: "body2" }}
              >
                <span>
                  {mealOccasionLabel(exception.occasion)} removed for{" "}
                  {exception.patrol ? exception.patrol.name : "all patrols"}
                </span>
                <Box component="form" action={restoreOccasion}>
                  <input type="hidden" name="exceptionId" value={exception.id} />
                  <Button type="submit" variant="text" size="small" sx={{ color: "text.secondary" }}>
                    Restore
                  </Button>
                </Box>
              </Stack>
            ))}
          </Stack>
        )}
        <Stack
          component="form"
          action={removeOccasion}
          direction="row"
          sx={{ flexWrap: "wrap", alignItems: "flex-end", gap: 1.5 }}
        >
          <input type="hidden" name="campoutId" value={campout.id} />
          <TextField
            name="occasion"
            label="Occasion"
            select
            required
            size="small"
            defaultValue={MEAL_OCCASIONS[0].value}
            sx={{ minWidth: 200 }}
          >
            {MEAL_OCCASIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField name="scope" label="For" select required size="small" defaultValue="ALL" sx={{ minWidth: 160 }}>
            <MenuItem value="ALL">All patrols</MenuItem>
            {activePatrols.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
          <Button
            type="submit"
            variant="contained"
            size="small"
            sx={{ bgcolor: "brand.olive", "&:hover": { bgcolor: "brand.olive", filter: "brightness(0.9)" } }}
          >
            Remove occasion
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
