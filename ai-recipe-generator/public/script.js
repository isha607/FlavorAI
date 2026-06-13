const form = document.getElementById('recipe-form');
const result = document.getElementById('result');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const ingredients = document.getElementById('ingredients').value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (ingredients.length === 0) {
    result.innerHTML = '<p>Please enter at least one ingredient.</p>';
    result.classList.remove('hidden');
    return;
  }

  try {
    const response = await fetch('/api/recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients }),
    });

    const data = await response.json();

    if (!response.ok) {
      result.innerHTML = `<p>${data.error || 'Unable to generate recipe.'}</p>`;
    } else {
      result.innerHTML = `
        <h2 class="recipe-title">${data.title}</h2>
        <div class="recipe-section">
          <h3>Ingredients</h3>
          <ul>${data.ingredients.map((item) => `<li>${item}</li>`).join('')}</ul>
        </div>
        <div class="recipe-section">
          <h3>Instructions</h3>
          <p>${data.instructions}</p>
        </div>
        <div class="recipe-section">
          <h3>Suggestions</h3>
          <ul>${data.suggestions.map((suggestion) => `<li><strong>${suggestion.title}:</strong> ${suggestion.description}</li>`).join('')}</ul>
        </div>
      `;
    }
  } catch (error) {
    result.innerHTML = '<p>There was a problem contacting the server.</p>';
  }

  result.classList.remove('hidden');
});
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  darkModeToggle.innerHTML = theme === "dark"
    ? '<i data-lucide="sun"></i> Toggle theme'
    : '<i data-lucide="moon"></i> Toggle theme';
  lucide.createIcons();
}
lucide.createIcons();