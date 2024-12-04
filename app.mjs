import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
const { Pool } = pg;
import 'dotenv/config';

const PORT = process.env.PORT;

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

const pgStore = new connectPgSimple(session);

const pool = new Pool({ connectionString: process.env.DB });

app.use(
  session({
    store: new pgStore({
      pool,
    }),
    secret: process.env.SECRET,
    resave: false,
    // This is false so the user session is only created if they login.
    saveUninitialized: false,
  }),
);

app.get('/', (req, res, next) => {
  res.render('index', { title: 'Index' });
});

app.get('/sign-up', (req, res, next) => {
  res.render('sign-up', { title: 'Sign up' });
});

app.post('/sign-up', async (req, res, next) => {
  try {
    // TO DO
    // Will hash password etc. later once general user sign up and login is working.
    const { username, password } = req.body;
    const timestamp = new Date(Date.now());
    await pool.query(
      'INSERT INTO app_user (username, password, created) VALUES ($1, $2, $3) RETURNING *',
      [username, password, timestamp],
    );
    res.status(201).redirect('/');
  } catch (error) {
    next(error);
  }
});

app.use((req, res, next) => {
  res.status(404).render('404', { title: 'Page not found' });
});

app.use((error, req, res, next) => {
  res.status(500).render('error', { title: 'An error has occurred', error });
});

app.listen(PORT, () => console.log('Server listening on port', PORT));
