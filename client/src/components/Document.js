import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Quill from "quill";
import { QuillBinding } from "y-quill";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { Awareness } from "y-protocols/awareness";
import "quill/dist/quill.snow.css";
import axios from "axios";

function Document() {
    const { id } = useParams();
    const editorRef = useRef(null);
    const quillRef = useRef(null);
    const ydocRef = useRef(null);
    const providerRef = useRef(null);

    useEffect(() => {
        console.log(`Initializing Y.Doc for document: ${id}`);
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;
        const ytext = ydoc.getText("content");

        console.log("Setting up WebsocketProvider");
        const provider = new WebsocketProvider(`ws://localhost:1234`, `document:${id}`, ydoc, {
            connect: true,
            awareness: new Awareness(ydoc),
            params: { docName: `document:${id}` },
        });
        providerRef.current = provider;

        provider.on("status", (event) => {
            console.log("WebsocketProvider status:", event.status);
        });

        provider.on("sync", (isSynced) => {
            console.log("WebsocketProvider sync:", isSynced);
        });

        provider.on("error", (error) => {
            console.error("WebsocketProvider error:", error);
        });

        console.log("Initializing Quill");
        const quill = new Quill(editorRef.current, {
            theme: "snow",
            modules: {
                toolbar: [[{ header: [1, 2, false] }], ["bold", "italic", "underline"], ["link"], [{ list: "ordered" }, { list: "bullet" }]],
                cursors: true,
            },
        });
        quillRef.current = quill;

        console.log("Binding Quill to Y.js");
        const binding = new QuillBinding(ytext, quill, provider.awareness);

        console.log("Setting up awareness");
        provider.awareness.setLocalStateField("user", {
            name: localStorage.getItem("username") || "Anonymous",
            color: "#" + Math.floor(Math.random() * 16777215).toString(16),
        });

        provider.awareness.on("update", () => {
            console.log("Awareness updated:", provider.awareness.getStates());
        });

        const saveInterval = setInterval(async () => {
            const content = quill.getText();
            if (content.trim()) {
                console.log("Saving content:", content);
                try {
                    await axios.put(
                        `http://localhost:5000/documents/${id}`,
                        { title: quill.getLength() > 1 ? quill.getText(0, 30) : "Untitled", content },
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                        }
                    );
                    console.log("Content saved to database");
                } catch (error) {
                    console.error("Error saving content:", error);
                }
            }
        }, 5000);

        return () => {
            console.log("Cleaning up Document component");
            clearInterval(saveInterval);
            provider.disconnect();
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
