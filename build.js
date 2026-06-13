const fs = require("fs");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FlavorAI - AI Recipe Generator</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="logo"><span class="logo-icon">\`\\u{1F951}\`</span><span class="logo-text">Flavor<span class="accent">AI</span></span></div>

      <p class="nav-label">MENU</p>
      <button class="nav-item active" data-tab="generate">\`\\u{2728}\` Generate</button>
      <button class="nav-item" data-tab="favorites">\`\\u{2B50}\` Favorites</button>
      <button class="nav-item" data-tab="history">\`\\u{1F551}\` History</button>

      <p class="nav-label">INFO</p>
      <button class="nav-item" data-tab="about">\`\\u{2139}\\uFE0F\` About</button>

      <button id="darkModeToggle" class="theme-toggle">\`\\u{1F319}\` Toggle theme</button>
    </aside>

    <main class="main">
      <!-- GENERATE TAB -->
      <section id="tab-generate" class="tab active">
        <header class="page-header">
          <h1>Hello! \`\\u{1F44B}\` Let's cook something \`\\u{2728}\`</h1>
          <p>Pick a cuisine, enter your ingredients, and get a full AI-generated recipe with nutrition info.</p>
        </header>

        <div class="search-row">
          <input id="searchInput" type="text" placeholder="Search recipes by name, ingredient, or dish" />
          <button id="searchBtn" type="button">Search Recipe</button>
        </div>
        <p id="searchStatus" class="search-status hidden"></p>

        <div class="quick-cards">
          <div class="quick-card" data-cuisine="Indian"><span class="qc-icon">\`\\u{1F1EE}\\u{1F1F3}\`</span><div><b>Indian</b><small>Spices &amp; curries</small></div></div>
          <div class="quick-card" data-cuisine="Italian"><span class="qc-icon">\`\\u{1F1EE}\\u{1F1F9}\`</span><div><b>Italian</b><small>Pasta &amp; pizza</small></div></div>
          <div class="quick-card" data-cuisine="Mexican"><span class="qc-icon">\`\\u{1F1F2}\\u{1F1FD}\`</span><div><b>Mexican</b><small>Bold &amp; spicy</small></div></div>
        </div>

        <div class="grid-2">
          <div class="card form-card">
            <h3>\`\\u{1F9FA}\` Your ingredients</h3>
            <form id="recipeForm">
              <label for="ingredients">Ingredients (comma separated)</label>
              <textarea id="ingredients" placeholder="e.g. tomato, onion, garlic, pasta" required></textarea>

              <div class="form-row">
                <div class="form-group">
                  <label for="cuisine">\`\\u{1F30D}\` Cuisine</label>
                  <select id="cuisine">
                    <option value="Any">Any</option>
                    <option value="Indian">Indian</option>
                    <option value="Italian">Italian</option>
                    <option value="Mexican">Mexican</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Mediterranean">Mediterranean</option>
                    <option value="American">American</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="diet">\`\\u{1F957}\` Diet</label>
                  <select id="diet">
                    <option value="None">None</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Keto">Keto</option>
                    <option value="Gluten-Free">Gluten-Free</option>
                  </select>
                </div>
              </div>

              <button type="submit" id="generateBtn">\`\\u{2728}\` Generate Recipe</button>
            </form>

            <div id="loading" class="loading hidden">
              <img src="https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif" alt="cooking" class="cook-gif" />
              <p>Cooking up something delicious...</p>
            </div>
            <div id="errorMsg" class="error hidden"></div>
          </div>

          <div class="card result-card" id="resultPanel">
            <h3>\`\\u{1F37D}\\uFE0F\` Recipe result</h3>
            <div id="resultEmpty" class="empty-state">
              <p>Your AI-generated recipe will appear here \`\\u{2728}\`</p>
              <small>For best results, list 3-6 ingredients you have on hand.</small>
            </div>

            <div id="result" class="hidden">
              <div class="result-header">
                <h2 id="recipeTitle"></h2>
                <div class="badges">
                  <span id="cuisineBadge" class="badge"></span>
                  <span id="difficultyBadge" class="badge"></span>
                  <span id="cookTimeBadge" class="badge"></span>
                </div>
              </div>
              <p id="recipeDescription" class="description"></p>

              <div class="section">
                <h4>\`\\u{1F9C2}\` Ingredients</h4>
                <ul id="ingredientsList"></ul>
              </div>

              <div class="section">
                <h4>\`\\u{1F469}\\u200D\\u{1F373}\` Steps</h4>
                <ol id="stepsList"></ol>
              </div>

              <div class="section">
                <h4>\`\\u{1F4CA}\` Nutrition (per serving)</h4>
                <table id="nutritionTable"><tbody></tbody></table>
              </div>

              <div class="section fun-fact">
                <h4>\`\\u{1F4A1}\` Fun Fact</h4>
                <p id="funFactText"></p>
              </div>

              <div class="action-buttons">
                <button id="copyBtn">\`\\u{1F4CB}\` Copy Recipe</button>
                <button id="saveBtn">\`\\u{2B50}\` Save to Favorites</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FAVORITES TAB -->
      <section id="tab-favorites" class="tab">
        <header class="page-header">
          <h1>\`\\u{2B50}\` Your Favorites</h1>
          <p>Recipes you've saved for later.</p>
        </header>
        <div id="favoritesList" class="card-list"></div>
      </section>

      <!-- HISTORY TAB -->
      <section id="tab-history" class="tab">
        <header class="page-header">
          <h1>\`\\u{1F551}\` Recent History</h1>
          <p>Your last 5 generated recipes.</p>
        </header>
        <div id="historyList" class="card-list"></div>
      </section>

      <!-- ABOUT TAB -->
      <section id="tab-about" class="tab">
        <header class="page-header">
          <h1>\`\\u{2139}\\uFE0F\` About FlavorAI</h1>
        </header>
        <div class="card">
          <p>FlavorAI is an AI-powered recipe generator built with HTML, CSS, JavaScript, Node.js, Express, and the Groq API.</p>
          <p>Enter the ingredients you have at home, pick a cuisine and dietary preference, and get a complete recipe with step-by-step instructions, estimated nutrition facts, and a fun food trivia tidbit \u{2014} all generated in seconds.</p>
          <p><b>Disclaimer:</b> Nutrition values are AI-estimated approximations and should not be used for medical or strict dietary tracking.</p>
        </div>
      </section>
    </main>
  </div>

  <script src="script.js"></script>
</body>
</html>`;

const css = `:root {
  --bg: #f5f3ef;
  --sidebar-bg: #fff8f3;
  --card-bg: #ffffff;
  --text: #2d2a26;
  --muted: #8a8378;
  --primary: #ff6b35;
  --primary-dark: #e8551f;
  --accent: #2e9e4f;
  --border: #ece3d8;
  --shadow: 0 8px 24px rgba(0,0,0,0.05);
}

[data-theme="dark"] {
  --bg: #15120f;
  --sidebar-bg: #1c1813;
  --card-bg: #221d18;
  --text: #f3ede4;
  --muted: #a89e8f;
  --primary: #ff8b5e;
  --primary-dark: #ff6b35;
  --accent: #6fcf73;
  --border: #352c25;
  --shadow: 0 8px 24px rgba(0,0,0,0.4);
}

* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  background: radial-gradient(circle at top left, rgba(255,107,53,0.12), transparent 18%),
              radial-gradient(circle at bottom right, rgba(46,158,79,0.12), transparent 22%),
              linear-gradient(145deg, #fff9f2 0%, #eaf0f8 100%);
  color: var(--text);
  transition: background 0.3s, color 0.3s;
  min-height: 100vh;
}

.app { display: flex; min-height: 100vh; }

/* SIDEBAR */
.sidebar {
  width: 220px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: sticky;
  top: 0;
  height: 100vh;
}
.logo { display: flex; align-items: center; gap: 8px; font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 22px; margin-bottom: 18px; }
.logo-icon { font-size: 26px; }
.accent { color: var(--primary); }

.nav-label { font-size: 11px; color: var(--muted); letter-spacing: 1px; margin: 14px 4px 6px; font-weight: 700; }
.nav-item {
  display: block; text-align: left; width: 100%;
  background: transparent; border: none; padding: 10px 12px;
  border-radius: 10px; font-size: 14px; font-weight: 500;
  color: var(--text); cursor: pointer; font-family: 'Inter', sans-serif;
  transition: background 0.2s, transform 0.15s;
}
.nav-item:hover { background: var(--border); transform: translateX(3px); }
.nav-item.active { background: var(--primary); color: white; font-weight: 600; }

.theme-toggle {
  margin-top: auto;
  background: var(--card-bg); border: 1px solid var(--border);
  padding: 10px; border-radius: 10px; cursor: pointer; font-size: 13px;
  color: var(--text); font-family: 'Inter', sans-serif;
}

/* MAIN */
.main { flex: 1; padding: 28px 32px; max-width: 1000px; }
.page-header { margin-bottom: 20px; animation: fadeUp 0.5s ease; }
.page-header h1 { font-family: 'Poppins', sans-serif; font-size: 26px; margin: 0 0 6px; }
.page-header p { color: var(--muted); margin: 0; font-size: 14px; }

.search-row {
  display: flex;
  gap: 10px;
  margin: 18px 0 10px;
}

.search-row input {
  flex: 1;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 14px;
}

.search-row button {
  padding: 12px 18px;
  background: var(--primary);
  color: white;
  border-radius: 12px;
  border: none;
  font-weight: 700;
}

.search-status {
  margin: 0 0 18px;
  color: var(--muted);
  font-size: 13px;
}

.hidden {
  display: none;
}

.tab { display: none; }
.tab.active { display: block; }

/* Quick cuisine cards */
.quick-cards { display: flex; gap: 14px; margin-bottom: 22px; flex-wrap: wrap; }
.quick-card {
  flex: 1; min-width: 150px;
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 14px;
  padding: 14px; display: flex; align-items: center; gap: 12px; cursor: pointer;
  transition: transform 0.15s, border-color 0.2s; box-shadow: var(--shadow);
}
.quick-card:hover { transform: translateY(-3px); border-color: var(--primary); }
.quick-card.selected { border-color: var(--primary); background: rgba(255,107,53,0.06); }
.qc-icon { font-size: 26px; }
.quick-card small { display: block; color: var(--muted); font-size: 12px; }

/* Grid layout */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } .sidebar { display: none; } .main { padding: 20px; } }

.card {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px;
  padding: 22px; box-shadow: var(--shadow); animation: fadeUp 0.5s ease;
}
.card h3 { margin: 0 0 16px; font-family: 'Poppins', sans-serif; font-size: 17px; }

label { font-size: 13px; font-weight: 600; margin-bottom: 4px; display: block; font-family: 'Poppins', sans-serif; }
textarea, select {
  width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border);
  background: var(--bg); color: var(--text); font-size: 14px; font-family: inherit; resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s; margin-bottom: 14px;
}
textarea:focus, select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(255,107,53,0.15); }
textarea { min-height: 90px; }

.form-row { display: flex; gap: 12px; }
.form-group { flex: 1; }

button { cursor: pointer; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: 'Poppins', sans-serif; }
#generateBtn {
  width: 100%; background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white; padding: 14px; font-size: 15px; box-shadow: 0 8px 20px rgba(255,107,53,0.3);
  transition: transform 0.2s;
}
#generateBtn:hover { transform: translateY(-2px); }
#generateBtn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.loading { text-align: center; margin: 20px 0; animation: fadeUp 0.4s ease; }
.loading.hidden, #result.hidden, .error.hidden, #resultEmpty.hidden { display: none; }
.cook-gif { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; }
.loading p { margin-top: 8px; color: var(--muted); font-size: 13px; }

.error { background: #fee2e2; color: #b91c1c; padding: 12px 16px; border-radius: 10px; margin-top: 12px; font-size: 14px; }

.empty-state { text-align: center; padding: 40px 10px; color: var(--muted); }
.empty-state small { display: block; margin-top: 6px; font-size: 12px; }

.result-header h2 { margin: 0 0 10px; font-family: 'Poppins', sans-serif; font-size: 20px; }
.badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.badge { background: var(--bg); border: 1px solid var(--border); border-radius: 20px; padding: 5px 12px; font-size: 12px; font-weight: 500; }
.description { color: var(--muted); font-size: 14px; margin-bottom: 16px; }
.section { margin-bottom: 18px; }
.section h4 { font-size: 14px; margin-bottom: 8px; font-family: 'Poppins', sans-serif; }
.section ul, .section ol { margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.7; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
table td { padding: 7px 8px; border-bottom: 1px solid var(--border); }
table td:first-child { font-weight: 600; text-transform: capitalize; width: 40%; color: var(--accent); }
.fun-fact { background: linear-gradient(135deg, rgba(255,107,53,0.08), rgba(46,158,79,0.08)); border-radius: 12px; padding: 12px 14px; border: 1px solid var(--border); }
.fun-fact p { margin: 0; font-size: 14px; }
.action-buttons { display: flex; gap: 10px; margin-top: 12px; }
.action-buttons button { flex: 1; padding: 11px; background: var(--bg); border: 1px solid var(--border); color: var(--text); transition: background 0.2s, transform 0.15s; }
.action-buttons button:hover { background: var(--border); transform: translateY(-2px); }

/* History / favorites cards */
.card-list { display: flex; flex-direction: column; gap: 10px; }
.history-card {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 14px;
  padding: 14px 16px; cursor: pointer; display: flex; justify-content: space-between;
  align-items: center; font-size: 14px; transition: transform 0.15s, background 0.2s;
  animation: fadeUp 0.4s ease;
}
.history-card:hover { background: var(--bg); transform: translateX(4px); }
.history-card .hist-title { font-weight: 600; font-family: 'Poppins', sans-serif; }
.history-card .hist-meta { color: var(--muted); font-size: 12px; }
.empty-msg { color: var(--muted); font-size: 14px; }

@keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
`;

const js = `// ---------- Tab navigation ----------
const navItems = document.querySelectorAll(".nav-item");
const tabs = document.querySelectorAll(".tab");

navItems.forEach((btn) => {
  btn.addEventListener("click", () => {
    navItems.forEach((b) => b.classList.remove("active"));
    tabs.forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");

    if (btn.dataset.tab === "favorites") renderFavorites();
    if (btn.dataset.tab === "history") renderHistory();
  });
});

// ---------- Quick cuisine cards ----------
document.querySelectorAll(".quick-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".quick-card").forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    document.getElementById("cuisine").value = card.dataset.cuisine;
  });
});

// ---------- Elements ----------
const form = document.getElementById("recipeForm");
const loading = document.getElementById("loading");
const errorMsg = document.getElementById("errorMsg");
const result = document.getElementById("result");
const resultEmpty = document.getElementById("resultEmpty");
const generateBtn = document.getElementById("generateBtn");

const recipeTitle = document.getElementById("recipeTitle");
const recipeDescription = document.getElementById("recipeDescription");
const cuisineBadge = document.getElementById("cuisineBadge");
const difficultyBadge = document.getElementById("difficultyBadge");
const cookTimeBadge = document.getElementById("cookTimeBadge");
const ingredientsList = document.getElementById("ingredientsList");
const stepsList = document.getElementById("stepsList");
const nutritionTable = document.querySelector("#nutritionTable tbody");
const funFactText = document.getElementById("funFactText");

const copyBtn = document.getElementById("copyBtn");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchStatus = document.getElementById("searchStatus");
const saveBtn = document.getElementById("saveBtn");
const historyList = document.getElementById("historyList");
const favoritesList = document.getElementById("favoritesList");
const darkModeToggle = document.getElementById("darkModeToggle");

let currentRecipe = null;

// ---------- Dark mode ----------
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  darkModeToggle.textContent = theme === "dark" ? "\u2600\uFE0F Light mode" : "\u{1F319} Dark mode";
}
applyTheme(localStorage.getItem("theme") || "light");

darkModeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  localStorage.setItem("theme", current);
  applyTheme(current);
});

searchBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim();
  if (!query) return;
  await handleSearch(query);
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchBtn.click();
  }
});

function getStoredRecipes() {
  const history = JSON.parse(localStorage.getItem("recipeHistory") || "[]");
  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  return [...favorites, ...history];
}

function findSavedRecipe(query) {
  const normalized = query.toLowerCase().trim();
  return getStoredRecipes().find((recipe) => {
    if (recipe.title.toLowerCase().includes(normalized)) return true;
    if (recipe.description && recipe.description.toLowerCase().includes(normalized)) return true;
    return recipe.ingredients.some((ingredient) => ingredient.toLowerCase().includes(normalized));
  });
}

function setSearchStatus(message) {
  searchStatus.textContent = message;
  searchStatus.classList.toggle("hidden", !message);
}

async function handleSearch(query) {
  setSearchStatus("Searching saved recipes…");
  const saved = findSavedRecipe(query);
  if (saved) {
    currentRecipe = saved;
    renderRecipe(saved);
    setSearchStatus("Found saved recipe: \"" + saved.title + "\".");
    return;
  }

  setSearchStatus("No saved recipe found. Generating a recipe from your search...");
  await requestRecipe("", document.getElementById("cuisine").value, document.getElementById("diet").value, query);
}

// ---------- Form submit ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ingredients = document.getElementById("ingredients").value.trim();
  const cuisine = document.getElementById("cuisine").value;
  const diet = document.getElementById("diet").value;
  if (!ingredients) return;

  setSearchStatus("");
  await requestRecipe(ingredients, cuisine, diet);
});

async function requestRecipe(ingredients, cuisine, diet, searchQuery = "") {
  errorMsg.classList.add("hidden");
  result.classList.add("hidden");
  resultEmpty.classList.add("hidden");
  loading.classList.remove("hidden");
  generateBtn.disabled = true;

  try {
    const res = await fetch("/api/recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients, cuisine, diet, searchQuery }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong");

    currentRecipe = data;
    renderRecipe(data);
    addToHistory(data);
    setSearchStatus("");
    return data;
  } catch (err) {
    resultEmpty.classList.remove("hidden");
    errorMsg.textContent = err.message;
    errorMsg.classList.remove("hidden");
    setSearchStatus("");
  } finally {
    loading.classList.add("hidden");
    generateBtn.disabled = false;
  }
});

function renderRecipe(data) {
  recipeTitle.textContent = data.title;
  recipeDescription.textContent = data.description;
  cuisineBadge.textContent = "\u{1F37D}\uFE0F " + data.cuisine;
  difficultyBadge.textContent = "\u26A1 " + data.difficulty;
  cookTimeBadge.textContent = "\u23F1 " + data.cookTime;

  ingredientsList.innerHTML = "";
  data.ingredients.forEach((item) => {
    const li = document.createElement("li"); li.textContent = item; ingredientsList.appendChild(li);
  });

  stepsList.innerHTML = "";
  data.steps.forEach((step) => {
    const li = document.createElement("li"); li.textContent = step; stepsList.appendChild(li);
  });

  nutritionTable.innerHTML = "";
  Object.entries(data.nutrition).forEach(([key, value]) => {
    const tr = document.createElement("tr");
    const tdKey = document.createElement("td"); tdKey.textContent = key;
    const tdVal = document.createElement("td"); tdVal.textContent = value;
    tr.appendChild(tdKey); tr.appendChild(tdVal); nutritionTable.appendChild(tr);
  });

  funFactText.textContent = data.funFact;
  result.classList.remove("hidden");
  resultEmpty.classList.add("hidden");
}

// ---------- Copy ----------
copyBtn.addEventListener("click", () => {
  if (!currentRecipe) return;
  navigator.clipboard.writeText(formatRecipeText(currentRecipe)).then(() => {
    copyBtn.textContent = "\u2705 Copied!";
    setTimeout(() => (copyBtn.textContent = "\u{1F4CB} Copy Recipe"), 1500);
  });
});

function formatRecipeText(data) {
  let text = data.title + "\\n" + data.description + "\\n\\n";
  text += "Cuisine: " + data.cuisine + " | Difficulty: " + data.difficulty + " | Cook Time: " + data.cookTime + "\\n\\n";
  text += "Ingredients:\\n";
  data.ingredients.forEach((i) => (text += "- " + i + "\\n"));
  text += "\\nSteps:\\n";
  data.steps.forEach((s, i) => (text += (i + 1) + ". " + s + "\\n"));
  text += "\\nNutrition (per serving):\\n";
  Object.entries(data.nutrition).forEach(([k, v]) => (text += k + ": " + v + "\\n"));
  text += "\\nFun Fact: " + data.funFact + "\\n";
  return text;
}

// ---------- History ----------
function addToHistory(data) {
  let history = JSON.parse(localStorage.getItem("recipeHistory") || "[]");
  history.unshift(data);
  history = history.slice(0, 5);
  localStorage.setItem("recipeHistory", JSON.stringify(history));
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("recipeHistory") || "[]");
  historyList.innerHTML = "";
  if (history.length === 0) {
    historyList.innerHTML = '<p class="empty-msg">No recipes yet. Generate one!</p>';
    return;
  }
  history.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "history-card";
    card.innerHTML = '<div><div class="hist-title">' + recipe.title + '</div><div class="hist-meta">' + recipe.cuisine + " \\u2022 " + recipe.difficulty + " \\u2022 " + recipe.cookTime + '</div></div><span>\\u203A</span>';
    card.addEventListener("click", () => {
      currentRecipe = recipe;
      navItems.forEach((b) => b.classList.remove("active"));
      tabs.forEach((t) => t.classList.remove("active"));
      document.querySelector('[data-tab="generate"]').classList.add("active");
      document.getElementById("tab-generate").classList.add("active");
      renderRecipe(recipe);
    });
    historyList.appendChild(card);
  });
}

// ---------- Favorites ----------
saveBtn.addEventListener("click", () => {
  if (!currentRecipe) return;
  let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  const exists = favorites.some((r) => r.title === currentRecipe.title);
  if (!exists) {
    favorites.unshift(currentRecipe);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    saveBtn.textContent = "\u2705 Saved!";
  } else {
    saveBtn.textContent = "\u2B50 Already Saved";
  }
  setTimeout(() => (saveBtn.textContent = "\u2B50 Save to Favorites"), 1500);
});

function renderFavorites() {
  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  favoritesList.innerHTML = "";
  if (favorites.length === 0) {
    favoritesList.innerHTML = '<p class="empty-msg">No favorites yet. Save a recipe to see it here!</p>';
    return;
  }
  favorites.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "history-card";
    card.innerHTML = '<div><div class="hist-title">' + recipe.title + '</div><div class="hist-meta">' + recipe.cuisine + " \\u2022 " + recipe.difficulty + " \\u2022 " + recipe.cookTime + '</div></div><span>\\u203A</span>';
    card.addEventListener("click", () => {
      currentRecipe = recipe;
      navItems.forEach((b) => b.classList.remove("active"));
      tabs.forEach((t) => t.classList.remove("active"));
      document.querySelector('[data-tab="generate"]').classList.add("active");
      document.getElementById("tab-generate").classList.add("active");
      renderRecipe(recipe);
    });
    favoritesList.appendChild(card);
  });
}
`;

fs.writeFileSync("public/index.html", html, "utf8");
fs.writeFileSync("public/style.css", css, "utf8");
fs.writeFileSync("public/script.js", js, "utf8");
console.log("All files regenerated successfully!");