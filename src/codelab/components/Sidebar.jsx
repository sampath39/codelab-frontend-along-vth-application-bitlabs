import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiTerminal, 
  FiLogOut,
  FiLayout
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'CodeLab', path: '/codelab', icon: <FiLayout /> },
  ];

  return (
    <div className="codelab-sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <FiTerminal />
        </div>
        <span className="brand-name">bitLabs</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn">
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
