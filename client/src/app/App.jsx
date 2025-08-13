import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import Routes from "./routes/index";
import "./styles/index.css";
import Header from "../widgets/Header/ui/Header";
import AuroraBG from "../shared/ui/AuroraBG/AuroraBG";
import { Toaster } from "react-hot-toast";

const App = () => (
    <Router>
        <AuthProvider>
            <AuroraBG colorStops={["#7cff67", "#b19eef", "#5227ff"]} blend={0.5} amplitude={1.0} speed={0.5} />
            <div className="app-layout">
                <Header />
                <main className="main-content">
                    <Routes />
                </main>
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: "#333",
                            color: "#fff",
                        },
                    }}
                />
            </div>
        </AuthProvider>
    </Router>
);

export default React.memo(App);
