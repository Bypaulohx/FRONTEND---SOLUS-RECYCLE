import { Link } from 'react-router-dom';

export default function Index() {
  return (
    <div className="start-screen">
      <img
        src="/assets/Layer_2.png"
        alt="Ilustração de reciclagem Solus Recycle"
        className="start-illustration"
      />
      <img src="/brand/solus-logo.svg" alt="Solus Recycle" className="start-logo" />
      <div className="start-buttons">
        <Link to="/login" className="enter-btn">Entrar</Link>
        <Link to="/cadastro?from=index" className="register-btn">Quero me cadastrar</Link>
      </div>
    </div>
  );
}
