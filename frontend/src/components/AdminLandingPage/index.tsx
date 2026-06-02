import { Link } from "react-router-dom";
import NavBar from "../NavBar";
import "./index.css";

export default function AdminLandingPage() {
  return (
    <>
      <NavBar />
      <div className="page-content">
        <div className="alanding-wrapper">
          <h1 className="alanding-title">admin</h1>
          <p className="alanding-subtitle">what are we working on today?</p>
          <div className="alanding-grid">
            <Link to="/admin/travels" className="alanding-card">
              <span className="alanding-card-icon">🗺</span>
              <span className="alanding-card-name">travels</span>
              <span className="alanding-card-desc">
                manage travel pins and photos
              </span>
            </Link>
            <Link to="/admin/music" className="alanding-card">
              <span className="alanding-card-icon">✍</span>
              <span className="alanding-card-name">music</span>
              <span className="alanding-card-desc">
                write and publish blog posts
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
