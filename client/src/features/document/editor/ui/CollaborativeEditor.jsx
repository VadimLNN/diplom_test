import React, { useState, useEffect, useRef } from "react";
import { socket } from "../../../../shared/api/socket";
import styles from "./CollaborativeEditor.module.css";
import ReactMarkdown from "react-markdown";

const CollaborativeEditor = ({ documentId, onSave, isReadOnly = false }) => {
    const [content, setContent] = useState("Loading content...");
    const [isConnected, setIsConnected] = useState(socket.connected);
    const saveTimeoutRef = useRef(null);

    useEffect(() => {
        console.log(`[EDITOR] useEffect with fetch triggered for documentId: ${documentId}`);
        let isMounted = true;

        // --- ИСПОЛЬЗУЕМ FETCH ВМЕСТО AXIOS ---
        const fetchDocumentWithFetch = async () => {
            try {
                // 1. Получаем токен вручную, как это делает ваш interceptor
                const token = localStorage.getItem("token");
                if (!token) {
                    throw new Error("No token found");
                }

                // 2. Формируем заголовки
                const headers = {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                };

                // 3. Делаем запрос
                const response = await fetch(`http://localhost:5000/api/documents/${documentId}`, {
                    method: "GET",
                    headers: headers,
                });

                // 4. Проверяем, что ответ успешный (статус 200-299)
                if (!response.ok) {
                    // Если нет, создаем ошибку с текстом статуса
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }

                // 5. Парсим JSON из ответа
                const data = await response.json();

                // 6. Если все хорошо, выводим в лог и обновляем состояние
                console.log("[EDITOR] SUCCESS with fetch: Received data:", data);
                if (isMounted) {
                    setContent(data.content || "");
                }
            } catch (error) {
                // 7. Ловим любые ошибки (сеть, парсинг, статус)
                console.error("[EDITOR] CATCH with fetch: Failed to fetch document.", error);
                if (isMounted) {
                    setContent("Error: Could not load document.");
                }
            }
        };

        fetchDocumentWithFetch();

        return () => {
            isMounted = false;
        };
    }, [documentId]);

    useEffect(() => {
        // Функция для установки слушателей
        const setupSocketListeners = () => {
            socket.on("connect", () => {
                console.log("✅ Socket connected!");
                setIsConnected(true);
                // После подключения сразу же вступаем в комнату
                socket.emit("join_document", documentId);
            });

            socket.on("disconnect", () => {
                console.log("❌ Socket disconnected!");
                setIsConnected(false);
            });

            socket.on("receive_document_change", (receivedContent) => {
                console.log("🔄 Received change from another user:", receivedContent);
                setContent(receivedContent);
            });
        };

        // Функция для удаления слушателей
        const cleanupSocketListeners = () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("receive_document_change");
        };

        // Если сокет еще не подключен, подключаем
        if (!socket.connected) {
            socket.connect();
        } else {
            // Если уже подключен (например, после hot-reload), просто вступаем в комнату
            socket.emit("join_document", documentId);
        }

        setupSocketListeners();

        // Функция очистки при размонтировании компонента
        return () => {
            console.log("Cleaning up socket listeners and disconnecting...");
            cleanupSocketListeners();
            socket.disconnect();
        };
    }, [documentId]);

    const handleChange = (e) => {
        const newContent = e.target.value;
        setContent(newContent);
        socket.emit("document_change", { documentId, newContent });

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            // ИСПРАВЛЕНИЕ: Передаем `documentId` из props, а не `newContent`
            onSave(documentId, newContent);
        }, 2000);
    };

    const [mode, setMode] = useState("write");

    return (
        <div className={styles.editorWrapper}>
            {/* Панель инструментов с переключателем и статусом */}
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

            {/* Рабочая область с условным рендерингом */}
            <div className={styles.contentArea}>
                {mode === "write" ? (
                    <textarea
                        className={styles.textarea}
                        value={content}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                        placeholder="Start writing your masterpiece... (Markdown is supported!)"
                    />
                ) : (
                    <div className={styles.preview}>
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollaborativeEditor;
