import React from "react";
import { useYjs } from "../hooks/useYjs";
import TiptapEditor from "./TiptapEditor";
import styles from "./CollaborativeEditor.module.css";
import Loader from "../../../../shared/ui/Loader/Loader";

const CollaborativeEditor = ({ documentId }) => {
    const { doc, provider } = useYjs(documentId);

    if (!doc || !provider) {
        return (
            <div className={styles.loadingWrapper}>
                <Loader />
                <p>Connecting to collaboration service...</p>
            </div>
        );
    }
    console.log(doc, provider);
    return <TiptapEditor doc={doc} provider={provider} />;
};

export default CollaborativeEditor;
