import { Link } from "react-router-dom";

function DocumentCard({ document, onDelete }) {
    return (
        <div className="card document-card">
            <h3>{document.title}</h3>
            <p>Last updated: {new Date(document.updated_at).toLocaleString()}</p>
            <div className="document-actions">
                <Link to={`/documents/${document.id}`} className="btn btn-primary">
                    Open
                </Link>
                <button className="btn btn-danger" onClick={onDelete}>
                    Delete
                </button>
            </div>
        </div>
    );
}

export default DocumentCard;
