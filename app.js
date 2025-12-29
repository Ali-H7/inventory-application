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

app.get('/series/:id', async (req, res) => {
  const { id } = req.params;
  console.log(id);
  const series = await queries.getManga(id);

  // check if the query returns an empty array or not before transforming it into a string
  const genreString =
    series.genre[0] !== null && series.genre.length > 0 ? series.genre.map((genre) => genre.genre_name).join() : null;

  res.render('view-details', { series, genreString });
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

app.get('/add-genre', (req, res) => {
  res.render('add-genre');
});

app.post('/add-genre', async (req, res) => {
  const { genre } = req.body;
  await queries.addGenre(genre);
  res.redirect('/');
});

app.get('/delete-genre', async (req, res) => {
  const genres = await queries.getGenre();
  res.render('delete-genre', { genres });
});

app.post('/delete-genre/:id', async (req, res) => {
  const { id } = req.params;
  await queries.deleteGenre(id);
  res.redirect('/delete-genre');
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
