import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { db } from "@/lib/db";
import { MEAL_OCCASIONS, mealOccasionLabel } from "@/lib/constants";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "@/lib/ingredient-categorization";
import { PatrolBadge } from "@/components/PatrolBadge";
import { NavLink } from "@/components/NavLink";
import { PrintButton } from "@/components/PrintButton";
import { ShrinkToFitPage } from "@/components/ShrinkToFitPage";
import styles from "./print.module.css";

type ShoppingRow = {
  id: string;
  name: string;
  quantity: string;
  dishName: string;
  occasionLabel: string;
  category: (typeof CATEGORY_ORDER)[number];
};

export default async function MenuPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const menu = await db.menu.findUnique({
    where: { id },
    include: {
      campout: true,
      patrol: true,
      meals: { include: { dishes: { include: { ingredients: true } } } },
    },
  });

  if (!menu) notFound();

  const mealsByOccasion = new Map(menu.meals.map((m) => [m.occasion, m]));
  const occasionsWithDishes = MEAL_OCCASIONS.filter(({ value }) => (mealsByOccasion.get(value)?.dishes.length ?? 0) > 0);

  const shoppingRows: ShoppingRow[] = menu.meals.flatMap((meal) =>
    meal.dishes.flatMap((dish) =>
      dish.ingredients.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        dishName: dish.name,
        occasionLabel: mealOccasionLabel(meal.occasion),
        category: ingredient.category ?? "OTHER",
      }))
    )
  );

  const groupedShoppingRows = CATEGORY_ORDER.map((category) => ({
    category,
    items: shoppingRows.filter((row) => row.category === category).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((group) => group.items.length > 0);

  return (
    <Box className={styles.printPreviewBackdrop}>
      <Stack direction="row" spacing={2} sx={{ "@media print": { display: "none" } }}>
        <PrintButton />
        <NavLink href={`/menus/${menu.id}`}>Back to menu</NavLink>
      </Stack>

      {/* Page 1 — cooking reference */}
      <ShrinkToFitPage className={styles.printPage}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Stack spacing={0.25}>
              <Typography variant="inherit" sx={{ fontSize: "1.6em", fontWeight: 700 }}>{menu.campout.name}</Typography>
              <Typography variant="inherit" sx={{ fontSize: "0.9em", color: "text.secondary" }}>
                {menu.campout.date.toDateString()}
                {menu.campout.location && <> · {menu.campout.location}</>}
              </Typography>
            </Stack>
            <PatrolBadge name={menu.patrol.name} color={menu.patrol.color} />
          </Stack>

          {(menu.allergyNote || menu.nutritionNote) && (
            <Box sx={{ border: "2px solid #000", borderRadius: 1, p: 1 }}>
              {menu.allergyNote && (
                <Typography variant="inherit" sx={{ fontSize: "1em" }}>
                  <strong>Allergies:</strong> {menu.allergyNote}
                </Typography>
              )}
              {menu.nutritionNote && (
                <Typography variant="inherit" sx={{ fontSize: "0.85em" }}>
                  <strong>Nutrition note:</strong> {menu.nutritionNote}
                </Typography>
              )}
            </Box>
          )}

          <Stack spacing={1}>
            {occasionsWithDishes.map(({ value, label }, index) => {
              const meal = mealsByOccasion.get(value)!;
              return (
                <Box key={value}>
                  {index > 0 && (
                    <Box aria-hidden sx={{ borderTop: "1px solid", borderColor: "grey.400", mb: 1 }} />
                  )}
                  <Typography variant="inherit" sx={{ fontSize: "1.1em", fontWeight: 700 }}>{label}</Typography>
                  <Stack spacing={0.5} component="ul" sx={{ listStyle: "none", m: 0, mt: 0.5, p: 0, pl: "1.25em" }}>
                    {meal.dishes.map((dish) => (
                      <Box component="li" key={dish.id}>
                        <Typography variant="inherit" sx={{ fontSize: "1em", fontWeight: 600 }}>{dish.name}</Typography>
                        <Typography variant="inherit" sx={{ fontSize: "0.75em", color: "text.secondary", pl: "1.25em" }}>
                          {dish.ingredients.length === 0
                            ? "No ingredients listed."
                            : dish.ingredients.map((i) => `${i.name} (${i.quantity})`).join(" · ")}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Stack>
      </ShrinkToFitPage>

      {/* Page 2 — shopping list */}
      <ShrinkToFitPage className={`${styles.printPage} ${styles.printPageSecond}`}>
        <Stack spacing={0.75}>
          <Typography variant="inherit" sx={{ fontSize: "1.4em", fontWeight: 700 }}>
            Shopping List — {menu.patrol.name}, {menu.campout.name}
          </Typography>
          {groupedShoppingRows.length === 0 ? (
            <Typography variant="inherit" sx={{ fontSize: "1em", color: "text.secondary" }}>No ingredients listed yet.</Typography>
          ) : (
            groupedShoppingRows.map(({ category, items }) => (
              <Box key={category}>
                <Typography variant="inherit" sx={{ fontSize: "1.1em", fontWeight: 700, textDecoration: "underline" }}>
                  {CATEGORY_LABELS[category]}
                </Typography>
                <Stack spacing={0.2} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
                  {items.map((row) => (
                    <Stack
                      component="li"
                      key={row.id}
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "baseline" }}
                    >
                      <Box
                        aria-hidden
                        sx={{
                          width: "0.9em",
                          height: "0.9em",
                          border: "1.5px solid #000",
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="inherit" sx={{ fontSize: "1em" }}>
                        {row.name} — {row.quantity}
                      </Typography>
                      <Typography variant="inherit" sx={{ fontSize: "0.7em", color: "text.secondary" }}>
                        ({row.occasionLabel} · {row.dishName})
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            ))
          )}
        </Stack>
      </ShrinkToFitPage>
    </Box>
  );
}
