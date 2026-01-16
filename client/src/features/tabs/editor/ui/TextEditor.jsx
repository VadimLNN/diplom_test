// src/features/tabs/editor/ui/TabEditor.jsx
import React, { useMemo, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import { HocuspocusProvider } from "@hocuspocus/provider";
import styles from "./TextEditor.module.css";

const providerCache = new Map();

function getProvider(tabId, docName) {
    if (!providerCache.has(tabId)) {
        const provider = new HocuspocusProvider({
            url: "ws://localhost:1234/api/collab",
            name: docName,
        });

        providerCache.set(tabId, provider);
    }

    return providerCache.get(tabId);
}

const TextEditor = ({ tab }) => {
    const [connected, setConnected] = useState(false);

    const provider = useMemo(() => {
        if (!tab?.ydoc_document_name) return null;
        return getProvider(tab.id, tab.ydoc_document_name);
    }, [tab?.id, tab?.ydoc_document_name]);

    useEffect(() => {
        if (!provider) return;

        const handleStatus = ({ status }) => {
            setConnected(status === "connected");
            console.log("Hocuspocus status:", status);
        };

        provider.on("status", handleStatus);

        return () => {
            provider.off("status", handleStatus);
        };
    }, [provider]);

    const editor = useEditor(
        provider
            ? {
                  extensions: [
                      StarterKit.configure({
                          history: false,
                      }),
                      Collaboration.configure({
                          document: provider.document,
                      }),
                  ],
                  editorProps: {
                      attributes: {
                          class: styles.editorContent,
                      },
                  },
              }
            : null
    );

    if (!editor) {
        return <div className={styles.loading}>🔄 Initializing editor...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>
                    {tab.title}{" "}
                    <span className={connected ? styles.connected : styles.disconnected}>{connected ? "🟢 Connected" : "🔴 Disconnected"}</span>
                </h2>
            </div>

            <div className={styles.editor}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default TextEditor;
