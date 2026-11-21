import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import type { PrincipalType } from './api/client';
import Index from './pages/Index';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Cadastro from './pages/Cadastro';
import Recuperacao from './pages/Recuperacao';
import Verificacao from './pages/Verificacao';
import NovaSenha from './pages/NovaSenha';
import Sucesso from './pages/Sucesso';
import Home from './pages/Home';
import Mapa from './pages/Mapa';
import Agendamento from './pages/Agendamento';
import Reciclagem from './pages/Reciclagem';
import ConfirmacaoAgendamento from './pages/ConfirmacaoAgendamento';
import Perfil from './pages/Perfil';
import Notificacoes from './pages/Notificacoes';
import MeusDados from './pages/MeusDados';
import Ajuda from './pages/Ajuda';
import DetalhesPonto from './pages/DetalhesPonto';
import ConfirmacaoCancelamento from './pages/ConfirmacaoCancelamento';
import DashboardEmpresa from './pages/DashboardEmpresa';
import MapaEmpresa from './pages/MapaEmpresa';
import AgendaEmpresa from './pages/AgendaEmpresa';
import EscanearQr from './pages/EscanearQr';
import MateriaisEmpresa from './pages/MateriaisEmpresa';
import Conversas from './pages/Conversas';
import QrCodeUsuario from './pages/QrCodeUsuario';
import Recompensas from './pages/Recompensas';

interface GuardProps {
  children: React.ReactNode;
}

function PrivateRoute({ children }: GuardProps) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({ children, allow, redirect }: GuardProps & { allow: PrincipalType; redirect: string }) {
  const { token, role } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (role && role !== allow) return <Navigate to={redirect} replace />;
  return <>{children}</>;
}

function HomePorPapel() {
  const { role } = useAuth();
  return role === 'COMPANY' ? <Navigate to="/dashboard-empresa" replace /> : <Home />;
}

function MapaPorPapel() {
  const { role } = useAuth();
  return role === 'COMPANY' ? <Navigate to="/mapa-empresa" replace /> : <Mapa />;
}

function AgendaPorPapel() {
  const { role } = useAuth();
  return role === 'COMPANY' ? <Navigate to="/agenda-empresa" replace /> : <Agendamento />;
}

function ReciclagemPorPapel() {
  const { role } = useAuth();
  return role === 'COMPANY' ? <Navigate to="/materiais-empresa" replace /> : <Reciclagem />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/oauth/callback" element={<AuthCallback />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/recuperacao" element={<Recuperacao />} />
      <Route path="/verificacao" element={<Verificacao />} />
      <Route path="/nova-senha" element={<NovaSenha />} />
      <Route path="/sucesso" element={<Sucesso />} />

      <Route path="/home" element={<PrivateRoute><HomePorPapel /></PrivateRoute>} />
      <Route path="/mapa" element={<PrivateRoute><MapaPorPapel /></PrivateRoute>} />
      <Route path="/agendamento" element={<PrivateRoute><AgendaPorPapel /></PrivateRoute>} />
      <Route path="/reciclagem" element={<PrivateRoute><ReciclagemPorPapel /></PrivateRoute>} />
      <Route path="/encontrar-catadores" element={<Navigate to="/mapa" replace />} />
      <Route path="/confirmacao-agendamento" element={<PrivateRoute><ConfirmacaoAgendamento /></PrivateRoute>} />
      <Route path="/confirmacao-cancelamento" element={<PrivateRoute><ConfirmacaoCancelamento /></PrivateRoute>} />
      <Route path="/detalhes-ponto" element={<PrivateRoute><DetalhesPonto /></PrivateRoute>} />
      <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
      <Route path="/notificacoes" element={<PrivateRoute><Notificacoes /></PrivateRoute>} />
      <Route path="/meus-dados" element={<PrivateRoute><MeusDados /></PrivateRoute>} />
      <Route path="/ajuda" element={<PrivateRoute><Ajuda /></PrivateRoute>} />

      <Route path="/conversas" element={<PrivateRoute><Conversas /></PrivateRoute>} />
      <Route path="/recompensas" element={<RoleRoute allow="USER" redirect="/home"><Recompensas /></RoleRoute>} />
      <Route path="/qr-code" element={<RoleRoute allow="USER" redirect="/home"><QrCodeUsuario /></RoleRoute>} />

      <Route path="/dashboard-empresa" element={<RoleRoute allow="COMPANY" redirect="/home"><DashboardEmpresa /></RoleRoute>} />
      <Route path="/mapa-empresa" element={<RoleRoute allow="COMPANY" redirect="/home"><MapaEmpresa /></RoleRoute>} />
      <Route path="/agenda-empresa" element={<RoleRoute allow="COMPANY" redirect="/home"><AgendaEmpresa /></RoleRoute>} />
      <Route path="/escanear-qr" element={<RoleRoute allow="COMPANY" redirect="/home"><EscanearQr /></RoleRoute>} />
      <Route path="/materiais-empresa" element={<RoleRoute allow="COMPANY" redirect="/home"><MateriaisEmpresa /></RoleRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
