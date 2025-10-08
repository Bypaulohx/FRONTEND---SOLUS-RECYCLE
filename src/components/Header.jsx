import React from 'react';
import '../Header.css';

const Header = () => (
  <header className="header">
    <a href="/home">
      <img src="/assets/Logo Header.png" className="logo-icon" alt="Logo" />
    </a>
    <a href="/perfil">
      <img src="/assets/User.jpg" className="user-photo" alt="User" />
    </a>
  </header>
);

export default Header;