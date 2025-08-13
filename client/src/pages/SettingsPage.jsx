// src/pages/SettingsPage.jsx
import React from "react";
import ChangePasswordForm from "../features/user/settings/ui/ChangePasswordForm";
import DeleteAccountSection from "../features/user/settings/ui/DeleteAccountSection";

import pageStyles from "./PageStyles.module.css";
import styles from "./SettingsPage.module.css";

const SettingsPage = () => {
    return (
        <div className={pageStyles.pageContainer}>
            <h1>Account Settings</h1>
            <div className={styles.settingsLayout}>
                <ChangePasswordForm />
                <DeleteAccountSection />
            </div>
        </div>
    );
};

export default SettingsPage;
