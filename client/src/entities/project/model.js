export const projectInitialState = {
    id: null,
    name: "",
    description: "",
    ownerId: null,
};

export const validateProject = (project) => {
    if (!project.name) throw new Error("Project name is required");
    return true;
};
