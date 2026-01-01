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
app.use('/vendor', express.static(path.join(__dirname, 'node_modules')));

// routes
app.get('/', async (req, res) => {
  const data = await queries.getAll();
  // console.log(data);
  res.render('index', { data });
});

app.get('/series/:id', async (req, res) => {
  const { id } = req.params;
  const series = await queries.getManga(id);

  // check if the query returns an empty array or not before transforming it into a string
  const genreString =
    series.genre[0] !== null && series.genre.length > 0 ? series.genre.map((genre) => genre.genre_name).join() : null;

  res.render('view-details', { series, genreString });
});

app.get('/add-manga', async (req, res) => {
  const genre = await queries.getGenre();
  const series = {
    title: '',
    chapterCount: '',
    status: '',
    publisher: '',
    author: '',
    image: null,
    date: '',
    genres: '',
  };
  res.render('add-manga', { series, genre, errors: {}, edit: false });
});

const { body, validationResult, matchedData } = require('express-validator');
const validateUserInput = [
  body('title').trim().notEmpty().withMessage('Manga Title is Required'),
  body('chapterCount')
    .trim()
    .notEmpty()
    .withMessage('Chapter Count is required')
    .isNumeric()
    .withMessage('Only numbers are allowed for the Chapter Count'),
  body('status').notEmpty().withMessage('Please choose the status of the Manga'),
  body('publisher').trim().notEmpty().withMessage('Publisher is Required'),
  body('author').trim().notEmpty().withMessage('Author is Required'),
  body('image')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/\.(jpg|jpeg|png|gif|webp)$/i)
    .withMessage(`Image Link field an image with the extension 'jpg, jpeg, png, gif, webp.'`),
  body('date').isDate().withMessage('Please select a date'),
  body('genres').optional().trim().toArray(),
  body('genres.*').optional().isNumeric().withMessage('Invalid Genre format'),
];

app.post('/add-manga', [
  validateUserInput,
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const { body: series } = req;
      const genre = await queries.getGenre();
      res.render('add-manga', { series, genre, errors: errors.array({ onlyFirstError: true }), edit: false });
      console.log(errors.array());
      console.log(matchedData(req));
    } else {
      await queries.addManga(matchedData(req));
      console.log('success');
      res.redirect('/');
    }
  },
]);

app.post('/add-genre', async (req, res) => {
  const { genre } = req.body;
  await queries.addGenre(genre);
  res.redirect('/manage-genre');
});

app.get('/manage-genre', async (req, res) => {
  const genres = await queries.getGenre();
  res.render('manage-genre', { genres });
});

app.post('/manage-genre/delete-genre/:id', async (req, res) => {
  const { id } = req.params;
  await queries.deleteGenre(id);
  res.redirect('/manage-genre');
});

app.post('/series/:id/delete', async (req, res) => {
  const { id } = req.params;
  await queries.deleteManga(id);
  res.redirect('/');
});

function formateDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1 <= 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
  const day = date.getDate() <= 9 ? '0' + date.getDate() : date.getDate();
  return `${year}-${month}-${day}`;
}

app.get('/series/:id/edit', async (req, res) => {
  const { id } = req.params;
  const series = await queries.getManga(id);
  const transformedSeries = {
    ...series,
    chapterCount: series.chapter_count,
    image: series.image_link,
    date: formateDate(series.release_date),
    // database return [null] when no genre found for a series in it
    genres: series.genre[0] === null ? null : series.genre.map((genre) => genre.id.toString()),
  };
  console.log(series);
  console.log(transformedSeries);
  const genre = await queries.getGenre();
  res.render('add-manga', { series: transformedSeries, genre, errors: {}, edit: true });
});

// Server
const PORT = 3000;
app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  console.log(`Express app - listening on port ${PORT}!`);
});
