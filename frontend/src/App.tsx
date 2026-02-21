import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Index from './pages/Index';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Recuperacao from './pages/Recuperacao';
import Verificacao from './pages/Verificacao';
import NovaSenha from './pages/NovaSenha';
import Sucesso from './pages/Sucesso';
import Home from './pages/Home';
import Mapa from './pages/Mapa';
import Agendamento from './pages/Agendamento';
import Reciclagem from './pages/Reciclagem';
import EncontrarCatadores from './pages/EncontrarCatadores';
import ConfirmacaoAgendamento from './pages/ConfirmacaoAgendamento';
import Perfil from './pages/Perfil';
import Notificacoes from './pages/Notificacoes';
import MeusDados from './pages/MeusDados';
import Ajuda from './pages/Ajuda';
import DetalhesPonto from './pages/DetalhesPonto';
import ConfirmacaoCancelamento from './pages/ConfirmacaoCancelamento';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/recuperacao" element={<Recuperacao />} />
      <Route path="/verificacao" element={<Verificacao />} />
      <Route path="/nova-senha" element={<NovaSenha />} />
      <Route path="/sucesso" element={<Sucesso />} />
      <Route
        path="/home"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/mapa"
        element={
          <PrivateRoute>
            <Mapa />
          </PrivateRoute>
        }
      />
      <Route
        path="/agendamento"
        element={
          <PrivateRoute>
            <Agendamento />
          </PrivateRoute>
        }
      />
      <Route
        path="/reciclagem"
        element={
          <PrivateRoute>
            <Reciclagem />
          </PrivateRoute>
        }
      />
      <Route
        path="/encontrar-catadores"
        element={
          <PrivateRoute>
            <EncontrarCatadores />
          </PrivateRoute>
        }
      />
      <Route
        path="/confirmacao-agendamento"
        element={
          <PrivateRoute>
            <ConfirmacaoAgendamento />
          </PrivateRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <PrivateRoute>
            <Perfil />
          </PrivateRoute>
        }
      />
      <Route
        path="/notificacoes"
        element={
          <PrivateRoute>
            <Notificacoes />
          </PrivateRoute>
        }
      />
      <Route
        path="/meus-dados"
        element={
          <PrivateRoute>
            <MeusDados />
          </PrivateRoute>
        }
      />
      <Route
        path="/ajuda"
        element={
          <PrivateRoute>
            <Ajuda />
          </PrivateRoute>
        }
      />
      <Route
        path="/detalhes-ponto"
        element={
          <PrivateRoute>
            <DetalhesPonto />
          </PrivateRoute>
        }
      />
      <Route
        path="/confirmacao-cancelamento"
        element={
          <PrivateRoute>
            <ConfirmacaoCancelamento />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
