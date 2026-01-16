import React, { useState, useEffect, useRef } from "react";
import Loader from "../../../../shared/ui/Loader/Loader";
import styles from "./CollaborativeEditor.module.css";
//import { socket } from "../../../../shared/api/socket";
import ReactMarkdown from "react-markdown";

const CollaborativeEditor = ({ documentId, onSave, isReadOnly = false }) => {
    return <div className={styles.editorWrapper}>тут должен быть редактор</div>;
};

export default CollaborativeEditor;
