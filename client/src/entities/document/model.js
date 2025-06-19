export const documentInitialState = {
    id: null,
    projectId: null,
    title: "",
    content: "",
};

export const validateDocument = (document) => {
    if (!document.title) throw new Error("Document title is required");
    return true;
};
