require('dotenv').config();
const express = require('express');
const path = require('node:path');
const controllers = require('./controllers');

const app = express();

// App settings
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
const assetsPath = path.join(__dirname, 'public');
app.use(express.static(assetsPath));
app.use('/vendor', express.static(path.join(__dirname, 'node_modules')));

// routes
app.get('/', controllers.homepageGet);
app.get('/series/:id', controllers.mangaPageGet);
app.get('/filter', controllers.mangaFilterGet);

app.get('/add-manga', controllers.mangaFormGet);
app.post('/add-manga', [controllers.validateUserInput, controllers.mangaFormPost]);
app.get('/series/:id/edit', controllers.mangaEditGet);
app.post('/series/:id/edit', [controllers.validateUserInput, controllers.mangaEditPost]);
app.post('/series/:id/delete', controllers.mangaDeletePost);

app.get('/manage-genre', controllers.genreFormGet);
app.post('/add-genre', controllers.genreFormPost);
app.post('/manage-genre/delete-genre/:id', controllers.genreDeletePost);

app.use((req, res) => {
  res.render('404');
});

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.render('error-page', { error: err.message });
});

// Server
const PORT = 3000;
app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  console.log(`Express app - listening on port ${PORT}!`);
});
