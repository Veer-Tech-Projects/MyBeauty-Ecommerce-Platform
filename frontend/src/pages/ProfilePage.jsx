// src/pages/ProfilePage.jsx
import "../styles/ProfilePage.css";            // new luxe CSS
import "bootstrap-icons/font/bootstrap-icons.css";

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function ProfilePage() {
  const { user, login, logout } = useUser();

  /* local edit state */
  const [editing, setEditing]   = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [newPic,   setNewPic]   = useState(null);

  const nav = useNavigate();

  /* save profile changes */
  const saveChanges = async () => {
    try {
      const fd = new FormData();
      fd.append("id", user.id);
      fd.append("username", username);
      if (newPic) fd.append("profile_pic", newPic);

      const { data } = await axios.post(
        "http://localhost:5000/api/update-profile",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      login(data.user);
      setEditing(false);
    } catch {
      alert("Couldn’t update profile");
    }
  };

  /* menu-tile helper */
  const Tile = ({ icon, text, onClick, className = "" }) => (
    <button className={`menu-tile ${className}`} onClick={onClick}>
      <span className="d-flex align-items-center">
        <i className={`me-3 ${icon}`} /> {text}
      </span>
      <i className="bi bi-chevron-right" />
    </button>
  );

  /* avatar source */
  const avatarSrc =
    newPic
      ? URL.createObjectURL(newPic)
      : user?.profile_pic || "https://via.placeholder.com/150?text=👤";

  /* ────────────────────────────── JSX ───────────────────────────── */
  return (
    <div className="profile-page">
      {/* ── hero glass card ────────────────────────── */}
      <section className="profile-card text-center">
        <img src={avatarSrc} alt="avatar" className="profile-avatar" />

        {!editing ? (
          <>
            <h3 className="profile-name">{user?.username}</h3>
            <p className="profile-tagline">
              <i className="bi bi-stars me-2" />
              Welcome&nbsp;back&nbsp;{user?.username}
            </p>

            <button className="btn-gold" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          </>
        ) : (
          <div className="mt-3">
            <input
              className="form-control mb-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />

            <input
              type="file"
              className="form-control mb-3"
              accept="image/*"
              onChange={(e) => setNewPic(e.target.files[0])}
            />

            <button className="btn btn-success me-2" onClick={saveChanges}>
              Save
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setEditing(false);
                setNewPic(null);
                setUsername(user?.username || "");
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* ── action tiles grid ──────────────────────── */}
      <div className="tiles-grid">
        <Tile
          icon="bi bi-bag"
          text="My Orders"
          onClick={() => nav("/my-orders")}
        />

        <Tile
          icon="bi bi-question-circle"
          text="Help Center"
          onClick={() => nav("/help")}
        />

        <Tile
          icon="bi bi-box-arrow-right"
          text="Logout"
          onClick={() => {
            logout();
            nav("/");
          }}
          className="logout"
        />
      </div>
    </div>
  );
}
