// ═══════════════════════════════════════════
//  FlavorAI – script.js
// ═══════════════════════════════════════════

// ── State ──
let currentRecipe = null;
let currentRemedyRecipe = null;
let activeGoal = "Muscle Gain";

// ── Tab navigation ──
const navItems = document.querySelectorAll(".nav-item");
const tabs     = document.querySelectorAll(".tab");

navItems.forEach(btn => {
  btn.addEventListener("click", () => {
    navItems.forEach(b => b.classList.remove("active"));
    tabs.forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "favorites") renderFavorites();
    if (btn.dataset.tab === "history")   renderHistory();
  });
});

// ── Mode sub-tabs (within generate tab) ──
document.querySelectorAll(".mode-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".mode-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("mode-" + btn.dataset.mode).classList.add("active");
    // Hide cuisine cards in fitness mode
    document.getElementById("cuisineCards").style.display =
      btn.dataset.mode === "fitness" ? "none" : "";
  });
});

// ── Cuisine card selection ──
document.querySelectorAll(".quick-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".quick-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    document.getElementById("cuisine").value = card.dataset.cuisine;
    document.getElementById("searchCuisine").value = card.dataset.cuisine;
  });
});

// ── Fitness goal card selection ──
document.querySelectorAll(".goal-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".goal-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    activeGoal = card.dataset.goal;
  });
});

// ── Dark mode ──
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("darkModeToggle").textContent =
    theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode";
}
applyTheme(localStorage.getItem("theme") || "light");

document.getElementById("darkModeToggle").addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyTheme(next);
});

// ═══════════════════════════════════════════
//  Core request function
// ═══════════════════════════════════════════
async function requestRecipe({ ingredients = "", cuisine = "Any", diet = "None",
  searchQuery = "", mode = "ingredients",
  goal = "", mealType = "", condition = "" } = {}) {

  const isRemedy = mode === "remedy";

  const loadingEl      = document.getElementById(isRemedy ? "remedyLoading" : "loading");
  const errorEl        = document.getElementById("errorMsg");
  const remedyErrorEl  = document.getElementById("remedyErrorMsg");
  const resultEl       = document.getElementById(isRemedy ? "remedyResultCard" : "result");
  const emptyEl        = document.getElementById("resultEmpty");
  const generateBtn    = document.getElementById("generateBtn");

  // Show loading
  loadingEl.classList.remove("hidden");
  if (!isRemedy) {
    resultEl.classList.add("hidden");
    emptyEl?.classList.add("hidden");
    errorEl.classList.add("hidden");
  } else {
    resultEl.classList.add("hidden");
    remedyErrorEl?.classList.add("hidden");
  }
  if (generateBtn) generateBtn.disabled = true;

  try {
    const res = await fetch("/api/recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients, cuisine, diet, searchQuery, mode, goal, mealType, condition })
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error("You're generating recipes too quickly! Please wait a minute and try again.");
      }
      throw new Error(data.error || "Something went wrong");
    }

    if (isRemedy) {
      currentRemedyRecipe = data;
      renderRecipe(data, "remedy");
    } else {
      currentRecipe = data;
      renderRecipe(data, "main");
      addToHistory(data);
    }
  } catch (err) {
    if (!isRemedy) {
      errorEl.textContent = err.message;
      errorEl.classList.remove("hidden");
      emptyEl?.classList.remove("hidden");
    } else {
      if (remedyErrorEl) {
        remedyErrorEl.textContent = "Error: " + err.message;
        remedyErrorEl.classList.remove("hidden");
      } else {
        alert("Error: " + err.message);
      }
    }
  } finally {
    loadingEl.classList.add("hidden");
    if (generateBtn) generateBtn.disabled = false;
  }
}

// ═══════════════════════════════════════════
//  Render recipe (shared for main + remedy)
// ═══════════════════════════════════════════
function renderRecipe(data, panel = "main") {
  const p = panel === "remedy" ? "r-" : "";

  // Basic fields
  document.getElementById(p + "recipeTitle").textContent = data.title;
  document.getElementById(p + "recipeDescription").textContent = data.description;
  document.getElementById(p + "cuisineBadge").textContent    = "🍽️ " + data.cuisine;
  document.getElementById(p + "difficultyBadge").textContent = "⚡ " + data.difficulty;
  document.getElementById(p + "cookTimeBadge").textContent   = "⏱ " + data.cookTime;

  // Ingredients
  const ingList = document.getElementById(p + "ingredientsList");
  ingList.innerHTML = "";
  (data.ingredients || []).forEach(item => {
    const li = document.createElement("li"); li.textContent = item; ingList.appendChild(li);
  });

  // Steps
  const stepsList = document.getElementById(p + "stepsList");
  stepsList.innerHTML = "";
  (data.steps || []).forEach(step => {
    const li = document.createElement("li"); li.textContent = step; stepsList.appendChild(li);
  });

  // Nutrition
  const tbody = document.querySelector("#" + p + "nutritionTable tbody");
  tbody.innerHTML = "";
  Object.entries(data.nutrition || {}).forEach(([key, val]) => {
    const tr = document.createElement("tr");
    const k = document.createElement("td"); k.textContent = key;
    const v = document.createElement("td"); v.textContent = val;
    tr.appendChild(k); tr.appendChild(v); tbody.appendChild(tr);
  });

  // Fun fact / Why it helps
  document.getElementById(p + "funFactText").textContent = data.funFact || "";

  // Healthy suggestion
  const hsSection = document.getElementById(p + "healthySuggestionSection");
  const hsText    = document.getElementById(p + "healthySuggestionText");
  if (hsSection && data.healthySuggestion && data.healthySuggestion.trim()) {
    hsText.textContent = data.healthySuggestion;
    hsSection.classList.remove("hidden");
  } else {
    hsSection?.classList.add("hidden");
  }

  // Preparation note (main panel only)
  if (panel === "main") {
    const prepSection = document.getElementById("prepNoteSection");
    const prepText    = document.getElementById("prepNoteText");
    if (data.preparationNote && data.preparationNote.trim()) {
      prepText.textContent = data.preparationNote;
      prepSection.classList.remove("hidden");
    } else {
      prepSection.classList.add("hidden");
    }
  }

  // Show result card
  document.getElementById(panel === "remedy" ? "remedyResultCard" : "result").classList.remove("hidden");
  if (panel === "main") document.getElementById("resultEmpty").classList.add("hidden");
}

// ═══════════════════════════════════════════
//  Form handlers
// ═══════════════════════════════════════════

// Ingredients form
document.getElementById("recipeForm").addEventListener("submit", async e => {
  e.preventDefault();
  let ingredients = document.getElementById("ingredients").value.trim();
  if (!ingredients) return;

  // Auto-include pantry staples
  const defaults = ["salt", "water", "oil"];
  const lower = ingredients.toLowerCase();
  const toAdd = defaults.filter(d => !lower.includes(d));
  if (toAdd.length) ingredients += ", " + toAdd.join(", ");

  await requestRecipe({
    ingredients,
    cuisine: document.getElementById("cuisine").value,
    diet:    document.getElementById("diet").value,
    mode:    "ingredients"
  });
});

// Search dish button
document.getElementById("searchDishBtn").addEventListener("click", async () => {
  const dishName = document.getElementById("dishName").value.trim();
  if (!dishName) return;
  await requestRecipe({
    searchQuery: dishName,
    cuisine: document.getElementById("searchCuisine").value,
    diet:    document.getElementById("searchDiet").value,
    mode:    "search"
  });
});

// Search dish on Enter key
document.getElementById("dishName").addEventListener("keydown", e => {
  if (e.key === "Enter") { e.preventDefault(); document.getElementById("searchDishBtn").click(); }
});

// Fitness generate button
document.getElementById("fitnessGenerateBtn").addEventListener("click", async () => {
  await requestRecipe({
    goal:        activeGoal,
    mealType:    document.getElementById("fitnessMeal").value,
    diet:        document.getElementById("fitnessDiet").value,
    ingredients: document.getElementById("fitnessIngredients").value.trim(),
    mode:        "fitness"
  });
});

// Remedy condition cards — Step 1: fetch 5 suggestions
document.querySelectorAll(".remedy-card").forEach(card => {
  card.addEventListener("click", async () => {
    document.querySelectorAll(".remedy-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");

    // Reset UI
    document.getElementById("remedyResultCard").classList.add("hidden");
    document.getElementById("remedySuggestionsArea").classList.add("hidden");
    document.getElementById("remedyErrorMsg").classList.add("hidden");
    document.getElementById("remedyLoading").classList.remove("hidden");

    try {
      const res = await fetch("/api/recipe/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition: card.dataset.condition })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Too many requests! Please wait a minute before requesting more suggestions.");
        }
        throw new Error(data.error || "Failed");
      }
      renderSuggestions(data.suggestions, card.dataset.condition);
    } catch (err) {
      const errEl = document.getElementById("remedyErrorMsg");
      errEl.textContent = "Could not load suggestions: " + err.message;
      errEl.classList.remove("hidden");
    } finally {
      document.getElementById("remedyLoading").classList.add("hidden");
    }
  });
});

// Step 2: render suggestion cards
function renderSuggestions(suggestions, condition) {
  const area         = document.getElementById("remedySuggestionsArea");
  const list         = document.getElementById("remedySuggestionsList");
  const remedyErrorEl = document.getElementById("remedyErrorMsg");

  if (!Array.isArray(suggestions) || !suggestions.length) {
    if (remedyErrorEl) {
      remedyErrorEl.textContent = "No remedy suggestions were returned. Please try another condition.";
      remedyErrorEl.classList.remove("hidden");
    }
    return;
  }

  remedyErrorEl?.classList.add("hidden");
  document.getElementById("remedySuggestionsTitle").textContent =
    "5 Remedy Recipes for: " + condition.replace(" and ", " & ");

  list.innerHTML = "";
  suggestions.forEach((s, i) => {
    const card = document.createElement("div");
    card.className = "suggestion-card";
    card.innerHTML = `
      <div class="suggestion-top">
        <span class="suggestion-num">${i + 1}</span>
        <span class="suggestion-badge">${s.keyIngredient}</span>
        <span class="suggestion-time">⏱ ${s.prepTime}</span>
      </div>
      <h4 class="suggestion-name">${s.name}</h4>
      <p class="suggestion-desc">${s.description}</p>
      <button class="suggestion-btn">Cook This Recipe →</button>
    `;
    card.querySelector(".suggestion-btn").addEventListener("click", async () => {
      document.querySelectorAll(".suggestion-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      await requestRecipe({ condition, searchQuery: s.name, mode: "remedy" });
      document.getElementById("remedyResultCard").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    list.appendChild(card);
  });

  area.classList.remove("hidden");
  area.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ═══════════════════════════════════════════
//  Copy buttons
// ═══════════════════════════════════════════
document.getElementById("copyBtn").addEventListener("click", () => {
  if (!currentRecipe) return;
  navigator.clipboard.writeText(formatRecipeText(currentRecipe)).then(() => {
    const btn = document.getElementById("copyBtn");
    btn.textContent = "✅ Copied!";
    setTimeout(() => btn.textContent = "📋 Copy Recipe", 1500);
  });
});

document.getElementById("r-copyBtn").addEventListener("click", () => {
  if (!currentRemedyRecipe) return;
  navigator.clipboard.writeText(formatRecipeText(currentRemedyRecipe)).then(() => {
    const btn = document.getElementById("r-copyBtn");
    btn.textContent = "✅ Copied!";
    setTimeout(() => btn.textContent = "📋 Copy Recipe", 1500);
  });
});

function formatRecipeText(data) {
  let t = data.title + "\n" + data.description + "\n\n";
  t += "Cuisine: " + data.cuisine + " | Difficulty: " + data.difficulty + " | Cook Time: " + data.cookTime + "\n\n";
  t += "Ingredients:\n"; data.ingredients.forEach(i => t += "- " + i + "\n");
  t += "\nSteps:\n"; data.steps.forEach((s, i) => t += (i + 1) + ". " + s + "\n");
  t += "\nNutrition (per serving):\n";
  Object.entries(data.nutrition).forEach(([k, v]) => t += k + ": " + v + "\n");
  if (data.funFact) t += "\nFun Fact: " + data.funFact + "\n";
  return t;
}

// ═══════════════════════════════════════════
//  Save to Favorites
// ═══════════════════════════════════════════
document.getElementById("saveBtn").addEventListener("click", () => saveRecipe(currentRecipe, "saveBtn"));
document.getElementById("r-saveBtn").addEventListener("click", () => saveRecipe(currentRemedyRecipe, "r-saveBtn"));

function saveRecipe(recipe, btnId) {
  if (!recipe) return;
  let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  const exists  = favorites.some(r => r.title === recipe.title);
  const btn = document.getElementById(btnId);
  if (!exists) {
    favorites.unshift(recipe);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    btn.textContent = "✅ Saved!";
  } else {
    btn.textContent = "⭐ Already Saved";
  }
  setTimeout(() => btn.textContent = "⭐ Save to Favorites", 1500);
}

// ═══════════════════════════════════════════
//  History
// ═══════════════════════════════════════════
function addToHistory(data) {
  let history = JSON.parse(localStorage.getItem("recipeHistory") || "[]");
  history.unshift(data);
  history = history.slice(0, 5);
  localStorage.setItem("recipeHistory", JSON.stringify(history));
}

function renderHistory() {
  const list = document.getElementById("historyList");
  const history = JSON.parse(localStorage.getItem("recipeHistory") || "[]");
  list.innerHTML = "";
  if (!history.length) { list.innerHTML = '<p class="empty-msg">No recipes yet. Generate one!</p>'; return; }
  history.forEach(recipe => list.appendChild(makeHistoryCard(recipe)));
}

function renderFavorites() {
  const list = document.getElementById("favoritesList");
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  list.innerHTML = "";
  if (!favs.length) { list.innerHTML = '<p class="empty-msg">No favorites yet. Save a recipe!</p>'; return; }
  favs.forEach(recipe => list.appendChild(makeHistoryCard(recipe)));
}

function makeHistoryCard(recipe) {
  const card = document.createElement("div");
  card.className = "history-card";
  card.innerHTML = `<div><div class="hist-title">${recipe.title}</div><div class="hist-meta">${recipe.cuisine} • ${recipe.difficulty} • ${recipe.cookTime}</div></div><span>›</span>`;
  card.addEventListener("click", () => {
    // Switch to generate tab and show recipe
    navItems.forEach(b => b.classList.remove("active"));
    tabs.forEach(t => t.classList.remove("active"));
    document.querySelector('[data-tab="generate"]').classList.add("active");
    document.getElementById("tab-generate").classList.add("active");
    currentRecipe = recipe;
    renderRecipe(recipe, "main");
  });
  return card;
}
