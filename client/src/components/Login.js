import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            console.log("Token found, redirecting to /user");
            navigate("/user");
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submitting login with:", { username, password });
        try {
            const response = await axios.post("http://localhost:5000/login", {
                username,
                password,
            });
            console.log("Login response:", response.data);
            localStorage.setItem("token", response.data.token);
            setMessage("Login successful");
            window.dispatchEvent(new Event("authChange"));
            navigate("/user");
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
