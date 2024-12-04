import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
const { Pool } = pg;
import 'dotenv/config';

const PORT = process.env.PORT;

const app = express();
app.use(express.urlencoded({ extended: false }));

const pgStore = new connectPgSimple(session);

app.use(
  session({
    store: new pgStore({
      pool: new Pool({
        connectionString: process.env.DB,
      }),
    }),
    secret: process.env.SECRET,
    resave: false,
    // This is false so the user session is only created if they login.
    saveUninitialized: false,
  }),
);

app.get('/', (req, res, next) => {
  console.log('session:', req.session);
  res.send('<h1>Hello world</h1>');
});

app.use((req, res, next) => {
  res.send('<h1>404 - Page not found</h1>');
});

app.use((error, req, res, next) => {
  res.send(`<h1>500 - Internal server error</h1><p>${error.message}</p>`);
});

app.listen(PORT, () => console.log('Server listening on port', PORT));
