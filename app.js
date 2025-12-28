require('dotenv').config();
const express = require('express');
const path = require('node:path');
const queries = require('./db/queries');
const app = express();

// App settings
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
const assetsPath = path.join(__dirname, 'public');
app.use(express.static(assetsPath));

// routes
app.get('/', async (req, res) => {
  const data = await queries.getAll();
  console.log(data);
  res.render('index', { data });
});

app.get('/add-manga', async (req, res) => {
  const genre = await queries.getGenre();
  res.render('add-manga', { genre });
});

app.post('/add-manga', async (req, res) => {
  const { body } = req;
  await queries.addManga(body);
  res.redirect('/');
});

app.post('/series/:id/delete', async (req, res) => {
  const { id } = req.params;
  await queries.deleteManga(id);
  res.redirect('/');
});

// Server
const PORT = 3000;
app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  console.log(`Express app - listening on port ${PORT}!`);
});
