import { CalendarDays, House, MapPin, MessageCircle, Recycle, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const navUsuario = [
  { to: '/home', label: 'Início', icon: House },
  { to: '/mapa', label: 'Mapa', icon: MapPin },
  { to: '/conversas', label: 'Conversas', icon: MessageCircle },
  { to: '/recompensas', label: 'Reciclagem', icon: Recycle },
  { to: '/agendamento', label: 'Agenda', icon: CalendarDays },
];

const navEmpresa = [
  { to: '/dashboard-empresa', label: 'Início', icon: House },
  { to: '/mapa-empresa', label: 'Mapa', icon: MapPin },
  { to: '/conversas', label: 'Conversas', icon: MessageCircle },
  { to: '/materiais-empresa', label: 'Reciclagem', icon: Recycle },
  { to: '/agenda-empresa', label: 'Agenda', icon: CalendarDays },
];

function estaAtivo(path: string, to: string, empresa: boolean): boolean {
  if (path === to) return true;
  if (to === '/conversas') return path.startsWith('/conversas');
  if (empresa) {
    if (to === '/dashboard-empresa') return path === '/home';
    if (to === '/agenda-empresa') return path === '/agendamento' || path.startsWith('/escanear-qr');
  } else {
    if (to === '/agendamento') return path.startsWith('/confirmacao-agendamento') || path === '/qr-code' || path.startsWith('/confirmacao-cancelamento');
    if (to === '/recompensas') return path === '/reciclagem';
  }
  return false;
}

export default function Layout({ children }: LayoutProps) {
  const path = useLocation().pathname;
  const { user, role } = useAuth();
  const empresa = role === 'COMPANY';
  const navItems = empresa ? navEmpresa : navUsuario;
  const inicio = empresa ? '/dashboard-empresa' : '/home';

  return (
    <div className="app-layout">
      <header className="header">
        <Link to={inicio} aria-label="Solus Recycle — início">
          <img src="/brand/solus-logo.svg" alt="Solus Recycle" className="logo-wordmark" />
        </Link>
        <Link to="/perfil" className="user-photo" aria-label="Meu perfil">
          {(user?.nome ?? user?.nomeFantasia) ? (
            <span className="user-initial">{(user?.nome ?? user?.nomeFantasia ?? '').charAt(0).toUpperCase()}</span>
          ) : (
            <UserRound size={22} strokeWidth={2} />
          )}
        </Link>
      </header>
      <main className="app-main">{children}</main>
      <nav className="navbar" aria-label="Navegação principal">
        {navItems.map(({ to, label, icon: Icon }) => {
          const ativo = estaAtivo(path, to, empresa);
          return (
            <Link
              key={to}
              to={to}
              className={`nav-icon ${ativo ? 'active' : ''}`}
              aria-current={ativo ? 'page' : undefined}
            >
              <Icon size={23} strokeWidth={ativo ? 2.4 : 1.9} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
