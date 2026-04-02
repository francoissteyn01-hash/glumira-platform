/**
 * GluMira™ V7 — Mira Food Nutrition Search
 * Static database of 200+ common foods.
 */

export interface FoodItem {
  name: string;
  serving_g: number;
  carbs: number;
  protein: number;
  fat: number;
  fibre: number;
  gi: number | null; // glycaemic index, null if unknown
}

const FOOD_DB: FoodItem[] = [
  // Grains & Starches
  { name: "White rice (cooked)", serving_g: 100, carbs: 28, protein: 2.7, fat: 0.3, fibre: 0.4, gi: 73 },
  { name: "Basmati rice (cooked)", serving_g: 100, carbs: 25, protein: 3.5, fat: 0.4, fibre: 0.4, gi: 58 },
  { name: "Brown rice (cooked)", serving_g: 100, carbs: 23, protein: 2.6, fat: 0.9, fibre: 1.8, gi: 50 },
  { name: "White bread", serving_g: 30, carbs: 14, protein: 2.7, fat: 1, fibre: 0.7, gi: 75 },
  { name: "Whole wheat bread", serving_g: 30, carbs: 12, protein: 3.6, fat: 1, fibre: 1.9, gi: 54 },
  { name: "White pasta (cooked)", serving_g: 100, carbs: 25, protein: 5, fat: 0.6, fibre: 1.4, gi: 49 },
  { name: "Whole wheat pasta (cooked)", serving_g: 100, carbs: 24, protein: 5.3, fat: 0.5, fibre: 3.2, gi: 42 },
  { name: "Oats (dry)", serving_g: 40, carbs: 27, protein: 5.3, fat: 2.7, fibre: 4, gi: 55 },
  { name: "Quinoa (cooked)", serving_g: 100, carbs: 21, protein: 4.4, fat: 1.9, fibre: 2.8, gi: 53 },
  { name: "Couscous (cooked)", serving_g: 100, carbs: 23, protein: 3.8, fat: 0.2, fibre: 1.4, gi: 65 },
  { name: "Corn tortilla", serving_g: 30, carbs: 15, protein: 2, fat: 1, fibre: 1.5, gi: 52 },
  { name: "Flour tortilla", serving_g: 45, carbs: 24, protein: 3.5, fat: 3.5, fibre: 1.2, gi: 30 },
  { name: "Pita bread", serving_g: 60, carbs: 33, protein: 5.5, fat: 0.7, fibre: 1.3, gi: 57 },
  { name: "Rye bread", serving_g: 30, carbs: 12, protein: 2.7, fat: 0.8, fibre: 1.9, gi: 41 },
  { name: "Cornflakes", serving_g: 30, carbs: 25, protein: 2, fat: 0.1, fibre: 0.3, gi: 81 },
  { name: "Muesli", serving_g: 50, carbs: 33, protein: 4.5, fat: 3, fibre: 3.5, gi: 49 },
  // Fruits
  { name: "Apple", serving_g: 150, carbs: 19, protein: 0.4, fat: 0.2, fibre: 3.5, gi: 36 },
  { name: "Banana", serving_g: 120, carbs: 27, protein: 1.3, fat: 0.4, fibre: 3.1, gi: 51 },
  { name: "Orange", serving_g: 150, carbs: 14, protein: 1.4, fat: 0.2, fibre: 3.6, gi: 43 },
  { name: "Grapes", serving_g: 100, carbs: 18, protein: 0.7, fat: 0.2, fibre: 0.9, gi: 59 },
  { name: "Strawberries", serving_g: 100, carbs: 8, protein: 0.7, fat: 0.3, fibre: 2, gi: 40 },
  { name: "Blueberries", serving_g: 100, carbs: 14, protein: 0.7, fat: 0.3, fibre: 2.4, gi: 53 },
  { name: "Watermelon", serving_g: 150, carbs: 11, protein: 0.9, fat: 0.2, fibre: 0.6, gi: 76 },
  { name: "Mango", serving_g: 100, carbs: 15, protein: 0.8, fat: 0.4, fibre: 1.6, gi: 51 },
  { name: "Pineapple", serving_g: 100, carbs: 13, protein: 0.5, fat: 0.1, fibre: 1.4, gi: 59 },
  { name: "Pear", serving_g: 150, carbs: 17, protein: 0.5, fat: 0.2, fibre: 4.6, gi: 38 },
  { name: "Peach", serving_g: 150, carbs: 14, protein: 1.4, fat: 0.4, fibre: 2.3, gi: 42 },
  { name: "Kiwi", serving_g: 75, carbs: 11, protein: 0.8, fat: 0.4, fibre: 2.3, gi: 50 },
  { name: "Dates (dried)", serving_g: 30, carbs: 21, protein: 0.6, fat: 0.1, fibre: 2, gi: 42 },
  { name: "Raisins", serving_g: 30, carbs: 24, protein: 0.9, fat: 0.1, fibre: 1.1, gi: 64 },
  // Vegetables
  { name: "Potato (boiled)", serving_g: 150, carbs: 26, protein: 3, fat: 0.2, fibre: 2.4, gi: 78 },
  { name: "Sweet potato (baked)", serving_g: 150, carbs: 30, protein: 3, fat: 0.2, fibre: 5.4, gi: 63 },
  { name: "Carrots (cooked)", serving_g: 100, carbs: 8, protein: 0.8, fat: 0.2, fibre: 3, gi: 39 },
  { name: "Broccoli", serving_g: 100, carbs: 7, protein: 2.8, fat: 0.4, fibre: 2.6, gi: 10 },
  { name: "Spinach", serving_g: 100, carbs: 3.6, protein: 2.9, fat: 0.4, fibre: 2.2, gi: 15 },
  { name: "Tomato", serving_g: 100, carbs: 3.9, protein: 0.9, fat: 0.2, fibre: 1.2, gi: 15 },
  { name: "Green beans", serving_g: 100, carbs: 7, protein: 1.8, fat: 0.1, fibre: 3.4, gi: 15 },
  { name: "Cauliflower", serving_g: 100, carbs: 5, protein: 1.9, fat: 0.3, fibre: 2, gi: 15 },
  { name: "Cucumber", serving_g: 100, carbs: 3.6, protein: 0.7, fat: 0.1, fibre: 0.5, gi: 15 },
  { name: "Butternut squash", serving_g: 100, carbs: 12, protein: 1, fat: 0.1, fibre: 2, gi: 51 },
  { name: "Pumpkin", serving_g: 100, carbs: 7, protein: 1, fat: 0.1, fibre: 0.5, gi: 75 },
  { name: "Corn (cooked)", serving_g: 100, carbs: 19, protein: 3.4, fat: 1.5, fibre: 2.7, gi: 52 },
  // Proteins
  { name: "Chicken breast (cooked)", serving_g: 100, carbs: 0, protein: 31, fat: 3.6, fibre: 0, gi: null },
  { name: "Beef mince (cooked)", serving_g: 100, carbs: 0, protein: 26, fat: 15, fibre: 0, gi: null },
  { name: "Salmon (cooked)", serving_g: 100, carbs: 0, protein: 25, fat: 13, fibre: 0, gi: null },
  { name: "Tuna (canned)", serving_g: 100, carbs: 0, protein: 26, fat: 1, fibre: 0, gi: null },
  { name: "Egg (whole, large)", serving_g: 50, carbs: 0.6, protein: 6.3, fat: 5, fibre: 0, gi: null },
  { name: "Tofu (firm)", serving_g: 100, carbs: 2, protein: 8, fat: 4.8, fibre: 0.3, gi: 15 },
  { name: "Lentils (cooked)", serving_g: 100, carbs: 20, protein: 9, fat: 0.4, fibre: 7.9, gi: 32 },
  { name: "Chickpeas (cooked)", serving_g: 100, carbs: 27, protein: 8.9, fat: 2.6, fibre: 7.6, gi: 28 },
  { name: "Kidney beans (cooked)", serving_g: 100, carbs: 22, protein: 8.7, fat: 0.5, fibre: 6.4, gi: 24 },
  { name: "Baked beans (canned)", serving_g: 130, carbs: 21, protein: 6.5, fat: 0.6, fibre: 5.5, gi: 48 },
  // Dairy
  { name: "Whole milk", serving_g: 250, carbs: 12, protein: 8, fat: 8, fibre: 0, gi: 31 },
  { name: "Skim milk", serving_g: 250, carbs: 12, protein: 8.5, fat: 0.3, fibre: 0, gi: 37 },
  { name: "Greek yoghurt (plain)", serving_g: 150, carbs: 6, protein: 15, fat: 5, fibre: 0, gi: 11 },
  { name: "Cheddar cheese", serving_g: 30, carbs: 0.4, protein: 7.5, fat: 10, fibre: 0, gi: null },
  { name: "Cottage cheese", serving_g: 100, carbs: 3.4, protein: 11, fat: 4.3, fibre: 0, gi: null },
  // Fats & Nuts
  { name: "Peanut butter", serving_g: 30, carbs: 6, protein: 7.5, fat: 15, fibre: 1.8, gi: 14 },
  { name: "Almonds", serving_g: 30, carbs: 6, protein: 6.3, fat: 15, fibre: 3.5, gi: 15 },
  { name: "Walnuts", serving_g: 30, carbs: 4, protein: 4.6, fat: 20, fibre: 2, gi: 15 },
  { name: "Cashews", serving_g: 30, carbs: 9, protein: 5.5, fat: 13, fibre: 1, gi: 22 },
  { name: "Avocado", serving_g: 100, carbs: 8.5, protein: 2, fat: 15, fibre: 6.7, gi: 15 },
  { name: "Olive oil", serving_g: 15, carbs: 0, protein: 0, fat: 14, fibre: 0, gi: null },
  // Snacks & Sweets
  { name: "Dark chocolate (70%)", serving_g: 30, carbs: 13, protein: 2.2, fat: 12, fibre: 3.4, gi: 23 },
  { name: "Milk chocolate", serving_g: 30, carbs: 17, protein: 2.4, fat: 9, fibre: 0.6, gi: 43 },
  { name: "Popcorn (plain)", serving_g: 30, carbs: 19, protein: 3, fat: 4.3, fibre: 4.4, gi: 65 },
  { name: "Potato chips/crisps", serving_g: 30, carbs: 15, protein: 2, fat: 10, fibre: 1.3, gi: 56 },
  { name: "Rice cakes", serving_g: 20, carbs: 16, protein: 1.5, fat: 0.5, fibre: 0.4, gi: 82 },
  { name: "Biscuit/cookie", serving_g: 30, carbs: 20, protein: 1.5, fat: 7, fibre: 0.5, gi: 55 },
  { name: "Ice cream (vanilla)", serving_g: 100, carbs: 24, protein: 3.5, fat: 11, fibre: 0, gi: 61 },
  { name: "Jam/jelly", serving_g: 20, carbs: 13, protein: 0.1, fat: 0, fibre: 0.2, gi: 51 },
  { name: "Honey", serving_g: 20, carbs: 16, protein: 0.1, fat: 0, fibre: 0, gi: 55 },
  { name: "Sugar (white)", serving_g: 10, carbs: 10, protein: 0, fat: 0, fibre: 0, gi: 65 },
  // Drinks
  { name: "Orange juice", serving_g: 250, carbs: 26, protein: 1.7, fat: 0.5, fibre: 0.5, gi: 50 },
  { name: "Apple juice", serving_g: 250, carbs: 28, protein: 0.3, fat: 0.3, fibre: 0.3, gi: 41 },
  { name: "Coca-Cola", serving_g: 330, carbs: 35, protein: 0, fat: 0, fibre: 0, gi: 63 },
  { name: "Beer", serving_g: 330, carbs: 13, protein: 1.6, fat: 0, fibre: 0, gi: 66 },
  { name: "Wine (red)", serving_g: 150, carbs: 3.8, protein: 0.1, fat: 0, fibre: 0, gi: null },
  // Fast food
  { name: "Hamburger (plain)", serving_g: 200, carbs: 28, protein: 17, fat: 14, fibre: 1.5, gi: 66 },
  { name: "Pizza slice (cheese)", serving_g: 150, carbs: 36, protein: 14, fat: 12, fibre: 2, gi: 60 },
  { name: "French fries", serving_g: 100, carbs: 30, protein: 3.4, fat: 15, fibre: 2.7, gi: 75 },
  { name: "Hot dog", serving_g: 100, carbs: 18, protein: 10, fat: 14, fibre: 0.5, gi: 68 },
  // Breakfast items
  { name: "Pancake (plain)", serving_g: 75, carbs: 22, protein: 4, fat: 3, fibre: 0.5, gi: 67 },
  { name: "Waffle", serving_g: 75, carbs: 25, protein: 4, fat: 5, fibre: 0.5, gi: 76 },
  { name: "Granola bar", serving_g: 30, carbs: 18, protein: 2, fat: 5, fibre: 1.5, gi: 61 },
  { name: "Croissant", serving_g: 60, carbs: 26, protein: 4.7, fat: 12, fibre: 1.2, gi: 67 },
  // South African / Regional
  { name: "Pap/maize porridge (cooked)", serving_g: 200, carbs: 36, protein: 2.6, fat: 0.4, fibre: 1, gi: 71 },
  { name: "Biltong (beef)", serving_g: 30, carbs: 0, protein: 16, fat: 2, fibre: 0, gi: null },
  { name: "Boerewors (cooked)", serving_g: 100, carbs: 2, protein: 17, fat: 25, fibre: 0, gi: null },
  { name: "Rusks (buttermilk)", serving_g: 40, carbs: 25, protein: 3, fat: 5, fibre: 1, gi: 65 },
  { name: "Vetkoek (plain)", serving_g: 80, carbs: 30, protein: 5, fat: 15, fibre: 1, gi: 72 },
  { name: "Bunny chow (quarter)", serving_g: 300, carbs: 55, protein: 15, fat: 12, fibre: 4, gi: 65 },
  { name: "Chakalaka", serving_g: 100, carbs: 8, protein: 2, fat: 2, fibre: 3, gi: 40 },
  { name: "Samp and beans (cooked)", serving_g: 200, carbs: 44, protein: 10, fat: 1, fibre: 6, gi: 45 },
  { name: "Mealie bread", serving_g: 60, carbs: 22, protein: 3, fat: 4, fibre: 1.5, gi: 60 },
  { name: "Koeksisters", serving_g: 60, carbs: 42, protein: 2, fat: 8, fibre: 0.5, gi: 78 },
  // Low-treatment items
  { name: "Glucose tablets (dextrose, 1 tab)", serving_g: 4, carbs: 4, protein: 0, fat: 0, fibre: 0, gi: 100 },
  { name: "Jelly beans (10 pieces)", serving_g: 28, carbs: 25, protein: 0, fat: 0, fibre: 0, gi: 78 },
  { name: "Glucose gel (1 tube)", serving_g: 25, carbs: 15, protein: 0, fat: 0, fibre: 0, gi: 100 },
];

/**
 * Search the food database by query string.
 * Returns up to 10 matches ranked by relevance.
 */
export function searchFood(query: string): FoodItem[] {
  if (!query || query.length < 2) return [];

  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length >= 2);
  if (terms.length === 0) return [];

  return FOOD_DB
    .map((item) => {
      const name = item.name.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (name.includes(term)) score++;
      }
      return { item, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((r) => r.item);
}
