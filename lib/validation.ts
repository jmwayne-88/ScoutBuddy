export type MealForValidation = { dishes: unknown[] };

export function menuHasEmptyOccasion(meals: MealForValidation[]): boolean {
  return meals.some((meal) => meal.dishes.length === 0);
}
