import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
import bcryptjs from 'bcryptjs';
import cookieParser from 'cookie-parser';
import flash from 'express-flash';
import 'dotenv/config';

import setupPassport from './passport.mjs';

const { Pool } = pg;

const PORT = process.env.PORT;
const SECRET = process.env.SECRET;

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

// Stuff for using messages once then discarding (i.e. flashing them).
app.use(cookieParser(SECRET));
app.use(flash());

// Set up session.
const pgStore = new connectPgSimple(session);
const pool = new Pool({ connectionString: process.env.DB });
app.use(
  session({
    store: new pgStore({
      pool,
    }),
    secret: SECRET,
    resave: false,
    // This is false so the user session is only created if they login.
    saveUninitialized: false,
  }),
);

const passport = setupPassport(pool);

app.use(passport.session());
app.use((req, res, next) => {
  console.log(' session:', req.session);
  console.log('    user:', req.user);
  next();
});

app.get('/', (req, res, next) => {
  res.render('index', {
    title: 'Index',
    user: req.user,
    errors: req.flash('error'),
  });
});

app.get('/sign-up', (req, res, next) => {
  res.render('sign-up', { title: 'Sign up' });
});

app.post('/sign-up', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const hash = await bcryptjs.hash(password, 10);
    const timestamp = new Date(Date.now());
    await pool.query(
      'INSERT INTO app_user (username, password, created) VALUES ($1, $2, $3) RETURNING *',
      [username, hash, timestamp],
    );
    res.status(201).redirect('/');
  } catch (error) {
    next(error);
  }
});

app.post(
  '/log-in',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/',
    failureFlash: true,
  }),
);

app.post('/log-out', async (req, res, next) => {
  req.logOut((error) => {
    if (error) return next(error);
    res.redirect('/');
  });
});

app.use((req, res, next) => {
  res.status(404).render('404', { title: 'Page not found' });
});

app.use((error, req, res, next) => {
  res.status(500).render('error', { title: 'An error has occurred', error });
});

app.listen(PORT, () => console.log('Server listening on port', PORT));
