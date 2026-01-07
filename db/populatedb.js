#! /usr/bin/env node

require('dotenv').config();
const { Client } = require('pg');

const seriesTable = `CREATE TABLE IF NOT EXISTS series (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title VARCHAR(150),
  chapter_count INTEGER,
  status VARCHAR(20),
  publisher VARCHAR(100),
  author VARCHAR(100),
  image_link VARCHAR(255),
  release_date TIMESTAMPTZ 
);`;

const seriesInsertQuery =
  'INSERT INTO series (title, chapter_count, status, publisher, author, image_link, release_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;';

const seriesData = [
  {
    series: [
      'Dragon Ball',
      519,
      'Completed',
      'Shueisha',
      'Akira Toriyama',
      'https://cdn.myanimelist.net/images/manga/1/267793.jpg',
      new Date('1984-11-20'),
    ],
    genre: [1, 2],
  },
  {
    series: [
      'One Piece',
      1126,
      'Ongoing',
      'Shueisha',
      'Eiichiro Oda',
      'https://cdn.myanimelist.net/images/manga/2/253146.jpg',
      new Date('1997-07-22'),
    ],
    genre: [1, 2],
  },
  {
    series: [
      'Vinland Saga',
      220,
      'Completed',
      'Kodansha',
      'Makoto Yukimura',
      'https://cdn.myanimelist.net/images/manga/2/188925.jpg',
      new Date('1984-11-20'),
    ],
    genre: [2, 5],
  },
];

const genreTable = `CREATE TABLE IF NOT EXISTS genre (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  genre_name VARCHAR(50)
);`;

const genreInsertQuery = 'INSERT INTO genre (genre_name) VALUES ($1);';
const genres = ['Action', 'Fantasy', 'Romance', 'Slice of Life', 'Historical', 'Comedy', 'Sports'];

const seriesGenreTable = `CREATE TABLE IF NOT EXISTS series_genre (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  series_id INTEGER, 
  genre_id INTEGER,
  FOREIGN KEY (series_id) REFERENCES series(id),
  FOREIGN KEY (genre_id) REFERENCES genre(id)
);`;

const seriesGenreInsertQuery = 'INSERT INTO series_genre (series_id, genre_id) VALUES ($1, $2);';

const tables = [seriesTable, genreTable, seriesGenreTable];

async function main() {
  console.log('seeding...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  for (const table of tables) {
    await client.query(table);
  }

  for (const genre of genres) {
    await client.query(genreInsertQuery, [genre]);
  }

  for (const data of seriesData) {
    const { rows } = await client.query(seriesInsertQuery, data.series);
    for (const genre of data.genre) {
      await client.query(seriesGenreInsertQuery, [rows[0].id, genre]);
    }
  }
  await client.end();
  console.log('done');
}

main();
