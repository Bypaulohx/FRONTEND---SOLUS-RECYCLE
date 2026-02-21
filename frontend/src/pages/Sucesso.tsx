import { Link } from 'react-router-dom';

export default function Sucesso() {
  return (
    <div className="container success-container">
      <svg className="success-icon" width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" fill="#00C853"/>
        <path d="M50 10C72.913 10 92 29.087 92 52C92 74.913 72.913 94 50 94C27.087 94 8 74.913 8 52C8 29.087 27.087 10 50 10Z" fill="none" stroke="#00C853" strokeWidth="8"/>
        <path d="M35 52L45 62L65 42" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <h2>Tudo certo!<br />Sua senha foi alterada com sucesso!</h2>
      <Link to="/login" className="green-btn">Fazer login</Link>
    </div>
  );
}
