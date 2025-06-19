// src/features/document-editor/CollaborativeEditor.jsx

import React, { useState, useEffect, useRef } from "react";
import { socket } from "../../../shared/api/socket";

const CollaborativeEditor = ({ documentId, onSave }) => {
    const [content, setContent] = useState("");
    const [isConnected, setIsConnected] = useState(socket.connected);
    const saveTimeoutRef = useRef(null); // Ref для таймера автосохранения

    // Загрузка начального контента документа
    useEffect(() => {
        // Здесь нужен API запрос для получения контента документа по ID
        // api.get(`/documents/${documentId}`).then(res => setContent(res.data.content));
        // Для простоты пока оставим пустым
        setContent("Loading content...");
    }, [documentId]);

    useEffect(() => {
        // --- Управление соединением ---
        if (!socket.connected) {
            socket.connect();
        }
        socket.on("connect", () => setIsConnected(true));
        socket.on("disconnect", () => setIsConnected(false));

        // --- Логика комнат и обновлений ---
        socket.emit("join_document", documentId);

        const handleReceiveChange = (receivedContent) => {
            setContent(receivedContent);
        };
        socket.on("receive_document_change", handleReceiveChange);

        return () => {
            // Очистка при выходе со страницы
            socket.off("connect");
            socket.off("disconnect");
            socket.off("receive_document_change", handleReceiveChange);
            // Можно добавить socket.emit('leave_document', documentId) на бэкенде
            socket.disconnect();
        };
    }, [documentId]);

    const handleChange = (e) => {
        const newContent = e.target.value;
        setContent(newContent);
        socket.emit("document_change", { documentId, newContent });

        // Логика автосохранения в БД (debounce)
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            onSave(newContent);
        }, 2000); // Сохранять через 2 секунды после последней печати
    };

    return (
        <div>
            <div style={{ marginBottom: "10px" }}>
                Status: {isConnected ? <span style={{ color: "green" }}>Connected</span> : <span style={{ color: "red" }}>Disconnected</span>}
            </div>
            <textarea
                value={content}
                onChange={handleChange}
                className="collaborative-textarea" // Стилизуйте по вкусу
                rows="20"
            />
        </div>
    );
};

export default CollaborativeEditor;
