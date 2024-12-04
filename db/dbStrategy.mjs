import passportLocal from 'passport-local';
import bcryptjs from 'bcryptjs';
const { Strategy } = passportLocal;

function DbStrategy(pool) {
  return new Strategy(async (username, password, done) => {
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

      const match = await bcryptjs.compare(password, user.password);
      if (!match) {
        return done(null, false, {
          message: 'The username and password do not match',
        });
      }

      await pool.query('UPDATE app_user SET last_login = $1 WHERE id = $2', [
        new Date(Date.now()),
        user.id,
      ]);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  });
}

export default DbStrategy;
