import React, { useEffect, useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import styles from "./CollaborativeEditor.module.css";

const tabProviders = new Map();

const TabEditor = ({ tab, userName = "User" }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isProviderReady, setIsProviderReady] = useState(false);
    const editorRef = useRef(null);

    // ✅ 1 раз создаём провайдер
    const getOrCreateProvider = useCallback(() => {
        if (!tab?.ydoc_document_name) return null;

        if (!tabProviders.has(tab.id)) {
            console.log("🔧 Creating provider:", tab.ydoc_document_name);

            const provider = new HocuspocusProvider({
                url: "ws://localhost:5000/api/collab",
                name: tab.ydoc_document_name,
                connect: false, // ✅ Подключаем вручную!
            });

            const ydoc = provider.document;
            const editorStateMap = ydoc.getMap("editorState");

            tabProviders.set(tab.id, { provider, ydoc, editorStateMap });
        }

        return tabProviders.get(tab.id);
    }, [tab?.id, tab?.ydoc_document_name]);

    // ✅ Инициализация провайдера
    useEffect(() => {
        const docData = getOrCreateProvider();
        if (!docData) return;

        // ✅ Подключаем вручную
        docData.provider.connect();

        const handleStatus = ({ status }) => {
            console.log("Provider status:", status);
            setIsConnected(status === "connected");
            if (status === "connected") {
                setIsProviderReady(true);
            }
        };

        docData.provider.on("status", handleStatus);

        return () => {
            docData.provider.off("status", handleStatus);
            docData.provider.disconnect();
        };
    }, [getOrCreateProvider]);

    // ✅ Editor ТОЛЬКО после готовности!
    const editor = useEditor({
        editorProps: {
            attributes: {
                class: styles.editorContent,
            },
        },
        extensions: isProviderReady
            ? [
                  StarterKit.configure({ history: false }),
                  Collaboration.configure({
                      document: getOrCreateProvider()?.ydoc,
                  }),
              ]
            : [
                  StarterKit, // ✅ Базовый без коллаборации
              ],
        content: "<p>🔄 Connecting to collaborative editor...</p>",
        editorProps: {
            transformPastedHTML: (html) => html,
        },
    });

    // ✅ Сохраняем ссылку
    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    if (!editor) {
        return <div className={styles.loading}>🔄 Initializing editor...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>
                    {tab?.title}
                    <span className={isConnected ? styles.connected : styles.disconnected}>{isConnected ? "🟢" : "🔴"}</span>
                </h2>
            </div>

            <div className={styles.toolbar}>
                <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? styles.active : ""}>
                    <b>B</b>
                </button>
                <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? styles.active : ""}>
                    <i>I</i>
                </button>
            </div>

            <div className={styles.editor}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default TabEditor;
