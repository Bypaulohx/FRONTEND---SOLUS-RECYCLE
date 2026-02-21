import React from 'react';
import '../Navbar.css';

const Navbar = () => (
  <nav className="navbar">
    <a href="/home" className="nav-icon active">
      <i className="bi bi-house-door"></i><span>Home</span>
    </a>
    <a href="/mapa" className="nav-icon">
      <i className="bi bi-geo-alt"></i><span>Mapa</span>
    </a>
    <a href="/encontrar-catadores" className="nav-icon">
      <i className="bi bi-search"></i><span>Busca</span>
    </a>
    <a href="/reciclagem" className="nav-icon">
      <i className="bi bi-recycle"></i><span>Reciclagem</span>
    </a>
    <a href="/agendamento" className="nav-icon">
      <i className="bi bi-calendar3"></i><span>Agenda</span>
    </a>
  </nav>
);

export default Navbar;