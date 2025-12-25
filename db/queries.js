require('dotenv').config();
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
JOIN series_genre sg 
ON s.id = sg.series_id 
JOIN genre g 
ON sg.genre_id = g.id
GROUP BY s.id, s.title, s.chapter_count, s.status, s.publisher, s.author, s.image_link, s.release_date;`);
}

getAll();

module.exports = {
  getAll,
};
