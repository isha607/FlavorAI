require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const recipeRoute = require('./routes/recipe');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/recipe', recipeRoute);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});