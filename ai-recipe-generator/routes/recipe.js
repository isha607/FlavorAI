const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients) {
    return res.status(400).json({ error: 'Please provide ingredients' });
  }

  res.json({ message: `You sent: ${ingredients}` });
});

module.exports = router;