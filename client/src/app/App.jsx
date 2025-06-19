import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import Routes from "./routes/Routes";
//import "./styles.css";

const App = () => (
    <Router>
        <AuthProvider>
            <Routes />
        </AuthProvider>
    </Router>
);

export default React.memo(App);
