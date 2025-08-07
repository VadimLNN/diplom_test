import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../app/providers/AuthProvider";
import ReactMarkdown from "react-markdown";

const Editor = ({ initialContent, onSave, onCancel }) => {
    const { token } = useAuth();
    const [content, setContent] = useState(initialContent || "");
    const [error, setError] = useState("");

    useEffect(() => {
        setContent(initialContent || "");
    }, [initialContent]);

    const handleSave = () => {
        if (onSave) onSave(content);
    };

    return (
        <div className="card">
            {error && <div className="message error">{error}</div>}
            <textarea className="editor" value={content} onChange={(e) => setContent(e.target.value)} />
            <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleSave}>
                    Save
                </button>
                <button className="btn btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
            </div>
            <div>
                <h3>Preview:</h3>
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>
        </div>
    );
};

export default React.memo(Editor);
