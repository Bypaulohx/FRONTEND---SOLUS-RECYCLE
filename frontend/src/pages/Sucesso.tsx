import { CircleCheckBig } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sucesso() {
  return (
    <div className="success-container">
      <CircleCheckBig className="success-icon" size={96} strokeWidth={1.8} aria-hidden="true" />
      <h2>Tudo certo!<br />Sua senha foi alterada com sucesso!</h2>
      <Link to="/login" className="green-btn">Fazer login</Link>
    </div>
  );
}
