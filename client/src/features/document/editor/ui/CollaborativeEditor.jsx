import React, { useState, useEffect, useRef } from "react";
import Loader from "../../../../shared/ui/Loader/Loader";
import styles from "./CollaborativeEditor.module.css";
import { socket } from "../../../../shared/api/socket";
import ReactMarkdown from "react-markdown";

const CollaborativeEditor = ({ documentId, onSave, isReadOnly = false }) => {
    const [content, setContent] = useState("");
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [mode, setMode] = useState("write");

    // Эффект для загрузки начального контента
    useEffect(() => {
        const fetchContent = async () => {
            // (Предполагается, что `api` импортирован)
            try {
                const response = await fetch(`http://localhost:5000/api/documents/${documentId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                const data = await response.json();
                setContent(data.content || "");
            } catch (error) {
                setContent("Failed to load content.");
            }
        };
        fetchContent();
    }, [documentId]);

    // Эффект для real-time
    useEffect(() => {
        if (!socket.connected) socket.connect();
        socket.emit("join_document", documentId);

        const handleReceiveChange = (newContent) => {
            setContent(newContent);
        };
        socket.on("receive_document_change", handleReceiveChange);

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        return () => {
            socket.off("receive_document_change", handleReceiveChange);
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.disconnect();
        };
    }, [documentId]);

    // Обработчик изменений
    const handleChange = (e) => {
        const newContent = e.target.value;
        setContent(newContent);
        // Отправляем изменения на сервер
        socket.emit("document_change", documentId, newContent);
        // Вызываем автосохранение
        if (onSave) {
            onSave(documentId, newContent);
        }
    };

    return (
        <div className={styles.editorWrapper}>
            {/* --- 3. ВОЗВРАЩАЕМ ПАНЕЛЬ ИНСТРУМЕНТОВ --- */}
            <div className={styles.toolbar}>
                <div className={styles.modeSwitcher}>
                    <button
                        onClick={() => setMode("write")}
                        className={`${styles.modeButton} ${mode === "write" ? styles.active : ""}`}
                        disabled={isReadOnly}
                    >
                        Write
                    </button>
                    <button onClick={() => setMode("preview")} className={`${styles.modeButton} ${mode === "preview" ? styles.active : ""}`}>
                        Preview
                    </button>
                </div>
                <div className={styles.status}>
                    Status:
                    <span className={isConnected ? styles.statusConnected : styles.statusDisconnected}>
                        {isConnected ? " Connected" : " Disconnected"}
                    </span>
                </div>
            </div>

            {/* --- 4. ВОЗВРАЩАЕМ УСЛОВНЫЙ РЕНДЕРИНГ --- */}
            <div className={styles.contentArea}>
                {mode === "write" ? (
                    <textarea
                        className={styles.textarea}
                        value={content}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Start writing... (Markdown is supported!)"
                    />
                ) : (
                    // Компонент ReactMarkdown будет рендерить HTML из вашего текста
                    <div className={styles.preview}>
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollaborativeEditor;
