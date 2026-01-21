// src/features/tabs/board/BoardEditor.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Tldraw, createTLStore } from "tldraw";
import { HocuspocusProvider } from "@hocuspocus/provider";
import styles from "./BoardEditor.module.css";
import "tldraw/tldraw.css";

/* ===========================
   Provider cache (как в TextEditor)
=========================== */
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

/* ===========================
   Persistent record types
   (то, что можно шарить)
=========================== */
const PERSISTENT_TYPES = new Set(["document", "page", "shape", "asset", "binding"]);

export default function BoardEditor({ tab }) {
    const [connected, setConnected] = useState(false);
    const [editor, setEditor] = useState(null);

    /* ===========================
     Hocuspocus provider
  =========================== */
    const provider = useMemo(() => {
        if (!tab?.ydoc_document_name) return null;
        return getProvider(tab.id, tab.ydoc_document_name);
    }, [tab?.id, tab?.ydoc_document_name]);

    useEffect(() => {
        if (!provider) return;

        const onStatus = ({ status }) => {
            setConnected(status === "connected");
            console.log("[Board] Hocuspocus:", status);
        };

        provider.on("status", onStatus);
        return () => provider.off("status", onStatus);
    }, [provider]);

    /* ===========================
     tldraw store
  =========================== */
    const store = useMemo(() => createTLStore(), []);

    /* ===========================
     Yjs map с records
  =========================== */
    const ydoc = provider?.document ?? null;
    const recordsMap = ydoc ? ydoc.getMap("tldraw_records") : null;

    /* ===========================
     Echo protection
  =========================== */
    const applyingRemoteRef = useRef(false);

    /* ===========================
     INIT: load all records from Yjs
  =========================== */
    useEffect(() => {
        if (!editor || !recordsMap) return;

        if (recordsMap.size === 0) return;

        applyingRemoteRef.current = true;

        editor.store.mergeRemoteChanges(() => {
            const records = [];
            recordsMap.forEach((value) => {
                if (value) records.push(value);
            });
            if (records.length) {
                editor.store.put(records);
            }
        });

        applyingRemoteRef.current = false;
    }, [editor, recordsMap]);

    /* ===========================
     REMOTE → LOCAL (Yjs → tldraw)
  =========================== */
    useEffect(() => {
        if (!editor || !recordsMap) return;

        const onRemoteChange = (events) => {
            if (applyingRemoteRef.current) return;

            applyingRemoteRef.current = true;

            editor.store.mergeRemoteChanges(() => {
                events.forEach((event) => {
                    event.changes.keys.forEach((change, key) => {
                        if (change.action === "delete") {
                            editor.store.remove([key]);
                        } else {
                            const record = recordsMap.get(key);
                            if (record) editor.store.put([record]);
                        }
                    });
                });
            });

            applyingRemoteRef.current = false;
        };

        recordsMap.observeDeep(onRemoteChange);
        return () => recordsMap.unobserveDeep(onRemoteChange);
    }, [editor, recordsMap]);

    /* ===========================
     LOCAL → REMOTE (tldraw → Yjs)
  =========================== */
    useEffect(() => {
        if (!editor || !recordsMap) return;

        // 🔥 как в доках tldraw: можно фильтровать по source/scope, чтобы не ловить лишнее
        // editor.store.listen(handler, { source: 'user', scope: 'all' }) :contentReference[oaicite:1]{index=1}
        const unsubscribe = editor.store.listen(
            (change) => {
                if (applyingRemoteRef.current) return;
                if (change.source === "remote") return;

                const { added, updated, removed } = change.changes;

                // added: object { [id]: record }
                for (const record of Object.values(added)) {
                    if (PERSISTENT_TYPES.has(record.typeName)) {
                        recordsMap.set(record.id, record);
                    }
                }

                // updated: object { [id]: [from, to] }
                for (const pair of Object.values(updated)) {
                    const to = pair?.[1];
                    if (to && PERSISTENT_TYPES.has(to.typeName)) {
                        recordsMap.set(to.id, to);
                    }
                }

                // removed: object { [id]: record }
                for (const record of Object.values(removed)) {
                    if (record?.id) {
                        recordsMap.delete(record.id);
                    }
                }
            },
            // 🔥 фильтр как в примере tldraw: слушаем только изменения от пользователя
            { source: "user", scope: "all" },
        );

        return () => unsubscribe();
    }, [editor, recordsMap]);

    /* ===========================
     UI
  =========================== */
    if (!provider) {
        return <div className={styles.loading}>🔄 Initializing board…</div>;
    }

    return (
        <div className={styles.container}>
            <span className={connected ? styles.connected : styles.disconnected}>{connected ? "🟢 Connected" : "🔴 Disconnected"}</span>

            <div className={styles.board}>
                <Tldraw store={store} onMount={(ed) => setEditor(ed)} />
            </div>
        </div>
    );
}
