import passport from 'passport';
import DbStrategy from './db/dbStrategy.mjs';

function setupPassport(pool) {
  passport.use(DbStrategy(pool));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM app_user WHERE id = $1',
        [id],
      );
      const user = rows[0];
      done(null, {
        id: user.id,
        username: user.username,
      });
    } catch (error) {
      done(error);
    }
  });

  return passport;
}

export default setupPassport;
