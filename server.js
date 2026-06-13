require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const recipeRoute = require('./routes/recipe');

const app  = express();
const PORT = process.env.PORT || 5000;

// Generous limiter — covers both /api/recipe and /api/recipe/suggestions
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute window
  max: 60,                    // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down and try again in a moment.' },
});

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Single mount point — router handles both / and /suggestions internally
app.use('/api/recipe', apiLimiter, recipeRoute);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});