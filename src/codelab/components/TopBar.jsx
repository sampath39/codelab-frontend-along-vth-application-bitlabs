import React from 'react';
import { FiSearch, FiBell, FiUser } from 'react-icons/fi';
import './TopBar.css';

const TopBar = () => {
  return (
    <header className="codelab-top-bar">
      <div className="search-box">
        <FiSearch className="search-icon" />
        <input type="text" placeholder="Search anything..." />
      </div>
      
      <div className="top-bar-right">
        <div className="icon-badge">
          <FiBell />
          <span className="badge-dot"></span>
        </div>
        
        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">Guest User</span>
            <span className="user-role">CodeLab Student</span>
          </div>
          <div className="user-avatar">
            <FiUser />
          </div>
        </div>
      </div>
    </header>
  );
};
export default TopBar;
