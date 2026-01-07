import React, { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

import Loader from "../../../../shared/ui/Loader/Loader";
import styles from "./CollaborativeEditor.module.css";

const WS_URL = "ws://localhost:1234";

const CollaborativeEditor = ({
    tabId, // ❗ ТОЛЬКО UUID из таблицы tabs.id
    isReadOnly = false,
}) => {
    /* ======================================================
       Guards
    ====================================================== */
    if (!tabId) {
        console.error("[CollaborativeEditor] tabId is missing");
        return <div>Invalid tab</div>;
    }

    /* ======================================================
       Local state
    ====================================================== */
    const [providerReady, setProviderReady] = useState(false);

    /* ======================================================
       Yjs document (1 per tab)
    ====================================================== */
    const ydoc = useMemo(() => {
        console.log("[CollaborativeEditor] create Y.Doc for tab", tabId);
        return new Y.Doc();
    }, [tabId]);
    /* ======================================================
       Hocuspocus provider
    ====================================================== */
    const provider = useMemo(() => {
        const token = localStorage.getItem("token");
        console.log("[CE] localStorage token =", token);

        if (!token) {
            console.warn("[CollaborativeEditor] no auth token");
            return null;
        }
        console.log("[CollaborativeEditor] connect tab:", tabId);

        return new HocuspocusProvider({
            url: WS_URL,
            name: tabId,
            document: ydoc,
            token: localStorage.getItem("token"),
        });
    }, [tabId, ydoc]);

    /* ======================================================
       Provider lifecycle
    ====================================================== */
    useEffect(() => {
        if (!provider) return;

        const handleStatus = ({ status }) => {
            if (status === "connected") {
                setProviderReady(true);
            }
        };

        provider.on("status", handleStatus);

        return () => {
            provider.off("status", handleStatus);
        };
    }, [provider]);

    /* ======================================================
       TipTap extensions (SAFE)
    ====================================================== */
    const extensions = useMemo(() => {
        const base = [
            StarterKit.configure({
                history: false, // history управляется Yjs
            }),
            Collaboration.configure({
                document: ydoc,
            }),
        ];

        if (providerReady) {
            base.push(
                CollaborationCursor.configure({
                    provider,
                    user: {
                        name: "User",
                        color: "#4F46E5",
                    },
                })
            );
        }

        return base;
    }, [ydoc, provider, providerReady]);

    /* ======================================================
       TipTap editor
    ====================================================== */
    const editor = useEditor({
        editable: !isReadOnly,
        extensions,
    });

    /* ======================================================
       Cleanup
    ====================================================== */
    useEffect(() => {
        return () => {
            console.log("[CollaborativeEditor] cleanup", tabId);
            provider?.destroy(); // сначала сеть
            editor?.destroy(); // потом editor
            ydoc.destroy(); // потом модель
        };
    }, [editor, provider, ydoc, tabId]);

    /* ======================================================
       Loading state
    ====================================================== */
    if (!editor || !provider) {
        return <Loader />;
    }

    return (
        <div className={styles.editorWrapper}>
            <EditorContent editor={editor} />
        </div>
    );
};

export default CollaborativeEditor;
