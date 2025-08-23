// import { useEffect, useState } from "react";
// import * as Y from "yjs";
// import { SocketIOProvider } from "y-socket.io";

// export const useYjs = (documentId) => {
//     const [doc, setDoc] = useState(null);
//     const [provider, setProvider] = useState(null);

//     useEffect(() => {
//         const ydoc = new Y.Doc();
//         const yprovider = new SocketIOProvider(
//             "ws://localhost:5000", // URL сервера
//             `document-${documentId}`, // roomName
//             ydoc, // Y.Doc
//             { autoConnect: true } // опции
//         );
//         setDoc(ydoc);
//         setProvider(yprovider);

//         return () => {
//             yprovider.destroy();
//         };
//     }, [documentId]);

//     return { doc, provider };
// };
