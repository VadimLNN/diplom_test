import { useState, useEffect } from "react";

function CreateProjectForm({ onSubmit, onClose, initialData }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setDescription(initialData.description || "");
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Name is required");
            return;
        }
        onSubmit({ name, description });
        setName("");
        setDescription("");
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <h2>{initialData ? "Edit Project" : "Create Project"}</h2>
                <form onSubmit={handleSubmit} className="form">
                    <input type="text" placeholder="Project Name" value={name} onChange={(e) => setName(e.target.value)} />
                    <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    <div className="modal-actions">
                        <button type="submit" className="btn btn-primary">
                            {initialData ? "Update" : "Create"}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateProjectForm;
