import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
import passport from 'passport';
import passportLocal from 'passport-local';
import 'dotenv/config';

const { Pool } = pg;
const LocalStrategy = passportLocal.Strategy;

const PORT = process.env.PORT;

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

// Set up session.
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

// Set up passport and strategy.
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM app_user WHERE username = $1',
        [username],
      );
      const user = rows[0];

      if (!user) {
        return done(null, false, {
          message: 'That username does not exist',
        });
      }

      if (password !== user.password) {
        return done(null, false, {
          message: 'The username and password do not match',
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query('SELECT * FROM app_user WHERE id = $1', [
      id,
    ]);
    const user = rows[0];
    done(null, {
      id: user.id,
      username: user.username,
    });
  } catch (error) {
    done(error);
  }
});

app.use(passport.session());
app.use((req, res, next) => {
  console.log(' session:', req.session);
  console.log('    user:', req.user);
  console.log('messages:', req.session.messages);
  next();
});

app.get('/', (req, res, next) => {
  res.render('index', { title: 'Index', user: req.user });
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

app.post(
  '/log-in',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/',
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
