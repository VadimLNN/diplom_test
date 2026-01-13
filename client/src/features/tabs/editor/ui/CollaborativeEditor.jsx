import React, { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import Loader from "../../../../shared/ui/Loader/Loader";
import styles from "./CollaborativeEditor.module.css";

export default function CollaborativeEditor({ projectId, userId, userName }) {
    const [connected, setConnected] = useState(false);
    const [editor, setEditor] = useState(null);

    // Создаем Y.Doc один раз для проекта
    const doc = useMemo(() => new Y.Doc(), [projectId]);

    // Создаем HocuspocusProvider
    const provider = useMemo(() => {
        const jwt = localStorage.getItem("jwt");

        return new HocuspocusProvider({
            url: `${process.env.REACT_APP_WS_URL || "ws://localhost:5000"}/api/collab`,
            name: `project.${projectId}`, // уникально!
            token: jwt,
            document: doc,
            connect: true,
            resyncInterval: 5000, // переподключаться каждые 5s если нужно
            awareness: {
                // Информация для курсоров
                user: {
                    name: userName,
                    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                },
            },
        });
    }, [projectId, doc]);

    // Editor с Tiptap + Yjs
    const customEditor = useEditor({
        extensions: [
            StarterKit.configure({
                history: false, // отключаем, Yjs управляет историей
            }),
            Collaboration.configure({
                document: doc,
                field: "prose", // поле в Y.XmlFragment
            }),
            CollaborationCursor.configure({
                provider: provider.awareness,
                user: {
                    name: userName,
                    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                },
            }),
        ],
        content: `<h2>Коллаборативный редактор 👋</h2><p>Начни писать...</p>`,
    });

    setEditor(customEditor);

    // Отслеживаем статус подключения
    useEffect(() => {
        const handleSync = (isSynced) => {
            setConnected(isSynced);
        };

        provider.on("sync", handleSync);

        return () => {
            provider.off("sync", handleSync);
        };
    }, [provider]);

    if (!customEditor) return <Loader />;

    return (
        <div style={{ padding: 40, maxWidth: "1200px", margin: "0 auto" }}>
            {/* Toolbar */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <button onClick={() => customEditor.chain().focus().toggleBold().run()} className={customEditor.isActive("bold") ? "active" : ""}>
                    Bold
                </button>
                <button onClick={() => customEditor.chain().focus().toggleItalic().run()} className={customEditor.isActive("italic") ? "active" : ""}>
                    Italic
                </button>
                <button onClick={() => customEditor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
            </div>

            {/* Статус */}
            <div style={{ marginBottom: 15, fontSize: 14 }}>
                <span
                    style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: connected ? "green" : "red",
                        marginRight: 8,
                    }}
                />
                {connected ? "Connected" : "Connecting..."}
            </div>

            {/* Редактор */}
            <div className={styles.editorWrapper}>
                <EditorContent editor={customEditor} />
            </div>
        </div>
    );
}
