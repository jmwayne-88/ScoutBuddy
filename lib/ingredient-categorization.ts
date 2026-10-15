import type { IngredientCategory } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

// REQ-12.9: the confirmed grocery-store-style category list and order (a
// typical store's rough walk order, not alphabetical) -- "Other" is always
// last, the catch-all for anything that couldn't be confidently classified.
export const CATEGORY_ORDER: IngredientCategory[] = [
  "PRODUCE",
  "MEAT_PROTEIN",
  "DAIRY_EGGS",
  "BREAD_BAKERY",
  "PANTRY_DRY_GOODS",
  "CONDIMENTS_SAUCES",
  "SPICES_SEASONINGS",
  "FROZEN",
  "BEVERAGES",
  "OTHER",
];

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  PRODUCE: "Produce",
  MEAT_PROTEIN: "Meat & Protein",
  DAIRY_EGGS: "Dairy & Eggs",
  BREAD_BAKERY: "Bread & Bakery",
  PANTRY_DRY_GOODS: "Pantry & Dry Goods",
  CONDIMENTS_SAUCES: "Condiments & Sauces",
  SPICES_SEASONINGS: "Spices & Seasonings",
  FROZEN: "Frozen",
  BEVERAGES: "Beverages",
  OTHER: "Other",
};

// REQ-12.10: a safety net only, used when the live Claude API call fails
// (missing/invalid key, network error, rate limit, an unparseable reply) --
// not maintained for accuracy the way a primary keyword system would need
// to be. Deliberately simple and approximate.
const FALLBACK_KEYWORDS: { category: IngredientCategory; keywords: string[] }[] = [
  { category: "PRODUCE", keywords: ["lettuce", "tomato", "onion", "pepper", "potato", "carrot", "corn", "fruit", "apple", "banana", "garlic", "celery", "cucumber"] },
  { category: "MEAT_PROTEIN", keywords: ["chicken", "beef", "turkey", "pork", "bacon", "sausage", "fish", "shrimp", "egg", "tofu", "ham"] },
  { category: "DAIRY_EGGS", keywords: ["milk", "cheese", "butter", "yogurt", "cream"] },
  { category: "BREAD_BAKERY", keywords: ["bread", "bun", "bagel", "tortilla", "roll", "biscuit"] },
  { category: "PANTRY_DRY_GOODS", keywords: ["rice", "pasta", "noodle", "flour", "sugar", "cereal", "bean", "can ", "canned", "oats"] },
  { category: "CONDIMENTS_SAUCES", keywords: ["ketchup", "mustard", "mayo", "sauce", "dressing", "oil", "vinegar", "salsa", "syrup"] },
  { category: "SPICES_SEASONINGS", keywords: ["salt", "pepper", "cumin", "paprika", "oregano", "basil", "spice", "seasoning", "cinnamon", "garlic powder"] },
  { category: "FROZEN", keywords: ["frozen", "ice cream", " ice"] },
  { category: "BEVERAGES", keywords: ["water", "juice", "soda", "lemonade", "coffee", "tea", "drink"] },
];

export function classifyIngredientFallback(name: string): IngredientCategory {
  const lower = name.toLowerCase();
  for (const { category, keywords } of FALLBACK_KEYWORDS) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category;
    }
  }
  return "OTHER";
}

const CATEGORY_SET = new Set<string>(CATEGORY_ORDER);

// REQ-12.10: one non-streaming, single-word-reply classification call --
// deliberately not using output_config.format's structured-output feature,
// since there's no real API key available to verify its exact response
// shape against in this environment. The reply is validated against the
// known category list; anything that doesn't match exactly, or any thrown
// error (missing key, network, rate limit), falls back to the keyword
// heuristic above rather than ever blocking an ingredient from saving.
export async function classifyIngredientWithClaude(name: string): Promise<IngredientCategory> {
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 20,
      system:
        "Classify a grocery ingredient into exactly one of these categories: " +
        CATEGORY_ORDER.join(", ") +
        ". Reply with only the category name, nothing else.",
      messages: [{ role: "user", content: name }],
    });

    const block = response.content.find((b) => b.type === "text");
    const reply = block && block.type === "text" ? block.text.trim().toUpperCase() : "";

    if (CATEGORY_SET.has(reply)) {
      return reply as IngredientCategory;
    }
    return classifyIngredientFallback(name);
  } catch {
    return classifyIngredientFallback(name);
  }
}
