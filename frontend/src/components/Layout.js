import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../layout.css";
import { useSelector } from "react-redux";
import { Badge, Avatar } from "antd";

function Layout(props) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();

  // User Menu
  const userMenu = [
    { name: "Home", path: "/", icon: "ri-home-line" },
    { name: "Appointments", path: "/appointments", icon: "ri-file-list-line" },
    { name: "Apply Doctor", path: "/apply-doctor", icon: "ri-hospital-line" },
  ];
  const doctorMenu = [
    { name: "Home", path: "/", icon: "ri-home-line" },
    {
      name: "Appointments",
      path: "/doctor/appointments",
      icon: "ri-file-list-line",
    },
    {
      name: "Profile",
      path: `/doctor/profile/${user?._id}`, // Ensure _id is not accessed when user is null
      icon: "ri-user-line",
    },
  ];
  // Admin Menu
  const adminMenu = [
    { name: "Home", path: "/", icon: "ri-home-line" },
    { name: "Users", path: "/admin/userslist", icon: "ri-user-line" },
    { name: "Doctors", path: "/admin/doctorslist", icon: "ri-user-star-line" },
    { name: "Profile", path: "/profile", icon: "ri-user-line" },
  ];

  // Select menu based on role
  const menuToBeRendered = user?.isAdmin
    ? adminMenu
    : user?.isDoctor
    ? doctorMenu
    : userMenu;
  const role = user?.isAdmin ? "Admin" : user?.isDoctor ? "Doctor" : "User";
  return (
    <div className="main">
      <div className="d-flex layout">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h1 className="logo">SH</h1>
            <h1 className="role">{role}</h1>
          </div>
          <div className="menu">
            {menuToBeRendered.map((menu) => {
              const isActive = location.pathname === menu.path;

              return (
                <div
                  className={`d-flex menu-item ${
                    isActive ? "active-menu-item" : ""
                  }`}
                  key={menu.name}
                >
                  <i className={menu.icon}></i>
                  {!collapsed && <Link to={menu.path}>{menu.name}</Link>}
                </div>
              );
            })}
            {/* Logout Button */}
            <div
              className="d-flex menu-item"
              onClick={() => {
                localStorage.clear();
                navigate("/login");
              }}
            >
              <i className="ri-logout-box-line"></i>
              {!collapsed && <Link to="/login">Logout</Link>}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="content">
          {/* Header */}
          <div className="header">
            {collapsed ? (
              <i
                className="ri-menu-2-line header-action-icon"
                onClick={() => setCollapsed(false)}
              ></i>
            ) : (
              <i
                className="ri-close-line header-action-icon"
                onClick={() => setCollapsed(true)}
              ></i>
            )}
            <div className="d-flex align-items-center px-4">
              {/* Safe Access to Notifications */}
              <Badge
                count={user?.unseenNotifications?.length || 0}
                onClick={() => navigate("/notifications")}
              >
                <i className="ri-notification-line header-action-icon px-3"></i>
              </Badge>

              {/* User Profile Link */}
              <Link className="anchor mx-3" to="/profile">
                {user?.name || "User"}
              </Link>
            </div>
          </div>

          {/* Page Content */}
          <div className="body">{props.children}</div>
        </div>
      </div>
    </div>
  );
}

export default Layout;
