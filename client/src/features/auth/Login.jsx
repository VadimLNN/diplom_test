import { useState, useEffect } from "react";
import api from "../../utils/axios";
import { useNavigate } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            console.log("Token found in localStorage:", token);
            navigate("/projects");
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submitting login with:", { username, password });
        try {
            const response = await api.post("/auth/login", {
                username,
                password,
            });
            console.log("Login response (full):", response.data); // Детальный лог
            if (!response.data.token) {
                throw new Error("Token not received from server");
            }
            localStorage.setItem("token", response.data.token);
            console.log("Token saved to localStorage:", response.data.token);
            setMessage("Login successful");
            window.dispatchEvent(new Event("authChange"));
            navigate("/projects");
        } catch (error) {
            console.error("Login error:", error.response?.data || error.message);
            setMessage(error.response?.data?.error || "Login failed");
        }
    };

    return (
        <div className="card">
            <h2>Login</h2>
            <form onSubmit={handleSubmit} className="form">
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit" className="btn btn-primary">
                    Login
                </button>
            </form>
            {message && <p className={`message ${message.includes("successful") ? "success" : "error"}`}>{message}</p>}
        </div>
    );
}

export default Login;
