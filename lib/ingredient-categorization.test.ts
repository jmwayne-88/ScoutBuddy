import { describe, expect, it } from "vitest";
import { CATEGORY_ORDER, classifyIngredientFallback } from "./ingredient-categorization";

describe("classifyIngredientFallback", () => {
  it("matches common ingredients to the expected category", () => {
    expect(classifyIngredientFallback("Chicken breast")).toBe("MEAT_PROTEIN");
    expect(classifyIngredientFallback("Cheddar cheese")).toBe("DAIRY_EGGS");
    expect(classifyIngredientFallback("Flour tortillas")).toBe("BREAD_BAKERY");
    expect(classifyIngredientFallback("Salt")).toBe("SPICES_SEASONINGS");
    expect(classifyIngredientFallback("Ketchup")).toBe("CONDIMENTS_SAUCES");
  });

  it("falls back to OTHER for an unrecognized ingredient", () => {
    expect(classifyIngredientFallback("Xyzzy brand snack")).toBe("OTHER");
  });

  it("is case-insensitive", () => {
    expect(classifyIngredientFallback("CHICKEN BREAST")).toBe("MEAT_PROTEIN");
  });

  it("always returns a category present in CATEGORY_ORDER", () => {
    for (const name of ["onion", "milk", "rice", "mustard", "oregano", "frozen peas", "lemonade", "mystery item"]) {
      expect(CATEGORY_ORDER).toContain(classifyIngredientFallback(name));
    }
  });
});
