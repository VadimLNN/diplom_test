import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Register from "./components/Register";
import Login from "./components/Login";
import User from "./components/User";
import Home from "./components/Home";
import Projects from "./components/Projects";
import Project from "./components/Project";
import Document from "./components/Document";
import PrivateRoute from "./components/PrivateRoute";

function App() {
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [username, setUsername] = useState("");

    useEffect(() => {
        const updateAuthState = () => {
            const newToken = localStorage.getItem("token");
            setToken(newToken);
            if (newToken) {
                try {
                    const decoded = jwtDecode(newToken);
                    setUsername(decoded.username || "");
                    localStorage.setItem("username", decoded.username || ""); // Для курсоров
                } catch (error) {
                    console.error("Error decoding token:", error);
                    setUsername("");
                    localStorage.removeItem("token");
                    setToken("");
                }
            } else {
                setUsername("");
                localStorage.removeItem("username");
            }
        };

        updateAuthState();

        window.addEventListener("authChange", updateAuthState);

        return () => {
            window.removeEventListener("authChange", updateAuthState);
        };
    }, []);

    return (
        <Router>
            <div>
                <nav>
                    <ul className="container">
                        <li>
                            <Link to="/">Home</Link>
                        </li>
                        {!token && (
                            <>
                                <li>
                                    <Link to="/register">Register</Link>
                                </li>
                                <li>
                                    <Link to="/login">Login</Link>
                                </li>
                            </>
                        )}
                        {token && (
                            <>
                                <li>
                                    <Link to="/projects">Projects</Link>
                                </li>
                                <li>
                                    <Link to="/user">User {username ? `(${username})` : ""}</Link>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>
                <div className="container">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/login" element={<Login />} />
                        <Route
                            path="/projects"
                            element={
                                <PrivateRoute>
                                    <Projects />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/projects/:id"
                            element={
                                <PrivateRoute>
                                    <Project />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/documents/:id"
                            element={
                                <PrivateRoute>
                                    <Document />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/user"
                            element={
                                <PrivateRoute>
                                    <User />
                                </PrivateRoute>
                            }
                        />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
