const express = require("express");
const Groq    = require("groq-sdk");

const router = express.Router();
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Parse raw LLM response to JSON ──
function parseRecipeRaw(raw) {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned);
}

// ── Call Groq ──
async function generateRaw(prompt, maxTokens = 2000) {
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model:    "llama-3.3-70b-versatile",
    temperature: 0.5,
    max_tokens:  maxTokens,
  });
  return completion.choices[0].message.content.trim();
}

// ── Shared JSON format template ──
const formatTemplate = `{
  "title": "Recipe name",
  "description": "2-3 sentence description of the dish, its origin or therapeutic purpose",
  "cuisine": "Cuisine type",
  "difficulty": "Easy | Medium | Hard",
  "cookTime": "e.g. 35 minutes",
  "ingredients": ["ingredient 1 with precise quantity", "ingredient 2 with precise quantity"],
  "steps": ["Detailed step 1 with technique, timing, temperature", "Step 2...", "...at least 7 steps total"],
  "preparationNote": "Usage/preparation tips (e.g. 'Do not boil honey', 'Consume on empty stomach', or scratch vs store-bought for bread/puri). Empty string if not applicable.",
  "healthySuggestion": "Suggest 2-3 specific ingredients to add/swap to boost health value. One line per suggestion.",
  "nutrition": {
    "calories": "approx value with unit",
    "protein":  "value with unit",
    "carbs":    "value with unit",
    "fats":     "value with unit",
    "fiber":    "value with unit"
  },
  "funFact": "Interesting fact about the dish or a key ingredient's health benefit"
}`;

// ── Build prompt by mode ──
function buildPrompt({ mode, ingredients, cuisine, diet, searchQuery, goal, mealType, condition }) {
  switch (mode) {

    case "search":
      return `You are a professional chef and nutritionist. The user wants an authentic recipe by dish name.

Dish name: "${searchQuery}"
Cuisine preference: ${cuisine || "Any"}
Dietary preference: ${diet || "None"}

STRICT RULES:
1. "${searchQuery}" is a DISH NAME — generate the complete authentic traditional recipe for it.
2. Include ALL real ingredients with precise quantities (8-15 ingredients minimum).
3. Write at least 8 detailed cooking steps with techniques, timings, and temperatures.
4. NEVER produce only 2-3 ingredients or 2-3 steps. That is WRONG.
5. If any component (pav, puri, bread, dough) can be made from scratch OR bought readymade, explain both in preparationNote.
6. In healthySuggestion, suggest specific swaps to make the dish nutritionally better.
7. Return ONLY valid JSON — no markdown, no code fences.

Format:
${formatTemplate}`;

    case "fitness":
      return `You are a sports nutritionist and chef specialising in performance nutrition.

Fitness goal: ${goal}
Meal type: ${mealType}
Dietary preference: ${diet || "None"}
${ingredients ? `Preferred ingredients: ${ingredients}` : "Choose wholesome fitness-appropriate ingredients."}

STRICT RULES:
1. Optimise for "${goal}": Muscle Gain = high protein (30g+ per serving). Fat Loss = low calorie + high fibre. Endurance = complex carbs. General = balanced macros.
2. Include all ingredients with precise quantities.
3. Write at least 7 detailed steps.
4. In healthySuggestion, give 2-3 ingredient upgrades to further optimise for "${goal}".
5. In funFact, share a sports-nutrition fact about a key ingredient.
6. Return ONLY valid JSON — no markdown, no code fences.

Format:
${formatTemplate}`;

    case "remedy":
      return `You are a traditional medicine expert, Ayurvedic nutritionist, and chef specialising in therapeutic foods.

Health condition: "${condition}"
${searchQuery ? `Specific remedy recipe requested: "${searchQuery}"` : "Choose the most effective therapeutic recipe for this condition."}
Dietary preference: ${diet || "None"}

STRICT RULES:
1. Generate a complete recipe for "${searchQuery || condition}" that specifically targets "${condition}".
2. Use ingredients proven to help this condition (e.g. turmeric+ginger for inflammation, honey+tulsi for cough, calcium foods for joint pain).
3. Include 8-12 ingredients with precise quantities.
4. Write at least 7 detailed cooking steps.
5. In funFact, explain WHY this recipe helps — cite specific nutrients or active compounds (e.g. curcumin, gingerol, allicin).
6. In healthySuggestion, suggest 2-3 extra ingredients to boost the therapeutic effect.
7. In preparationNote, include key usage tips (e.g. "Drink warm before bed", "Do not boil honey above 40°C", "Take on empty stomach").
8. Return ONLY valid JSON — no markdown, no code fences.

Format:
${formatTemplate}`;

    default: // "ingredients"
      return `You are a professional chef and nutritionist.

Ingredients available: ${ingredients}
Note: salt, water, and oil are ALWAYS available even if not listed.
Cuisine preference: ${cuisine || "Any"}
Dietary preference: ${diet || "None"}

STRICT RULES:
1. Only use listed ingredients plus salt, water, oil.
2. Do NOT add any other ingredient (no butter, flour, broth, sugar unless listed).
3. Every step must reference only allowed ingredients.
4. Write at least 6 detailed steps with clear techniques and timings.
5. The ingredients array must only list items from the provided list with quantities.
6. If any component can be made from scratch OR bought readymade, mention both in preparationNote.
7. In healthySuggestion, suggest 2-3 ingredients the user could add next time to improve nutrition.
8. Return ONLY valid JSON — no markdown, no code fences.

Format:
${formatTemplate}`;
  }
}

// ══════════════════════════════════════════
//  POST /  — Generate full recipe
// ══════════════════════════════════════════
router.post("/", async (req, res) => {
  const { ingredients, cuisine, diet, searchQuery, mode, goal, mealType, condition } = req.body;

  if (!ingredients && !searchQuery && !goal && !condition) {
    return res.status(400).json({ error: "Please provide ingredients, a dish name, a fitness goal, or a health condition." });
  }

  const prompt = buildPrompt({ mode, ingredients, cuisine, diet, searchQuery, goal, mealType, condition });

  try {
    let raw = await generateRaw(prompt);
    try {
      return res.json(parseRecipeRaw(raw));
    } catch (e1) {
      console.warn("First parse failed:", e1.message);
      raw = await generateRaw(prompt);
      try {
        return res.json(parseRecipeRaw(raw));
      } catch (e2) {
        console.error("Retry failed:", e2.message);
        return res.status(500).json({ error: "Recipe parsing failed. Please try again." });
      }
    }
  } catch (err) {
    console.error("Groq error:", err);
    return res.status(500).json({ error: "Failed to generate recipe. Please try again." });
  }
});

// ══════════════════════════════════════════
//  POST /suggestions — Get 5 recipe ideas for a condition
// ══════════════════════════════════════════
router.post("/suggestions", async (req, res) => {
  const { condition } = req.body;
  if (!condition) return res.status(400).json({ error: "Condition is required." });

  const prompt = `You are an Ayurvedic nutritionist and traditional food medicine expert.

List exactly 5 different natural food-based remedy recipes for the health condition: "${condition}".
Include a variety of recipe types: herbal drinks, soups/broths, cooked dishes, smoothies, traditional Indian remedies like kadha or khichdi.
Each recipe must use ingredients specifically known to help "${condition}".

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "suggestions": [
    {
      "name": "Exact recipe name",
      "description": "One sentence explaining the key therapeutic benefit.",
      "keyIngredient": "Single most important healing ingredient",
      "prepTime": "e.g. 10 minutes"
    },
    {
      "name": "...",
      "description": "...",
      "keyIngredient": "...",
      "prepTime": "..."
    },
    {
      "name": "...",
      "description": "...",
      "keyIngredient": "...",
      "prepTime": "..."
    },
    {
      "name": "...",
      "description": "...",
      "keyIngredient": "...",
      "prepTime": "..."
    },
    {
      "name": "...",
      "description": "...",
      "keyIngredient": "...",
      "prepTime": "..."
    }
  ]
}`;

  try {
    let raw = await generateRaw(prompt, 800);
    try {
      return res.json(parseRecipeRaw(raw));
    } catch {
      raw = await generateRaw(prompt, 800);
      try {
        return res.json(parseRecipeRaw(raw));
      } catch (e) {
        console.error("Suggestions parse error:", e.message);
        return res.status(500).json({ error: "Failed to parse suggestions. Please try again." });
      }
    }
  } catch (err) {
    console.error("Suggestions error:", err);
    return res.status(500).json({ error: "Failed to get suggestions. Please try again." });
  }
});

module.exports = router;
