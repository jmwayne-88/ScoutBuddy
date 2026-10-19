import { notFound } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { canCommentOnMenu, canEditMenu, canReview, canSubmitMenu } from "@/lib/permissions";
import { menuHasEmptyOccasion } from "@/lib/validation";
import { MEAL_OCCASIONS } from "@/lib/constants";
import { formatDueDate } from "@/lib/dates";
import { menuMealProgress, menuStatusColor } from "@/lib/progress";
import { nestReplies } from "@/lib/comments";
import { EMPTY_STATES } from "@/lib/empty-states";
import { EmptyState } from "@/components/EmptyState";
import { PatrolBadge } from "@/components/PatrolBadge";
import { RelativeDate } from "@/components/RelativeDate";
import { ReviewThread } from "@/components/ReviewThread";
import type { CommentTarget } from "@/components/CommentThread";
import { CommentPane } from "@/components/CommentPane";
import { CommentActivityLog } from "@/components/CommentActivityLog";
import { MenuStatusChip } from "@/components/MenuStatusChip";
import { StreakBadge } from "@/components/StreakBadge";
import { onTimeStreak } from "@/lib/streaks";
import { NavLink } from "@/components/NavLink";
import { LinkButton } from "@/components/LinkButton";
import { RenameDishDialog } from "@/components/RenameDishDialog";
import { EditIngredientDialog } from "@/components/EditIngredientDialog";
import { RemoveIconButton } from "@/components/RemoveIconButton";
import { SwipeableRow } from "@/components/SwipeableRow";
import { SubmitButton } from "@/components/SubmitButton";
import {
  addDish,
  addIngredient,
  approveMenu,
  editIngredient,
  rejectMenu,
  removeDish,
  removeIngredient,
  renameDish,
  submitMenu,
  updateNotes,
} from "./actions";

const ACTIVITY_PAGE_SIZE = 20;
const ACTIVITY_LIMIT_CAP = 500;

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ activityLimit?: string }>;
}) {
  const { id } = await params;
  const { activityLimit: activityLimitParam } = await searchParams;
  const actor = await getActor();

  const menu = await db.menu.findUnique({
    where: { id },
    include: {
      campout: true,
      patrol: true,
      meals: { include: { dishes: { include: { ingredients: true } } } },
      reviews: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!menu) notFound();

  // REQ-25.2: computed and shown only when the viewer is this menu's own
  // Patrol Leader -- never for the ASPL, and never comparing across patrols.
  const isOwnPatrolLeader = actor?.role === "PATROL_LEADER" && actor.patrolId === menu.patrolId;
  const streak = isOwnPatrolLeader
    ? onTimeStreak(
        await db.menu.findMany({
          where: { patrolId: menu.patrolId },
          select: { dueDate: true, submittedAt: true },
        })
      )
    : 0;

  const canEdit = canEditMenu(actor, menu);
  const canSubmit = canSubmitMenu(actor, menu);
  const canReviewMenu = canReview(actor, menu);
  const canComment = canCommentOnMenu(actor, menu);

  const mealsByOccasion = new Map(menu.meals.map((m) => [m.occasion, m]));
  const mealProgress = menuMealProgress(menu.meals);
  const statusColor = menuStatusColor(menu.status);
  const hasEmptyOccasion = menuHasEmptyOccasion(menu.meals);

  // REQ-26.1-26.5: every live (non-deleted) comment on this menu, fetched
  // once and sliced per target below -- a reply already carries its
  // root's target fields (see comment-actions.ts's replyToComment), so a
  // plain filter per target is enough; lib/comments.ts's nestReplies does
  // the root/reply grouping.
  const allComments = await db.comment.findMany({
    where: { menuId: id, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      parentId: true,
      targetType: true,
      dishId: true,
      ingredientId: true,
      body: true,
      authorRole: true,
      authorPatrolId: true,
      status: true,
      assigneeRole: true,
      createdAt: true,
    },
  });

  function commentsForTarget(target: CommentTarget) {
    return allComments.filter((c) => {
      if (target.type === "MENU") return c.targetType === "MENU";
      if (target.type === "DISH") return c.targetType === "DISH" && c.dishId === target.dishId;
      return c.targetType === "INGREDIENT" && c.ingredientId === target.ingredientId;
    });
  }

  // REQ-28.1: every comment entry point on the page shares these props --
  // only the target and its display labels differ per call site.
  const { id: menuId, patrol } = menu;
  function commentPane(target: CommentTarget, title: string, subtitle: string, variant?: "icon" | "button") {
    if (!canComment) return null;
    return (
      <CommentPane
        menuId={menuId}
        patrolColor={patrol.color}
        patrolName={patrol.name}
        target={target}
        title={title}
        subtitle={subtitle}
        comments={nestReplies(commentsForTarget(target))}
        actor={actor}
        variant={variant}
      />
    );
  }

  // REQ-26.7: newest first, an initial page plus "Load more" via
  // `?activityLimit=`, fetched as limit+1 so we know whether more exist
  // without a separate count query.
  const activityLimit = Math.min(
    ACTIVITY_LIMIT_CAP,
    Math.max(ACTIVITY_PAGE_SIZE, Number(activityLimitParam) || ACTIVITY_PAGE_SIZE)
  );
  const activityRows = await db.commentActivity.findMany({
    where: { menuId: id },
    orderBy: { createdAt: "desc" },
    take: activityLimit + 1,
    select: { id: true, action: true, actorRole: true, targetSummary: true, detail: true, createdAt: true },
  });
  const hasMoreActivity = activityRows.length > activityLimit;
  const activityEntries = activityRows.slice(0, activityLimit);

  return (
    <Stack spacing={4} sx={{ maxWidth: 900 }}>
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="h5" component="h1">
              {menu.campout.name}
            </Typography>
            <PatrolBadge name={menu.patrol.name} color={menu.patrol.color} icon={menu.patrol.icon} />
          </Stack>
          <LinkButton
            href={actor?.role === "PATROL_LEADER" ? "/patrol-leader" : `/campouts/${menu.campout.id}`}
            variant="outlined"
            size="small"
          >
            Close
          </LinkButton>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Due <RelativeDate {...formatDueDate(menu.dueDate)} />
          </Typography>
          <MenuStatusChip status={menu.status} />
          {isOwnPatrolLeader && <StreakBadge streak={streak} />}
        </Stack>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
          <Typography variant="body2">
            <NavLink href={`/menus/${menu.id}/print`}>Print preview</NavLink>
          </Typography>
          {commentPane({ type: "MENU" }, `${menu.patrol.name} menu`, "Whole menu", "button")}
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              MEAL PROGRESS
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mealProgress.withDishes}/{mealProgress.total} meals have dishes
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={mealProgress.percent}
            sx={{
              height: 8,
              borderRadius: 1,
              bgcolor: "brand.lightTan",
              "& .MuiLinearProgress-bar": { bgcolor: statusColor.bg },
            }}
          />
        </Stack>
      </Paper>

      <Stack spacing={3}>
        {MEAL_OCCASIONS.map(({ value, label }) => {
          const meal = mealsByOccasion.get(value);
          if (!meal) return null;
          return (
            <Paper key={value} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {label}
                </Typography>
                {meal.dishes.length === 0 &&
                  (() => {
                    const { Icon, message } = EMPTY_STATES.mealNoDishes(label, canEdit);
                    return <EmptyState icon={Icon}>{message}</EmptyState>;
                  })()}
                {meal.dishes.length === 0 && canSubmit && (
                  <Typography variant="body2" color="error">
                    This occasion needs at least one dish before you can submit.
                  </Typography>
                )}
                <Stack spacing={1.5} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
                  {meal.dishes.map((dish) => {
                    const removeDishFormId = `remove-dish-${dish.id}`;
                    return (
                    <Stack key={dish.id} component="li" spacing={0.5}>
                      <SwipeableRow
                        deleteFormId={removeDishFormId}
                        actions={
                          canEdit && (
                            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                              <RenameDishDialog
                                menuId={menu.id}
                                dishId={dish.id}
                                dishName={dish.name}
                                renameAction={renameDish}
                              />
                              <RemoveIconButton
                                formId={removeDishFormId}
                                label={`Remove ${dish.name}`}
                                action={removeDish}
                                hiddenFields={{ menuId: menu.id, dishId: dish.id }}
                              />
                            </Stack>
                          )
                        }
                      >
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 500 }}>{dish.name}</Typography>
                          {commentPane({ type: "DISH", dishId: dish.id }, dish.name, "Dish")}
                        </Stack>
                      </SwipeableRow>
                      <Stack spacing={0.5} component="ul" sx={{ listStyle: "none", m: 0, ml: 2, p: 0 }}>
                        {dish.ingredients.map((ing) => {
                          const removeIngredientFormId = `remove-ingredient-${ing.id}`;
                          return (
                          <Stack key={ing.id} component="li">
                            <SwipeableRow
                              deleteFormId={removeIngredientFormId}
                              actions={
                                canEdit && (
                                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                                    <EditIngredientDialog
                                      menuId={menu.id}
                                      ingredientId={ing.id}
                                      name={ing.name}
                                      quantity={ing.quantity}
                                      editAction={editIngredient}
                                    />
                                    <RemoveIconButton
                                      formId={removeIngredientFormId}
                                      label={`Remove ${ing.name}`}
                                      action={removeIngredient}
                                      hiddenFields={{ menuId: menu.id, ingredientId: ing.id }}
                                      tone="subtle"
                                    />
                                  </Stack>
                                )
                              }
                            >
                              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", minWidth: 0 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {ing.name} — {ing.quantity}
                                </Typography>
                                {commentPane({ type: "INGREDIENT", ingredientId: ing.id }, ing.name, "Ingredient")}
                              </Stack>
                            </SwipeableRow>
                          </Stack>
                          );
                        })}
                      </Stack>
                      {canEdit && (
                        <Stack
                          component="form"
                          action={addIngredient}
                          direction="row"
                          sx={{ flexWrap: "wrap", alignItems: "flex-end", gap: 1, ml: 2 }}
                        >
                          <input type="hidden" name="menuId" value={menu.id} />
                          <input type="hidden" name="dishId" value={dish.id} />
                          <TextField name="name" label="Ingredient" required size="small" />
                          <TextField name="quantity" label="Quantity (per person)" required size="small" />
                          <SubmitButton variant="text" size="small">
                            Add ingredient
                          </SubmitButton>
                        </Stack>
                      )}
                    </Stack>
                    );
                  })}
                </Stack>
                {canEdit && (
                  <Stack component="form" action={addDish} direction="row" sx={{ alignItems: "flex-end", gap: 1 }}>
                    <input type="hidden" name="menuId" value={menu.id} />
                    <input type="hidden" name="mealId" value={meal.id} />
                    <TextField name="name" label="Dish name" required size="small" />
                    <SubmitButton variant="text" size="small">
                      Add dish
                    </SubmitButton>
                  </Stack>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      <Stack spacing={2}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Notes
        </Typography>
        {canEdit ? (
          <Stack component="form" action={updateNotes} spacing={2}>
            <input type="hidden" name="menuId" value={menu.id} />
            <TextField
              name="nutritionNote"
              label="Nutrition / MyPlate balance note"
              defaultValue={menu.nutritionNote}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              name="allergyNote"
              label="Patrol allergy note"
              defaultValue={menu.allergyNote}
              multiline
              rows={2}
              fullWidth
            />
            <SubmitButton variant="contained" size="small" sx={{ alignSelf: "flex-start" }}>
              Save notes
            </SubmitButton>
          </Stack>
        ) : (
          <Stack spacing={1} sx={{ typography: "body2" }}>
            <Typography variant="body2">
              <strong>Nutrition / MyPlate balance:</strong> {menu.nutritionNote || "(none)"}
            </Typography>
            <Typography variant="body2">
              <strong>Patrol allergy note:</strong> {menu.allergyNote || "(none)"}
            </Typography>
          </Stack>
        )}
      </Stack>

      {canSubmit && (
        <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <Box component="form" action={submitMenu}>
            <input type="hidden" name="menuId" value={menu.id} />
            <SubmitButton variant="contained" color="primary" disabled={hasEmptyOccasion}>
              Submit menu
            </SubmitButton>
          </Box>
        </Stack>
      )}

      {canReviewMenu && (
        <Stack spacing={2} sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Review
          </Typography>
          <Box component="form" action={approveMenu}>
            <input type="hidden" name="menuId" value={menu.id} />
            <SubmitButton variant="contained" color="primary">
              Approve
            </SubmitButton>
          </Box>
          <Stack component="form" action={rejectMenu} spacing={1.5} sx={{ alignItems: "flex-start" }}>
            <input type="hidden" name="menuId" value={menu.id} />
            <TextField
              name="comment"
              label="Comments (required to request changes)"
              required
              multiline
              rows={2}
              fullWidth
            />
            <SubmitButton
              variant="contained"
              sx={{ bgcolor: "brand.olive", "&:hover": { bgcolor: "brand.olive", filter: "brightness(0.9)" } }}
            >
              Request changes
            </SubmitButton>
          </Stack>
        </Stack>
      )}

      {menu.reviews.length > 0 && (
        <Stack spacing={1.5} sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Review history
          </Typography>
          <ReviewThread reviews={menu.reviews} patrolColor={menu.patrol.color} />
        </Stack>
      )}

      <Stack spacing={1.5} id="comment-activity-log" sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Comment activity log
        </Typography>
        <CommentActivityLog
          menuId={menu.id}
          patrolName={menu.patrol.name}
          entries={activityEntries}
          hasMore={hasMoreActivity}
          nextLimit={activityLimit + ACTIVITY_PAGE_SIZE}
        />
      </Stack>
    </Stack>
  );
}
