const pool = require('./pool');

async function getAll() {
  const series = [];
  const { rows } = await pool.query('SELECT * FROM series');
  for (const row of rows) {
    const genre = await pool.query(
      `SELECT genre_id, genre_name FROM series_genre JOIN genre ON genre_id = genre.id WHERE series_id = ${row.id}`,
    );
    row.genre = genre.rows;
    series.push(row);
  }
  return series;
}

module.exports = {
  getAll,
};
