import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import Routes from "./routes/index";
import "./styles/index.css";
import Header from "../widgets/Header/ui/Header";

const App = () => (
    <>
        {/* <AuroraBackground /> */}
        <div className="app-layout">
            <Router>
                <AuthProvider>
                    <Header />
                    <main className="main-content">
                        <Routes />
                    </main>
                </AuthProvider>
            </Router>
        </div>
    </>
);

export default React.memo(App);
