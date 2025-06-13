import { Link } from "react-router-dom";

function Home() {
    return (
        <div className="card">
            <h2>Welcome to CollabApp</h2>
            <p>
                CollabApp is a web platform designed for designers, game designers, and developers to collaborate seamlessly on design, game design,
                and technical documentation.Ы
            </p>
            <h3>Why Choose CollabApp?</h3>
            <ul className="list">
                <li>Unified platform for cross-disciplinary work: design UI, write code, and plan game narratives in one place.</li>
                <li>Real-time collaboration with live editing and comments.</li>
                <li>Simple project and task management to streamline workflows.</li>
            </ul>
            <h3>Get Started</h3>
            <p>
                Join our platform to start collaborating today!{" "}
                <Link to="/register" className="link">
                    Register
                </Link>{" "}
                or{" "}
                <Link to="/login" className="link">
                    Log in
                </Link>{" "}
                to explore the features.
            </p>
        </div>
    );
}

export default Home;
