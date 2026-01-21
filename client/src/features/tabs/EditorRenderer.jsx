// src/features/tabs/editors/EditorRenderer.jsx
import React from "react";

import TextEditor from "./text/ui/TextEditor";
import BoardEditor from "./board/BoardEditor";
//import CodeEditor from "./code/CodeEditor";

const EditorRenderer = ({ tab }) => {
    switch (tab.type) {
        case "text":
            return <TextEditor tab={tab} />;

        case "board":
            return <BoardEditor tab={tab} />;

        // case "code":
        //     return <CodeEditor tab={tab} />;

        default:
            return (
                <div>
                    ❌ Unknown tab type: <strong>{tab.type}</strong>
                </div>
            );
    }
};

export default EditorRenderer;
