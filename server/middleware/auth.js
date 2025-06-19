const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};

passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
        try {
            const pool = require("../config/database");
            const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [jwt_payload.id]);
            if (rows.length > 0) return done(null, rows[0]);
            return done(null, false);
        } catch (error) {
            return done(error, false);
        }
    })
);

module.exports = passport;
