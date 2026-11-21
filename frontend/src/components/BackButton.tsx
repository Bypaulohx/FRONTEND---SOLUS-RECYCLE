import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BackButtonProps {
  to: string;
  label?: string;
}

export default function BackButton({ to, label = 'Voltar' }: BackButtonProps) {
  return (
    <Link to={to} className="back-btn" aria-label={label}>
      <ArrowLeft size={24} strokeWidth={2.5} />
    </Link>
  );
}
