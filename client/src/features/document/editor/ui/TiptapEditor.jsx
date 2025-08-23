// src/features/document/editor/ui/TiptapEditor.jsx

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useAuth } from "../../../../app/providers/AuthProvider";
import styles from "./CollaborativeEditor.module.css"; // Переиспользуем стили

// Этот компонент принимает ГОТОВЫЕ doc и provider
const TiptapEditor = ({ doc, provider }) => {
    const { user } = useAuth();

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                history: false, // Отключаем стандартную историю, Y.js управляет своей
            }),
            Collaboration.configure({
                document: doc, // Привязываем к Y.Doc
            }),
            CollaborationCursor.configure({
                provider: provider, // Привязываем к WebSocket-провайдеру
                user: {
                    name: user?.username || "Anonymous",
                    // Генерируем случайный цвет для курсора
                    color: "#" + Math.floor(Math.random() * 16777215).toString(16),
                },
            }),
        ],
    });

    // Можно добавить заглушку, пока useEditor окончательно не инициализируется
    if (!editor) {
        return null;
    }

    return (
        <div className={styles.tiptapWrapper}>
            <EditorContent editor={editor} />
        </div>
    );
};

export default TiptapEditor;
