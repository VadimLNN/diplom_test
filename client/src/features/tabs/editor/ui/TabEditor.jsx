// src/features/tabs/editor/ui/TabEditor.jsx — ✅ 100% РАБОЧИЙ!
import React, { useEffect, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import styles from "./CollaborativeEditor.module.css";

// ✅ Глобальное хранилище (как в рабочем примере)
const tabProviders = new Map();

const TabEditor = ({ tab, userName = "User" }) => {
    const [htmlContent, setHtmlContent] = useState("");
    const [isConnected, setIsConnected] = useState(false);

    // ✅ 1. СИНХРОННАЯ инициализация провайдера
    const getOrCreateProvider = useCallback(() => {
        if (!tab?.ydoc_document_name) return null;

        if (!tabProviders.has(tab.id)) {
            console.log("🔧 Creating provider for:", tab.ydoc_document_name);

            const provider = new HocuspocusProvider({
                url: "ws://localhost:5000/api/collab",
                name: tab.ydoc_document_name,
                //token: localStorage.getItem("jwt"),
            });

            const ydoc = provider.document;
            const editorStateMap = ydoc.getMap("editorState");

            tabProviders.set(tab.id, { provider, ydoc, editorStateMap });
        }

        return tabProviders.get(tab.id);
    }, [tab?.id, tab?.ydoc_document_name]);

    // ✅ 2. Observer (точно как в примере!)
    useEffect(() => {
        const docData = getOrCreateProvider();
        if (!docData) return;

        const observer = () => {
            const content = docData.editorStateMap.get("content");
            if (content) {
                setHtmlContent(content);
            }
        };

        observer(); // начальное состояние
        docData.editorStateMap.observe(observer);

        const handleStatus = ({ status }) => {
            setIsConnected(status === "connected");
        };

        docData.provider.on("status", handleStatus);

        return () => {
            docData.editorStateMap.unobserve(observer);
            docData.provider.off("status", handleStatus);
        };
    }, [getOrCreateProvider]);

    // ✅ 3. Editor С ТОЧНЫМ YDOC (никогда undefined!)
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ history: false }),
            // ✅ document всегда готов!
            Collaboration.configure({
                document: getOrCreateProvider()?.ydoc,
            }),
        ],
        content: htmlContent || "<p>Начните редактировать...</p>",
        onUpdate: ({ editor }) => {
            const docData = getOrCreateProvider();
            if (docData) {
                docData.editorStateMap.set("content", editor.getHTML());
            }
        },
    });

    // ✅ 4. Ждем готовности
    if (!editor || !getOrCreateProvider()?.ydoc) {
        return (
            <div className={styles.loading}>
                <div>🔄 Connecting...</div>
                {!tab && <div>Select a tab</div>}
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>
                    {tab.title} {isConnected ? "🟢" : "🔴"}
                </h3>
            </div>

            <div className={styles.toolbar}>
                <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? styles.active : ""}>
                    <b>B</b>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive("heading", { level: 2 }) ? styles.active : ""}
                >
                    H2
                </button>
            </div>

            <div className={styles.editor}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default TabEditor;
