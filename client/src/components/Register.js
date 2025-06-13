import { useState } from "react";
import axios from "axios";

function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:5000/register", {
                username,
                password,
                email,
            });
            setMessage("Registration successful");
            console.log(response.data);
        } catch (error) {
            setMessage(error.response.data.error || "Registration failed");
        }
    };

    return (
        <div className="card">
            <h2>Register</h2>
            <form onSubmit={handleSubmit} className="form">
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <button type="submit" className="btn btn-primary">
                    Register
                </button>
            </form>
            {message && <p className={`message ${message.includes("successful") ? "success" : "error"}`}>{message}</p>}
        </div>
    );
}

export default Register;
