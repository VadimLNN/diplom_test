import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function User() {
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setMessage("No token found. Please log in.");
                    navigate("/login");
                    return;
                }
                const response = await axios.get("http://localhost:5000/user", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("User response:", response.data); // Лог ответа сервера
                setUsername(response.data.username);
            } catch (error) {
                console.error("User fetch error:", error.response?.data || error.message); // Лог ошибки
                setMessage("Access denied");
                navigate("/login");
            }
        };
        fetchUser();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("authChange"));
        navigate("/login");
    };

    return (
        <div className="card">
            <h2>User Profile</h2>
            {message && <p className="message error">{message}</p>}
            {username && (
                <>
                    <p>Welcome, {username}!</p>
                    <button onClick={handleLogout} className="btn btn-danger">
                        Logout
                    </button>
                </>
            )}
        </div>
    );
}

export default User;
