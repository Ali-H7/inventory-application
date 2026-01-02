const pool = require('./pool');

// async function getAll() {
//     const series = [];
//     const { rows } = await pool.query('SELECT * FROM series');
//     for (const row of rows) {
//       const genre = await pool.query(
//         `SELECT genre_id, genre_name FROM series_genre JOIN genre ON genre_id = genre.id WHERE series_id = ${row.id}`,
//       );
//       row.genre = genre.rows;
//       series.push(row);
//     }
//     return series;
// }

async function getAll() {
  const { rows } =
    await pool.query(`SELECT s.id, s.title, s.chapter_count, s.status, s.publisher, s.author, s.image_link, s.release_date, json_agg(g.*) AS genre
FROM series s 
LEFT JOIN series_genre sg 
ON s.id = sg.series_id 
LEFT JOIN genre g 
ON sg.genre_id = g.id
GROUP BY s.id, s.title, s.chapter_count, s.status, s.publisher, s.author, s.image_link, s.release_date;`);
  return rows;
}

const getMangaQuery = `SELECT s.id, s.title, s.chapter_count, s.status, s.publisher, s.author, s.image_link, s.release_date, json_agg(g.*) AS genre
FROM series s 
LEFT JOIN series_genre sg 
ON s.id = sg.series_id 
LEFT JOIN genre g 
ON sg.genre_id = g.id
WHERE s.id = $1
GROUP BY s.id, s.title, s.chapter_count, s.status, s.publisher, s.author, s.image_link, s.release_date;`;

async function getManga(id) {
  const { rows } = await pool.query(getMangaQuery, [id]);
  return rows[0];
}

async function getGenre() {
  const { rows } = await pool.query(`SELECT * from genre`);
  return rows;
}

const seriesInsertQuery =
  'INSERT INTO series (title, chapter_count, status, publisher, author, image_link, release_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;';
const seriesGenreInsertQuery = 'INSERT INTO series_genre (series_id, genre_id) VALUES ($1, $2);';

async function addManga(dataObject) {
  const { title, chapterCount, status, publisher, author, image, date, genres } = dataObject;
  const { rows } = await pool.query(seriesInsertQuery, [
    title,
    chapterCount,
    status,
    publisher,
    author,
    image || '',
    new Date(date),
  ]);

  if (genres && genres.length >= 1) {
    for (const genre of genres) {
      await pool.query(seriesGenreInsertQuery, [rows[0].id, genre]);
    }
  }
}

const seriesGenreDeleteQuery = 'DELETE FROM series_genre WHERE series_id = $1;';
const seriesDeleteQuery = 'DELETE FROM series WHERE id = $1;';

async function deleteManga(id) {
  await pool.query(seriesGenreDeleteQuery, [id]);
  await pool.query(seriesDeleteQuery, [id]);
}

const genreInsertQuery = 'INSERT INTO genre (genre_name) VALUES ($1);';
async function addGenre(genreName) {
  await pool.query(genreInsertQuery, [genreName]);
}

const genreSeriesDeleteQuery = 'DELETE FROM series_genre WHERE genre_id = $1;';
const genreDeleteQuery = 'DELETE FROM genre WHERE id = $1;';

async function deleteGenre(id) {
  await pool.query(genreSeriesDeleteQuery, [id]);
  await pool.query(genreDeleteQuery, [id]);
}
const seriesUpdateQuery = `UPDATE series
SET title = $2,
    chapter_count = $3,
    status = $4, 
    publisher = $5, 
    author = $6,
    image_link = $7, 
    release_date = $8
WHERE id = $1`;

const getSeriesGenreQuery = `SELECT genre_id
FROM series_genre
WHERE series_id = $1`;

function generateDeleteQuery(genreArray) {
  let where = 'WHERE series_id = $1 AND genre_id = $2';
  for (let i = 3; i < genreArray.length + 2; i++) {
    where += ` OR series_id = $1 AND genre_id  = ${'$' + i}`;
  }
  return `DELETE FROM series_genre ${where}`;
}

function generateInsertQuery(genreArray) {
  let values = 'VALUES ($1, $2)';
  for (let i = 3; i < genreArray.length + 2; i++) {
    values += `, ($1, ${'$' + i})`;
  }
  return `INSERT INTO series_genre (series_id, genre_id) ${values}`;
}

async function updateSeries(id, dataObject) {
  const { title, chapterCount, status, publisher, author, image, date, genres } = dataObject;
  await pool.query(seriesUpdateQuery, [
    id,
    title,
    chapterCount,
    status,
    publisher,
    author,
    image || '',
    new Date(date),
  ]);
  if (!genres) {
    await pool.query(seriesGenreDeleteQuery, [id]);
  } else {
    const { rows } = await pool.query(getSeriesGenreQuery, [id]);
    const currentSeriesGenre = rows.map((g) => g.genre_id.toString());
    const genreToRemove = currentSeriesGenre.filter((genre) => !genres.includes(genre));
    const genreAfterRemoving = currentSeriesGenre.filter((genre) => genres.includes(genre));
    const genreToAdd = genres.filter((genre) => !genreAfterRemoving.includes(genre));

    if (genreToRemove.length > 0) {
      const deleteQuery = generateDeleteQuery(genreToRemove);
      await pool.query(deleteQuery, [id, genreToRemove].flat());
    }

    if (genreToAdd.length > 0) {
      const insertQuery = generateInsertQuery(genreToAdd);
      await pool.query(insertQuery, [id, genreToAdd].flat());
    }
  }
}

function generateFilterQuery(genre) {
  let list;

  if (Array.isArray(genre)) {
    const query = [];
    for (let i = 1; i <= genre.length; i++) {
      query.push(`${'$' + i + ' '}`);
    }
    list = '(' + query.toString().trim() + ')';
  } else {
    list = '($1)';
  }

  return `SELECT series.id, title, author, image_link
FROM series
JOIN series_genre
ON series.id = series_genre.series_id
WHERE genre_id IN ${list}
GROUP BY series.id`;
}

async function getFiltered(genres) {
  const filterQuery = generateFilterQuery(genres);
  const { rows } = await pool.query(filterQuery, [genres].flat());
  return rows;
}

module.exports = {
  getAll,
  getManga,
  getGenre,
  addManga,
  deleteManga,
  addGenre,
  deleteGenre,
  updateSeries,
  getFiltered,
};
