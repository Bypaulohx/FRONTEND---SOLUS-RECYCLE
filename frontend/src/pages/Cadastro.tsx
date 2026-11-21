import { useState } from 'react';
import { ArrowLeft, Building2, Check, LoaderCircle, MapPin, Recycle, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import PasswordField from '../components/PasswordField';
import SocialButtons from '../components/SocialButtons';
import { authApi, solusApi } from '../api/client';
import { digits, documentKind, formatCep, formatDocument, formatPhone } from '../utils/format';

type TipoCadastro = 'comunidade' | 'organizacao';

const materiaisDisponiveis = [
  'Papel',
  'Plástico',
  'Vidro',
  'Metal',
  'Eletrônicos',
  'Orgânico',
];

export default function Cadastro() {
  const [tipo, setTipo] = useState<TipoCadastro | null>(null);
  const [nome, setNome] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [email, setEmail] = useState('');
  const [documento, setDocumento] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [fazColetaDomicilio, setFazColetaDomicilio] = useState(false);
  const [materiais, setMateriais] = useState<string[]>([]);
  const [pesoMin, setPesoMin] = useState('');
  const [pesoMax, setPesoMax] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function buscarCep() {
    if (digits(cep, 8).length !== 8 || cepLoading) return;
    setCepLoading(true);
    const { data } = await solusApi.cep(cep);
    setCepLoading(false);
    if (!data) return;
    setCep(formatCep(data.cep));
    setRua(data.rua ?? rua);
    setBairro(data.bairro ?? bairro);
    setCidade(data.cidade ?? cidade);
    setEstado(data.estado ?? estado);
  }

  function alternarMaterial(material: string) {
    setMateriais((atual) =>
      atual.includes(material)
        ? atual.filter((item) => item !== material)
        : [...atual, material]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (senha !== confirmaSenha) {
      setError('As senhas não coincidem.');
      return;
    }
    if (senha.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (![11, 14].includes(digits(documento, 14).length)) {
      setError('Informe um CPF (000.000.000-00) ou CNPJ (00.000.000/0001-00) válido.');
      return;
    }
    if (tipo === 'organizacao' && materiais.length === 0) {
      setError('Selecione ao menos um material que a organização recebe.');
      return;
    }

    const endereco = {
      cep: digits(cep, 8),
      rua: rua.trim(),
      numero: numero.trim(),
      complemento: complemento.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      estado: estado.trim(),
    };
    const documentoLimpo = digits(documento, 14);

    setLoading(true);
    const resultado =
      tipo === 'comunidade'
        ? await authApi.registerUser({
            nome: nome.trim(),
            cpf: documentoLimpo,
            email: email.trim(),
            senha,
            telefone: digits(telefone, 11),
            endereco,
          })
        : await authApi.registerCompany({
            nomeFantasia: nomeFantasia.trim() || razaoSocial.trim(),
            razaoSocial: razaoSocial.trim() || nomeFantasia.trim(),
            cnpj: documentoLimpo,
            email: email.trim(),
            senha,
            telefone: digits(telefone, 11),
            tipoResiduo: materiais.join(', '),
            materiaisColeta: materiais.join(', '),
            fazColetaDomicilio,
            pesoMinimoKg: pesoMin ? Number(pesoMin) : null,
            pesoMaximoKg: pesoMax ? Number(pesoMax) : null,
            endereco,
          });
    setLoading(false);

    if (resultado.error) {
      setError(resultado.error);
      return;
    }
    navigate('/verificacao', { state: { email: email.trim(), mode: 'register' } });
  }

  if (!tipo) {
    return (
      <div className="container form-container">
        <BackButton to="/" />
        <h2 className="auth-title">Olá!<br />Vamos começar?</h2>
        <p className="page-text">
          Escolha como você quer usar a Solus Recycle. Você poderá informar CPF ou CNPJ
          em qualquer uma das opções.
        </p>
        <div className="type-cards">
          <button type="button" className="type-card" onClick={() => setTipo('comunidade')}>
            <span className="type-card-icon"><Users size={30} /></span>
            <span className="type-card-title">Comunidade</span>
            <span className="type-card-desc">
              Descarte seus resíduos e encontre pontos de coleta perto de você.
            </span>
          </button>
          <button type="button" className="type-card" onClick={() => setTipo('organizacao')}>
            <span className="type-card-icon"><Building2 size={30} /></span>
            <span className="type-card-title">Organizações Sociais</span>
            <span className="type-card-desc">
              Cadastre sua organização, seus materiais e seus pontos de coleta no mapa.
            </span>
          </button>
        </div>
        <p className="auth-footer">
          Já tem uma conta? <Link to="/login" className="register-link">Faça seu login</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container form-container">
      <button type="button" className="step-back" onClick={() => setTipo(null)}>
        <ArrowLeft size={18} /> Quem é você
      </button>
      <h2 className="auth-title">
        {tipo === 'comunidade' ? 'Cadastro da comunidade' : 'Cadastro da organização'}
      </h2>
      <p className="page-text">
        {tipo === 'comunidade'
          ? 'Informe seus dados para encontrar pontos de coleta.'
          : 'Conte sobre sua organização para publicar seus pontos no mapa.'}
      </p>

      <form className="form" onSubmit={handleSubmit}>
        {tipo === 'organizacao' ? (
          <>
            <input
              type="text"
              placeholder="Nome fantasia"
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Razão social"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              required
            />
          </>
        ) : (
          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        )}

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder={documentKind(documento) === 'cnpj' ? '00.000.000/0001-00 (CNPJ)' : '000.000.000-00 (CPF ou CNPJ)'}
          value={formatDocument(documento)}
          onChange={(e) => setDocumento(e.target.value)}
          aria-label="CPF ou CNPJ"
          required
        />
        <PasswordField
          placeholder="Senha"
          value={senha}
          onChange={setSenha}
          autoComplete="new-password"
          minLength={8}
          aria-label="Senha"
        />
        <PasswordField
          placeholder="Confirme a senha"
          value={confirmaSenha}
          onChange={setConfirmaSenha}
          autoComplete="new-password"
          aria-label="Confirme a senha"
        />
        <input
          type="tel"
          placeholder="Telefone para contato"
          value={telefone}
          onChange={(e) => setTelefone(formatPhone(e.target.value))}
          required
        />

        <p className="form-section-title"><MapPin size={16} /> Endereço</p>
        <div className="cep-row">
          <input
            type="text"
            inputMode="numeric"
            placeholder="CEP"
            value={cep}
            onChange={(e) => setCep(formatCep(e.target.value))}
            onBlur={() => void buscarCep()}
            aria-label="CEP"
            required
          />
          <button type="button" className="cep-search" onClick={() => void buscarCep()} disabled={cepLoading}>
            {cepLoading ? <LoaderCircle size={20} className="spin" /> : 'Buscar'}
          </button>
        </div>
        <input type="text" placeholder="Rua / Avenida" value={rua} onChange={(e) => setRua(e.target.value)} required />
        <div className="address-row">
          <input type="text" placeholder="Número" value={numero} onChange={(e) => setNumero(e.target.value)} required />
          <input type="text" placeholder="Complemento" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
        </div>
        <input type="text" placeholder="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
        <div className="address-row">
          <input type="text" placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          <input type="text" placeholder="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} maxLength={2} />
        </div>

        {tipo === 'organizacao' && (
          <>
            <p className="form-section-title"><Recycle size={16} /> Coleta e materiais</p>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={fazColetaDomicilio}
                onChange={(e) => setFazColetaDomicilio(e.target.checked)}
              />
              Faz coleta em domicílio
            </label>
            <div className="materials-grid">
              {materiaisDisponiveis.map((material) => {
                const selecionado = materiais.includes(material);
                return (
                  <button
                    key={material}
                    type="button"
                    className={`material-chip ${selecionado ? 'active' : ''}`}
                    onClick={() => alternarMaterial(material)}
                    aria-pressed={selecionado}
                  >
                    {selecionado && <Check size={14} />}
                    {material}
                  </button>
                );
              })}
            </div>
            <div className="address-row">
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Mín. kg por coleta"
                value={pesoMin}
                onChange={(e) => setPesoMin(e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Máx. kg por coleta"
                value={pesoMax}
                onChange={(e) => setPesoMax(e.target.value)}
              />
            </div>
          </>
        )}

        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Avançar'}
        </button>
      </form>

      <p className="social-divider">Ou cadastre-se com</p>
      <SocialButtons mode="register" />

      <p className="auth-footer">
        Já tem uma conta? <Link to="/login" className="register-link">Faça seu login</Link>
      </p>
    </div>
  );
}
