import { useState } from 'react';
import { Bell, CircleHelp, LogOut, Trash2, UserRound, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { authApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Perfil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [modalAberto, setModalAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState('');

  function handleSair() {
    logout();
    navigate('/');
  }

  async function handleExcluir() {
    setExcluindo(true);
    setErro('');
    const { error } = await authApi.deleteAccount();
    setExcluindo(false);
    if (error) {
      setErro(error);
      return;
    }
    logout();
    navigate('/');
  }

  return (
    <Layout>
      <div className="content-container">
        <div className="user-name">{user?.nome ?? 'Usuário'}</div>
        <ul className="menu-list">
          <li>
            <Link to="/meus-dados" className="menu-item">
              <UserRound size={20} /> Meus dados
            </Link>
          </li>
          <li>
            <Link to="/notificacoes" className="menu-item">
              <Bell size={20} /> Notificações
            </Link>
          </li>
          <li>
            <Link to="/ajuda" className="menu-item">
              <CircleHelp size={20} /> Ajuda
            </Link>
          </li>
          <li>
            <button type="button" onClick={() => setModalAberto(true)} className="menu-item">
              <LogOut size={20} /> Sair
            </button>
          </li>
        </ul>
      </div>

      {modalAberto && (
        <div className="modal-overlay" role="presentation" onClick={() => setModalAberto(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-label="Sair da conta" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setModalAberto(false)} aria-label="Fechar">
              <X size={18} />
            </button>
            <h2 className="section-title">Sair da conta</h2>
            <p className="modal-warning">
              Ao excluir sua conta, seus dados são removidos. Se quiser voltar depois, será necessário criar um novo cadastro.
            </p>
            {erro && <p className="form-error">{erro}</p>}
            <button type="button" className="green-btn full" onClick={handleSair}>
              <LogOut size={17} /> Sair
            </button>
            <button type="button" className="green-btn danger-btn full spaced-top" onClick={handleExcluir} disabled={excluindo}>
              <Trash2 size={17} /> {excluindo ? 'Excluindo...' : 'Excluir conta'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
