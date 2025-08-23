// /src/features/document/editor/hooks/useYjs.js

import { useEffect, useState, useRef } from "react";

// Убираем ВСЕ импорты, связанные с Yjs, отсюда

export const useYjs = (documentId) => {
    const [doc, setDoc] = useState(null);
    const [provider, setProvider] = useState(null);
    const isInitialized = useRef(false); // Флаг, чтобы избежать повторной инициализации

    useEffect(() => {
        let isMounted = true;

        const setupProvider = async () => {
            // Динамически импортируем все необходимые модули
            const Y = await import("yjs");
            const { io } = await import("socket.io-client");
            const { SocketIOProvider } = await import("y-socket.io");

            // Проверяем, не размонтировался ли компонент, пока мы все грузили
            if (!isMounted || isInitialized.current) return;

            // --- Теперь, когда мы уверены, что все модули загружены, ---
            // --- мы можем безопасно с ними работать. ---

            const ydoc = new Y.Doc();
            const socket = io("ws://localhost:5000", {
                transports: ["websocket"],
            });
            const yprovider = new SocketIOProvider(ydoc, `document-${documentId}`, socket);

            // Сохраняем состояние
            setDoc(ydoc);
            setProvider(yprovider);
            isInitialized.current = true; // Помечаем, что инициализация прошла успешно
        };

        setupProvider();

        // Функция очистки
        return () => {
            isMounted = false;
            if (isInitialized.current && provider) {
                provider.destroy();
                isInitialized.current = false;
            }
        };
    }, [documentId, provider]); // Добавляем provider в зависимости для стабильности

    return { doc, provider };
};
