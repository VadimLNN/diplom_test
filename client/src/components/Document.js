import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Quill from "quill";
import { QuillBinding } from "y-quill";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { Awareness } from "y-protocols/awareness";
import io from "socket.io-client";
import "quill/dist/quill.snow.css";

function Document() {
    const { id } = useParams();
    const editorRef = useRef(null);
    const quillRef = useRef(null);
    const ydocRef = useRef(null);
    const providerRef = useRef(null);

    useEffect(() => {
        // Инициализация Y.js
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;
        const ytext = ydoc.getText("content");

        // Подключение к WebSocket
        const socket = io("http://localhost:5000", {
            transports: ["websocket"],
            withCredentials: true,
        });

        socket.on("connect", () => {
            console.log("Socket.io connected:", socket.id);
        });
        socket.on("connect_error", (error) => {
            console.error("Socket.io connection error:", error);
        });

        const provider = new WebsocketProvider("collabdocs", `document:${id}`, socket, {
            awareness: new Awareness(ydoc),
        });
        providerRef.current = provider;

        provider.on("status", (event) => {
            console.log("WebsocketProvider status:", event.status); // Лог статуса
        });

        // Инициализация Quill
        const quill = new Quill(editorRef.current, {
            theme: "snow",
            modules: {
                toolbar: [[{ header: [1, 2, false] }], ["bold", "italic", "underline"], ["link"], [{ list: "ordered" }, { list: "bullet" }]],
                cursors: true, // Включаем поддержку курсоров
            },
        });
        quillRef.current = quill;

        // Привязка Quill к Y.js
        const binding = new QuillBinding(ytext, quill, provider.awareness);

        // Настройка курсоров через awareness
        provider.awareness.setLocalStateField("user", {
            name: localStorage.getItem("username") || "Anonymous",
            color: "#" + Math.floor(Math.random() * 16777215).toString(16),
        });

        provider.awareness.on("update", () => {
            console.log("Awareness updated:", provider.awareness.getStates());
        });

        // Сохранение содержимого в базе (раз в 5 секунд)
        const saveInterval = setInterval(() => {
            const content = quill.getText();
            if (content.trim()) {
                console.log("Saving content:", content);
                // В будущем: отправить content на сервер через PUT /documents/:id
            }
        }, 5000);

        return () => {
            clearInterval(saveInterval);
            provider.disconnect();
            socket.disconnect();
            ydoc.destroy();
        };
    }, [id]);

    return (
        <div className="container">
            <h2>Document Editor</h2>
            <div className="editor" ref={editorRef}></div>
        </div>
    );
}

export default Document;
