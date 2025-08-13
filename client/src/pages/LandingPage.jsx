import { Link } from "react-router-dom";

const LandingPage = () => {
    return (
        <div className="page-container page-centered">
            <h1>Совместная работа над текстами. Просто.</h1>
            <p>Наше приложение позволяет командам создавать и редактировать документы в реальном времени.</p>
            {/* Здесь может быть скриншот */}
            <Link to="/register" className="btn btn-primary">
                Начать бесплатно
            </Link>
        </div>
    );
};

export default LandingPage;
