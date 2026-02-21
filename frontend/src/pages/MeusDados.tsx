import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

interface PerfilDados {
  endereco: string;
  latitude: number;
  longitude: number;
  horarios_regulares?: Array<{ dia: string; horarios: Array<{ abre: string; fecha: string }> }>;
  horarios_feriados?: Array<{ abre: string; fecha: string; feriadoNome: string; dataEspecial: string }>;
  datas_especiais?: Array<{ data: string; nome: string; abre: string; fecha: string }>;
  reciclagem?: {
    tipos: string[];
    quantidades: string[];
    meios: string[];
  };
}

export default function MeusDados() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<PerfilDados | null>(null);

  useEffect(() => {
    const perfilPendente = localStorage.getItem('perfil_pendente');
    if (perfilPendente) {
      setPerfil(JSON.parse(perfilPendente));
    }
  }, []);

  return (
    <Layout>
      <div className="content-container">
        <Link to="/perfil" className="back-btn">
          ←
        </Link>
        <h2 className="section-title" style={{ fontSize: 20, marginTop: 30, marginBottom: 20 }}>
          Meus dados
        </h2>
        <ul className="data-list" style={{ listStyle: 'none', padding: 0 }}>
          <li className="data-item" style={{ padding: '15px 0' }}>
            <span className="data-label" style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
              Nome
            </span>
            <div className="data-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', borderRadius: 5, padding: 10 }}>
              <span className="data-value">{user?.nome ?? '-'}</span>
              <i className="bi bi-pencil edit-icon" style={{ color: '#00C853', cursor: 'pointer' }} />
            </div>
          </li>
          <li className="data-item" style={{ padding: '15px 0' }}>
            <span className="data-label" style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
              E-mail
            </span>
            <div className="data-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', borderRadius: 5, padding: 10 }}>
              <span className="data-value">{user?.email ?? '-'}</span>
            </div>
          </li>
          <li className="data-item" style={{ padding: '15px 0' }}>
            <span className="data-label" style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
              Telefone
            </span>
            <div className="data-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', borderRadius: 5, padding: 10 }}>
              <span className="data-value">{user?.telefone ?? '-'}</span>
              <i className="bi bi-pencil edit-icon" style={{ color: '#00C853', cursor: 'pointer' }} />
            </div>
          </li>
          <li className="data-item" style={{ padding: '15px 0' }}>
            <span className="data-label" style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
              Endereço
            </span>
            <div className="data-card" style={{ background: '#f9f9f9', borderRadius: 5, padding: 10 }}>
              <span className="data-value">
                CEP {user?.cep ?? '-'} - Nº {user?.numero ?? '-'} {user?.complemento ?? ''}
              </span>
              {perfil?.endereco && <p style={{ fontSize: 12, color: '#999', marginTop: 5 }}>{perfil.endereco}</p>}
              <i className="bi bi-pencil edit-icon" style={{ color: '#00C853', cursor: 'pointer', marginTop: 5 }} />
            </div>
          </li>

          {/* Reciclagem */}
          {perfil?.reciclagem && (
            <>
              <li className="data-item" style={{ padding: '15px 0' }}>
                <span className="data-label" style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
                  O que Recicla?
                </span>
                <div className="data-card" style={{ background: '#f9f9f9', borderRadius: 5, padding: 10 }}>
                  <span className="data-value">
                    {perfil.reciclagem.tipos.length > 0 ? perfil.reciclagem.tipos.join(', ') : '-'}
                  </span>
                </div>
              </li>
              <li className="data-item" style={{ padding: '15px 0' }}>
                <span className="data-label" style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
                  Quantidade de Quilos
                </span>
                <div className="data-card" style={{ background: '#f9f9f9', borderRadius: 5, padding: 10 }}>
                  <span className="data-value">
                    {perfil.reciclagem.quantidades.length > 0 ? perfil.reciclagem.quantidades.join(', ') : '-'}
                  </span>
                </div>
              </li>
              <li className="data-item" style={{ padding: '15px 0' }}>
                <span className="data-label" style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
                  Meios de Coleta
                </span>
                <div className="data-card" style={{ background: '#f9f9f9', borderRadius: 5, padding: 10 }}>
                  <span className="data-value">
                    {perfil.reciclagem.meios.length > 0 ? perfil.reciclagem.meios.join(', ') : '-'}
                  </span>
                </div>
              </li>
            </>
          )}

          {/* Horários Regulares */}
          {perfil?.horarios_regulares && perfil.horarios_regulares.length > 0 && (
            <li className="data-item" style={{ padding: '15px 0' }}>
              <span className="data-label" style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
                Horários Regulares
              </span>
              <div className="data-card" style={{ background: '#f9f9f9', borderRadius: 5, padding: 10 }}>
                {perfil.horarios_regulares.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: 10 }}>
                    <strong>{item.dia}:</strong>
                    {item.horarios.map((h, hIdx) => (
                      <span key={hIdx} style={{ display: 'block', fontSize: 12, color: '#555' }}>
                        {h.abre} - {h.fecha}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </li>
          )}
        </ul>
      </div>
    </Layout>
  );
}
