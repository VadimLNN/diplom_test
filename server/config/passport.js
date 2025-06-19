const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const { Strategy: LocalStrategy } = require("passport-local"); // Убедимся, что импорт верный
const pool = require("../db");
const bcrypt = require("bcrypt");
require("dotenv").config();

console.log("Configuring Passport strategies..."); // Отладка

// JWT Strategy
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET, // Замени на безопасный ключ
};

passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
        try {
            console.log("Verifying JWT payload:", payload.id); // Отладка
            const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [payload.id]);
            if (rows.length > 0) {
                return done(null, rows[0]);
            } else {
                return done(null, false);
            }
        } catch (error) {
            console.error("JWT Strategy error:", error);
            return done(error, false);
        }
    })
);

// Local Strategy
passport.use(
    new LocalStrategy(
        {
            usernameField: "username", // Поле для логина
            passwordField: "password", // Поле для пароля
        },
        async (username, password, done) => {
            try {
                console.log("Attempting local auth for:", username); // Отладка
                const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
                if (rows.length === 0) {
                    console.log("User not found");
                    return done(null, false, { message: "Incorrect username or password" });
                }
                const user = rows[0];
                const match = await bcrypt.compare(password, user.password);
                if (!match) {
                    console.log("Password mismatch");
                    return done(null, false, { message: "Incorrect username or password" });
                }
                console.log("Local auth successful for:", user.username);
                return done(null, user);
            } catch (error) {
                console.error("Local Strategy error:", error);
                return done(error, false);
            }
        }
    )
);

module.exports = passport;
