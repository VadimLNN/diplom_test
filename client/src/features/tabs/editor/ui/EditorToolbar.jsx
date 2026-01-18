import React from "react";

const EditorToolbar = ({ editor }) => {
    if (!editor) return null;

    return (
        <div style={{ display: "flex", gap: 8, padding: 8 }}>
            <button onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()}>S</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
            <button onClick={() => editor.chain().focus().toggleBulletList().run()}>•</button>
            <button onClick={() => editor.chain().focus().toggleLink().run()}>🔗</button>
            <button onClick={() => editor.chain().focus().toggleBold().run()}>Bold</button>

            <button onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</button>

            <button onClick={() => editor.chain().focus().toggleUnderline().run()}>Underline</button>

            <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code</button>

            <button onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>

            <button onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>

            <button onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}>H2</button>

            <button
                onClick={() => {
                    const url = window.prompt("Image URL");
                    if (url) {
                        editor.chain().focus().setImage({ src: url }).run();
                    }
                }}
            >
                Image
            </button>

            <button onClick={() => editor.chain().focus().undo().run()}>Undo</button>

            <button onClick={() => editor.chain().focus().redo().run()}>Redo</button>
        </div>
    );
};

export default EditorToolbar;
