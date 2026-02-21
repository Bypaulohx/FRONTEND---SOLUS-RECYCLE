import { Link } from 'react-router-dom';

export default function Index() {
  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="illustration" style={{ width: '100%', height: '40vh', marginBottom: 20 }}>
        <img src="/Layer_2.png" alt="" className="illustration-img" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <div className="logo" style={{ marginBottom: 40 }}>
        <img src="/LOGO SOLUS.svg" alt="Solus Recycle" className="logo-icon" style={{ width: 278, maxWidth: '100%', height: 78 }} />
      </div>
      <div className="buttons" style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 15 }}>
        <Link to="/login" className="enter-btn">Entrar</Link>
        <Link to="/cadastro?from=index" className="register-btn">Quero me cadastrar</Link>
      </div>
    </div>
  );
}
