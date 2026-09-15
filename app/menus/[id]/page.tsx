import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { canEditMenu, canReview, canSubmitMenu } from "@/lib/permissions";
import { MEAL_OCCASIONS } from "@/lib/constants";
import { PatrolBadge } from "@/components/PatrolBadge";
import {
  addDish,
  addIngredient,
  approveMenu,
  rejectMenu,
  removeDish,
  removeIngredient,
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
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <PatrolBadge patrol={menu.patrol} /> — {menu.campout.name}
        </h1>
        <p className="text-sm text-slate-600">
          Due {menu.dueDate.toDateString()} · Status: {menu.status.replace(/_/g, " ")}
        </p>
      </div>

      <div className="space-y-6">
        {MEAL_OCCASIONS.map(({ value, label }) => {
          const meal = mealsByOccasion.get(value);
          if (!meal) return null;
          return (
            <section key={value} className="border rounded p-4 space-y-3">
              <h2 className="font-medium">{label}</h2>
              {meal.dishes.length === 0 && (
                <p className="text-sm text-slate-500">No dishes yet.</p>
              )}
              <ul className="space-y-2">
                {meal.dishes.map((dish) => (
                  <li key={dish.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{dish.name}</span>
                      {canEdit && (
                        <form action={removeDish}>
                          <input type="hidden" name="menuId" value={menu.id} />
                          <input type="hidden" name="dishId" value={dish.id} />
                          <button type="submit" className="text-sm text-red-600 underline">
                            Remove dish
                          </button>
                        </form>
                      )}
                    </div>
                    <ul className="ml-4 text-sm text-slate-700 space-y-1">
                      {dish.ingredients.map((ing) => (
                        <li key={ing.id} className="flex items-center gap-2">
                          <span>
                            {ing.name} — {ing.quantity}
                          </span>
                          {canEdit && (
                            <form action={removeIngredient}>
                              <input type="hidden" name="menuId" value={menu.id} />
                              <input type="hidden" name="ingredientId" value={ing.id} />
                              <button type="submit" className="text-red-600 underline">
                                Remove
                              </button>
                            </form>
                          )}
                        </li>
                      ))}
                    </ul>
                    {canEdit && (
                      <form action={addIngredient} className="flex flex-wrap items-end gap-2 ml-4">
                        <input type="hidden" name="menuId" value={menu.id} />
                        <input type="hidden" name="dishId" value={dish.id} />
                        <input
                          name="name"
                          placeholder="Ingredient"
                          required
                          className="border rounded px-2 py-1 text-sm"
                        />
                        <input
                          name="quantity"
                          placeholder="Quantity"
                          required
                          className="border rounded px-2 py-1 text-sm"
                        />
                        <button type="submit" className="text-sm underline">
                          Add ingredient
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
              {canEdit && (
                <form action={addDish} className="flex items-end gap-2">
                  <input type="hidden" name="menuId" value={menu.id} />
                  <input type="hidden" name="mealId" value={meal.id} />
                  <input name="name" placeholder="Dish name" required className="border rounded px-2 py-1 text-sm" />
                  <button type="submit" className="text-sm underline">
                    Add dish
                  </button>
                </form>
              )}
            </section>
          );
        })}
      </div>

      <section className="space-y-4">
        <h2 className="font-medium">Notes</h2>
        {canEdit ? (
          <form action={updateNotes} className="space-y-3">
            <input type="hidden" name="menuId" value={menu.id} />
            <div>
              <label className="block text-sm font-medium">Nutrition / MyPlate balance note</label>
              <textarea
                name="nutritionNote"
                defaultValue={menu.nutritionNote}
                className="border rounded px-2 py-1 w-full"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Patrol allergy note</label>
              <textarea
                name="allergyNote"
                defaultValue={menu.allergyNote}
                className="border rounded px-2 py-1 w-full"
                rows={2}
              />
            </div>
            <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white text-sm">
              Save notes
            </button>
          </form>
        ) : (
          <div className="text-sm space-y-2">
            <p>
              <strong>Nutrition / MyPlate balance:</strong> {menu.nutritionNote || "(none)"}
            </p>
            <p>
              <strong>Patrol allergy note:</strong> {menu.allergyNote || "(none)"}
            </p>
          </div>
        )}
      </section>

      {canSubmit && (
        <div className="space-y-2">
          {error === "empty-occasions" && (
            <p className="text-sm text-red-700">
              This menu can&apos;t be submitted yet — every meal occasion needs at least one dish.
            </p>
          )}
          <form action={submitMenu}>
            <input type="hidden" name="menuId" value={menu.id} />
            <button type="submit" className="rounded bg-emerald-700 px-4 py-2 text-white">
              Submit menu
            </button>
          </form>
        </div>
      )}

      {canReviewMenu && (
        <section className="space-y-4 border-t pt-4">
          <h2 className="font-medium">Review</h2>
          <form action={approveMenu}>
            <input type="hidden" name="menuId" value={menu.id} />
            <button type="submit" className="rounded bg-emerald-700 px-4 py-2 text-white">
              Approve
            </button>
          </form>
          <form action={rejectMenu} className="space-y-2">
            <input type="hidden" name="menuId" value={menu.id} />
            <label className="block text-sm font-medium">Comments (required to request changes)</label>
            <textarea name="comment" required className="border rounded px-2 py-1 w-full" rows={2} />
            <button type="submit" className="rounded bg-amber-700 px-4 py-2 text-white">
              Request changes
            </button>
          </form>
        </section>
      )}

      {menu.reviews.length > 0 && (
        <section className="space-y-2 border-t pt-4">
          <h2 className="font-medium">Review history</h2>
          <ul className="space-y-2 text-sm">
            {menu.reviews.map((review) => (
              <li key={review.id} className="border rounded p-2">
                <div className="font-medium">
                  {review.decision === "APPROVED" ? "Approved" : "Changes requested"} —{" "}
                  {review.createdAt.toDateString()}
                </div>
                {review.comment && <p>{review.comment}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm">
        <Link href="/" className="underline">
          Switch role
        </Link>
      </p>
    </div>
  );
}
