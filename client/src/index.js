import React from "react";
import { createRoot } from "react-dom/client"; // Изменили импорт
import App from "./app/App";
import "./styles.css"; // Подключим твой CSS

const root = createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
