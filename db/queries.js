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

async function getGenre() {
  const { rows } = await pool.query(`SELECT * from genre`);
  return rows;
}

const seriesInsertQuery =
  'INSERT INTO series (title, chapter_count, status, publisher, author, image_link, release_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;';
const seriesGenreInsertQuery = 'INSERT INTO series_genre (series_id, genre_id) VALUES ($1, $2);';

async function addManga(bodyObject) {
  const { title, chapterCount, status, publisher, author, image, date, genres } = bodyObject;
  const { rows } = await pool.query(seriesInsertQuery, [
    title,
    chapterCount,
    status,
    publisher,
    author,
    image,
    new Date(date),
  ]);
  for (const genre of genres) {
    await pool.query(seriesGenreInsertQuery, [rows[0].id, genre]);
  }
}

const seriesDeleteQuery = 'DELETE FROM series WHERE id = $1;';
const seriesGenreDeleteQuery = 'DELETE FROM series_genre WHERE series_id = $1;';

async function deleteManga(id) {
  await pool.query(seriesGenreDeleteQuery, [id]);
  await pool.query(seriesDeleteQuery, [id]);
}

module.exports = {
  getAll,
  getGenre,
  addManga,
  deleteManga,
};
