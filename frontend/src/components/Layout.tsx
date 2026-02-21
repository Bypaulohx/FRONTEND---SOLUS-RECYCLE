import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const path = useLocation().pathname;
  return (
    <div className="app-layout">
      <header className="header">
        <Link to="/home">
          <img src="/Logo Header.png" alt="GreenBox" className="logo-icon" />
        </Link>
        <Link to="/perfil">
          <img src="/User.jpg" alt="Perfil" className="user-photo" />
        </Link>
      </header>
      <main>{children}</main>
      <nav className="navbar">
        <Link to="/home" className={`nav-icon ${path === '/home' ? 'active' : ''}`}>
          <i className="bi bi-house-door" />
          <span>Home</span>
        </Link>
        <Link to="/mapa" className={`nav-icon ${path === '/mapa' ? 'active' : ''}`}>
          <i className="bi bi-geo-alt" />
          <span>Mapa</span>
        </Link>
        <Link to="/encontrar-catadores" className={`nav-icon ${path === '/encontrar-catadores' ? 'active' : ''}`}>
          <i className="bi bi-search" />
          <span>Busca</span>
        </Link>
        <Link to="/reciclagem" className={`nav-icon ${path === '/reciclagem' ? 'active' : ''}`}>
          <i className="bi bi-recycle" />
          <span>Reciclagem</span>
        </Link>
        <Link to="/agendamento" className={`nav-icon ${path === '/agendamento' ? 'active' : ''}`}>
          <i className="bi bi-calendar3" />
          <span>Agenda</span>
        </Link>
      </nav>
    </div>
  );
}
