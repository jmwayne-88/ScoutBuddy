import type { MealOccasion, Patrol } from "@prisma/client";

export const MEAL_OCCASIONS: { value: MealOccasion; label: string }[] = [
  { value: "FRIDAY_CRACKER_BARREL", label: "Friday Cracker Barrel" },
  { value: "SATURDAY_BREAKFAST", label: "Saturday Breakfast" },
  { value: "SATURDAY_LUNCH", label: "Saturday Lunch" },
  { value: "SATURDAY_DINNER", label: "Saturday Dinner" },
  { value: "SATURDAY_CRACKER_BARREL", label: "Saturday Cracker Barrel" },
  { value: "SUNDAY_BREAKFAST", label: "Sunday Breakfast" },
];

export const PATROLS: { value: Patrol; label: string }[] = [
  { value: "EAGLE", label: "Eagle Patrol" },
  { value: "PUMA", label: "Puma Patrol" },
  { value: "RAVEN", label: "Raven Patrol" },
  { value: "SILVER_FOX", label: "Silver Fox Patrol" },
];

export function mealOccasionLabel(occasion: MealOccasion): string {
  return MEAL_OCCASIONS.find((o) => o.value === occasion)?.label ?? occasion;
}

export function patrolLabel(patrol: Patrol): string {
  return PATROLS.find((p) => p.value === patrol)?.label ?? patrol;
}
