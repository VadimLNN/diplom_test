import React, { useLayoutEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import Quill from "quill";
import { QuillBinding } from "y-quill";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import "quill/dist/quill.snow.css";
import io from "socket.io-client";

function Document() {
    const { id } = useParams(); // documentId
    const editorRef = useRef(null);
    const quillRef = useRef(null);
    const ydocRef = useRef(null);
    const socketRef = useRef(null);
    const isInitialized = useRef(false); // Флаг для отслеживания инициализации

    const initializeQuill = useCallback(() => {
        // Очистка предыдущего состояния перед каждой инициализацией
        if (quillRef.current) {
            quillRef.current.off("text-change"); // Удаляем слушатели
            quillRef.current = null;
        }
        if (ydocRef.current) {
            ydocRef.current.destroy();
            ydocRef.current = null;
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        // Очистка DOM
        if (editorRef.current) {
            editorRef.current.innerHTML = "";
            console.log("Cleared previous Quill instance for document:", id);
        }

        // Инициализация только если ещё не выполнена
        if (!isInitialized.current && editorRef.current) {
            console.log("Initializing Quill for document:", id);

            const ydoc = new Y.Doc();
            ydocRef.current = ydoc;
            const ytext = ydoc.getText("content");

            const socket = io("http://localhost:5000", { withCredentials: true });
            socketRef.current = socket;

            socket.on("connect", () => {
                console.log("Connected to server:", socket.id);
                socket.emit("joinDocument", `document_${id}`);
            });

            socket.on("documentSync", (update) => {
                Y.applyUpdate(ydoc, new Uint8Array(update));
            });

            socket.on("documentUpdate", (update) => {
                Y.applyUpdate(ydoc, new Uint8Array(update));
            });

            const quill = new Quill(editorRef.current, {
                theme: "snow",
                modules: {
                    toolbar: [[{ header: [1, 2, false] }], ["bold", "italic", "underline"], ["link"], [{ list: "ordered" }, { list: "bullet" }]],
                },
            });
            quillRef.current = quill;

            const binding = new QuillBinding(ytext, quill, new Awareness(ydoc));
            const awareness = new Awareness(ydoc);
            awareness.setLocalStateField("user", {
                name: localStorage.getItem("username") || "Anonymous",
                color: "#" + Math.floor(Math.random() * 16777215).toString(16),
            });

            quill.on("text-change", (delta, oldDelta, source) => {
                if (source === "user") {
                    const update = Y.encodeStateAsUpdate(ydoc);
                    socket.emit("documentUpdate", Array.from(update));
                    console.log("Text changed, sending update for document:", id);
                }
            });

            isInitialized.current = true;
        } else if (isInitialized.current) {
            console.log("Quill already initialized, skipping for document:", id);
        }
    }, [id]); // Зависимость от id для синхронизации

    useLayoutEffect(() => {
        initializeQuill();

        // Очистка при размонтировании
        return () => {
            if (quillRef.current) {
                quillRef.current.off("text-change");
                quillRef.current = null;
            }
            if (ydocRef.current) {
                ydocRef.current.destroy();
                ydocRef.current = null;
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            if (editorRef.current) {
                editorRef.current.innerHTML = "";
            }
            isInitialized.current = false;
        };
    }, [initializeQuill]);

    return (
        <div>
            <h2>Document Editor - ID: {id}</h2>
            <div ref={editorRef}></div> {/* Только один div */}
        </div>
    );
}

export default Document;
