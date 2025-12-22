// src/modules/User/pages/ProfilePage.jsx
import "@/app/styles/ProfilePage.css"; 
import "bootstrap-icons/font/bootstrap-icons.css";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../hooks/useProfile";
import { useAuth } from "@/modules/User/auth/context/AuthProvider";

export default function ProfilePage() {
  const { user, updateDetails, updateAvatar, loading, uploading } = useProfile();
  const { logout } = useAuth(); 

  const [editing, setEditing]   = useState(false);
  const [username, setUsername] = useState("");
  const [newPic,   setNewPic]   = useState(null);

  const nav = useNavigate();

  useEffect(() => {
    if (user) setUsername(user.username || "");
  }, [user, editing]);

  const saveChanges = async () => {
    if (username !== user?.username) {
       if (!await updateDetails(username)) return;
    }
    if (newPic) {
       if (!await updateAvatar(newPic)) return;
    }
    setEditing(false);
    setNewPic(null);
  };

  /* * FIX: Robust URL Constructor 
   * Converts 'avatars/filename.png' -> 'http://localhost:5000/static/uploads/avatars/filename.png'
   */
  const getImageUrl = (path) => {
    if (!path) return null;
    
    // 1. If it's a local preview (Blob) or full URL, use as is
    if (path.startsWith("blob:") || path.startsWith("data:") || path.startsWith("http")) return path; 
    
    // 2. Clean leading slashes
    const cleanPath = path.replace(/^\/+/, ""); 
    
    // 3. Get Base URL (http://localhost:5000)
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api$/, "");
    
    // 4. Construct final URL
    // If path already starts with 'static', don't repeat it.
    if (cleanPath.startsWith("static/")) return `${baseUrl}/${cleanPath}`;
    
    return `${baseUrl}/static/uploads/${cleanPath}?t=${Date.now()}`; // Add timestamp to bust cache
  };

  /* FIX: Local Fallback Image (No Network Request) */
  const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

  const avatarSrc = newPic 
    ? URL.createObjectURL(newPic) 
    : (getImageUrl(user?.profile_pic) || FALLBACK_IMAGE);

  /* Helper Component for Tiles */
  const Tile = ({ icon, text, onClick, className = "" }) => (
    <button className={`menu-tile ${className}`} onClick={onClick}>
      <span className="d-flex align-items-center">
        <i className={`me-3 ${icon}`} /> {text}
      </span>
      <i className="bi bi-chevron-right" />
    </button>
  );

  return (
    <div className="profile-page">
      <section className="profile-card text-center">
        <div className="avatar-wrapper mx-auto">
            <img 
                src={avatarSrc} 
                alt="Profile" 
                className="profile-avatar" 
                onError={(e) => {
                    // FIX: Prevent infinite loop by checking current src
                    if (e.target.src !== FALLBACK_IMAGE) {
                        e.target.src = FALLBACK_IMAGE;
                    }
                }}
            />
        </div>

        {!editing ? (
          <>
            <h3 className="profile-name">{user?.username || "User"}</h3>
            <p className="profile-tagline">
              <i className="bi bi-stars me-2" />
              Welcome&nbsp;back&nbsp;{user?.username}
            </p>
            <button className="btn-gold" onClick={() => setEditing(true)}>Edit Profile</button>
          </>
        ) : (
          <div className="mt-3" style={{ maxWidth: '300px', margin: '0 auto' }}>
            <input
              className="form-control mb-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              disabled={loading || uploading}
            />
            <input
              type="file"
              className="form-control mb-3"
              accept="image/*"
              onChange={(e) => setNewPic(e.target.files[0])}
              disabled={loading || uploading}
            />
            <div className="d-flex gap-2 justify-content-center">
                <button className="btn btn-success flex-grow-1" onClick={saveChanges} disabled={loading || uploading}>
                {loading || uploading ? "Saving..." : "Save"}
                </button>
                <button className="btn btn-secondary" onClick={() => { setEditing(false); setNewPic(null); }} disabled={loading || uploading}>
                Cancel
                </button>
            </div>
          </div>
        )}
      </section>

      <div className="tiles-grid">
        {/* NEW: Address Page Link */}
        <Tile icon="bi bi-geo-alt" text="Saved Addresses" onClick={() => nav("/addresses")} />
        <Tile icon="bi bi-bag" text="My Orders" onClick={() => nav("/my-orders")} />
        <Tile icon="bi bi-question-circle" text="Help Center" onClick={() => nav("/help")} />
        <Tile icon="bi bi-box-arrow-right" text="Logout" onClick={() => { logout(); nav("/"); }} className="logout" />
      </div>
    </div>
  );
}