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

module.exports = {
  getAll,
  getManga,
  getGenre,
  addManga,
  deleteManga,
  addGenre,
  deleteGenre,
};
