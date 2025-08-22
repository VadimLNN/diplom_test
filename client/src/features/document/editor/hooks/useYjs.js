// /src/features/document/editor/hooks/useYjs.js
import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export const useYjs = (documentId) => {
    const [doc, setDoc] = useState(null);
    const [provider, setProvider] = useState(null);

    useEffect(() => {
        // Создаем новый Y.Doc
        const ydoc = new Y.Doc();
        // Подключаемся к WebSocket серверу для этой "комнаты" (документа)
        const yprovider = new WebsocketProvider(
            "ws://localhost:5000", // URL вашего WebSocket-сервера
            `document-${documentId}`, // Уникальное имя комнаты
            ydoc
        );

        setDoc(ydoc);
        setProvider(yprovider);

        // Очистка при выходе со страницы
        return () => {
            yprovider.disconnect();
            ydoc.destroy();
        };
    }, [documentId]);

    return { doc, provider };
};
