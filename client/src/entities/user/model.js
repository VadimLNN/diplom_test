export const userInitialState = {
    id: null,
    username: "",
    password: "",
    email: "",
};

export const validateLogin = (credentials) => {
    if (!credentials.username || !credentials.password) throw new Error("Username and password are required");
    if (credentials.password.length < 6) throw new Error("Password must be at least 6 characters");
    return true;
};

export const validateUser = (user) => {
    if (!user.username || !user.password || !user.email) throw new Error("All fields are required");
    if (user.username.length > 50) throw new Error("Username must be 50 characters or less");
    if (user.email.length > 100) throw new Error("Email must be 100 characters or less");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) throw new Error("Invalid email format");
    if (user.password.length < 6) throw new Error("Password must be at least 6 characters");
    return true;
};
