const queries = require('./db/queries');
const formatDate = require('./public/helpers/format-date');
const { body, validationResult, matchedData, custom } = require('express-validator');

// validations

function authentication(req, res, next) {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) next();
  else throw new Error('Password Incorrect!');
}

const validateUserInput = [
  body('title').trim().notEmpty().withMessage('Manga Title is required'),
  body('chapterCount')
    .trim()
    .notEmpty()
    .withMessage('Chapter Count is required')
    .isNumeric()
    .withMessage('Only numbers are allowed for the Chapter Count'),
  body('status').notEmpty().withMessage('Please choose the status of the Manga'),
  body('publisher').trim().notEmpty().withMessage('Publisher is required'),
  body('author').trim().notEmpty().withMessage('Author is required'),
  body('image')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/\.(jpg|jpeg|png|gif|webp)$/i)
    .withMessage(`The Image Link field must contain an image with the extension .jpg, .jpeg, .png, .gif, or .webp`),
  body('date').isDate().withMessage('Please select a date'),
  body('genres').optional().trim().toArray(),
  body('genres.*').optional().isNumeric().withMessage('Invalid Genre format'),
];

const validateUserGenreInput = [
  body('genre')
    .trim()
    .custom(async (value) => {
      const genre = await queries.getOneGenre(value);
      if (genre) {
        throw new Error('This genre name is already taken. Please try another one');
      }
    }),
];

// controllers

async function homepageGet(req, res) {
  const data = await queries.getAll();
  const genre = await queries.getGenre();
  res.render('index', { data, genre, selectedGenres: [] });
}

async function mangaPageGet(req, res) {
  const { id } = req.params;
  const series = await queries.getManga(id);

  // check if the query returns an empty array or not before transforming it into a string
  const genreString = series.genre[0] !== null ? series.genre.map((genre) => genre.genre_name).join(', ') : null;

  res.render('view-details', { series, genreString });
}

async function mangaFilterGet(req, res) {
  const { genres } = req.query;
  if (!genres) {
    return res.redirect('/');
  }

  const data = await queries.getFiltered(genres);
  const genre = await queries.getGenre();

  res.render('index', { data, genre, selectedGenres: Array.isArray(genres) ? genres : [genres] });
}

async function mangaFormGet(req, res) {
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
  res.render('add-manga', { series, genre, errors: [], edit: false });
}

async function mangaFormPost(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const { body: series } = req;
    const genre = await queries.getGenre();
    res.render('add-manga', { series, genre, errors: errors.array({ onlyFirstError: true }), edit: false });
  } else {
    await queries.addManga(matchedData(req));
    res.redirect('/');
  }
}

async function mangaEditGet(req, res) {
  const { id } = req.params;
  const series = await queries.getManga(id);
  const transformedSeries = {
    ...series,
    chapterCount: series.chapter_count,
    image: series.image_link,
    date: formatDate(series.release_date),
    // database return [null] when no genre found for a series in it
    genres: series.genre[0] === null ? null : series.genre.map((genre) => genre.id.toString()),
  };
  const genre = await queries.getGenre();
  res.render('add-manga', { series: transformedSeries, genre, errors: [], edit: true });
}

async function mangaEditPost(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const { body: series } = req;
    const genre = await queries.getGenre();
    res.render('add-manga', { series, genre, errors: errors.array({ onlyFirstError: true }), edit: true });
  } else {
    const { id } = req.params;
    await queries.updateSeries(id, matchedData(req));
    res.redirect('/');
  }
}

async function mangaDeletePost(req, res) {
  const { id } = req.params;
  await queries.deleteManga(id);
  res.redirect('/');
}

async function genreFormGet(req, res) {
  const genres = await queries.getGenre();
  res.render('manage-genre', { genres, errors: [] });
}

async function genreFormPost(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const genres = await queries.getGenre();
    res.render('manage-genre', { genres, errors: errors.array() });
  } else {
    const { genre } = req.body;
    await queries.addGenre(genre);
    res.redirect('/manage-genre');
  }
}

async function genreDeletePost(req, res) {
  const { id } = req.params;
  await queries.deleteGenre(id);
  res.redirect('/manage-genre');
}

module.exports = {
  authentication,
  validateUserInput,
  validateUserGenreInput,
  homepageGet,
  mangaPageGet,
  mangaFilterGet,
  mangaFormGet,
  mangaFormPost,
  mangaEditGet,
  mangaEditPost,
  mangaDeletePost,
  genreFormGet,
  genreFormPost,
  genreDeletePost,
};
