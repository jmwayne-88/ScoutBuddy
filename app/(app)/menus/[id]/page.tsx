import { notFound } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { canEditMenu, canReview, canSubmitMenu } from "@/lib/permissions";
import { MEAL_OCCASIONS } from "@/lib/constants";
import { PatrolBadge } from "@/components/PatrolBadge";
import { NavLink } from "@/components/NavLink";
import { RenameDishDialog } from "@/components/RenameDishDialog";
import {
  addDish,
  addIngredient,
  approveMenu,
  rejectMenu,
  removeDish,
  removeIngredient,
  renameDish,
  submitMenu,
  updateNotes,
} from "./actions";

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
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

  const canEdit = canEditMenu(actor, menu);
  const canSubmit = canSubmitMenu(actor, menu);
  const canReviewMenu = canReview(actor, menu);

  const mealsByOccasion = new Map(menu.meals.map((m) => [m.occasion, m]));

  return (
    <Stack spacing={4} sx={{ maxWidth: 900 }}>
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="h5" component="h1">
            {menu.campout.name}
          </Typography>
          <PatrolBadge name={menu.patrol.name} color={menu.patrol.color} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Due {menu.dueDate.toDateString()} · Status: {menu.status.replace(/_/g, " ")}
        </Typography>
        <Typography variant="body2">
          <NavLink href={`/menus/${menu.id}/print`}>Print preview</NavLink>
        </Typography>
      </Stack>

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
                {meal.dishes.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No dishes yet.
                  </Typography>
                )}
                <Stack spacing={1.5} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
                  {meal.dishes.map((dish) => (
                    <Stack key={dish.id} component="li" spacing={0.5}>
                      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                        <Typography sx={{ fontWeight: 500 }}>{dish.name}</Typography>
                        {canEdit && (
                          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                            <RenameDishDialog
                              menuId={menu.id}
                              dishId={dish.id}
                              dishName={dish.name}
                              renameAction={renameDish}
                            />
                            <Box component="form" action={removeDish}>
                              <input type="hidden" name="menuId" value={menu.id} />
                              <input type="hidden" name="dishId" value={dish.id} />
                              <Button type="submit" variant="text" size="small" sx={{ color: "text.secondary" }}>
                                Remove dish
                              </Button>
                            </Box>
                          </Stack>
                        )}
                      </Stack>
                      <Stack spacing={0.5} component="ul" sx={{ listStyle: "none", m: 0, ml: 2, p: 0 }}>
                        {dish.ingredients.map((ing) => (
                          <Stack key={ing.id} component="li" direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                              {ing.name} — {ing.quantity}
                            </Typography>
                            {canEdit && (
                              <Box component="form" action={removeIngredient}>
                                <input type="hidden" name="menuId" value={menu.id} />
                                <input type="hidden" name="ingredientId" value={ing.id} />
                                <Button type="submit" variant="text" size="small" sx={{ color: "text.secondary" }}>
                                  Remove
                                </Button>
                              </Box>
                            )}
                          </Stack>
                        ))}
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
                          <TextField name="quantity" label="Quantity" required size="small" />
                          <Button type="submit" variant="text" size="small">
                            Add ingredient
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                  ))}
                </Stack>
                {canEdit && (
                  <Stack component="form" action={addDish} direction="row" sx={{ alignItems: "flex-end", gap: 1 }}>
                    <input type="hidden" name="menuId" value={menu.id} />
                    <input type="hidden" name="mealId" value={meal.id} />
                    <TextField name="name" label="Dish name" required size="small" />
                    <Button type="submit" variant="text" size="small">
                      Add dish
                    </Button>
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
            <Button type="submit" variant="contained" size="small" sx={{ alignSelf: "flex-start" }}>
              Save notes
            </Button>
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
          {error === "empty-occasions" && (
            <Alert severity="error" sx={{ width: "100%" }}>
              This menu can&apos;t be submitted yet — every meal occasion needs at least one dish.
            </Alert>
          )}
          <Box component="form" action={submitMenu}>
            <input type="hidden" name="menuId" value={menu.id} />
            <Button type="submit" variant="contained" color="primary">
              Submit menu
            </Button>
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
            <Button type="submit" variant="contained" color="primary">
              Approve
            </Button>
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
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: "brand.olive", "&:hover": { bgcolor: "brand.olive", filter: "brightness(0.9)" } }}
            >
              Request changes
            </Button>
          </Stack>
        </Stack>
      )}

      {menu.reviews.length > 0 && (
        <Stack spacing={1.5} sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Review history
          </Typography>
          <Stack spacing={1} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {menu.reviews.map((review) => (
              <Paper key={review.id} component="li" variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {review.decision === "APPROVED" ? "Approved" : "Changes requested"} —{" "}
                  {review.createdAt.toDateString()}
                </Typography>
                {review.comment && <Typography variant="body2">{review.comment}</Typography>}
              </Paper>
            ))}
          </Stack>
        </Stack>
      )}

      <Typography variant="body2">
        <NavLink href="/">Switch role</NavLink>
      </Typography>
    </Stack>
  );
}
