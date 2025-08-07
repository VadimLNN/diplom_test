import { Link } from "react-router-dom";

function ProjectCard({ project, onEdit, onDelete }) {
    return (
        <div className="card project-card">
            <h3>{project.name}</h3>
            <p>{project.description || "No description"}</p>
            <div className="project-actions">
                <Link to={`/projects/${project.id}`} className="btn btn-primary">
                    Open
                </Link>
                <button className="btn btn-secondary" onClick={onEdit}>
                    Edit
                </button>
                <button className="btn btn-danger" onClick={onDelete}>
                    Delete
                </button>
            </div>
        </div>
    );
}

export default ProjectCard;
