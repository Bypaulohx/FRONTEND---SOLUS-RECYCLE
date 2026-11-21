import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface PasswordFieldProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  name?: string;
  'aria-label'?: string;
}

export default function PasswordField({
  placeholder,
  value,
  onChange,
  autoComplete = 'current-password',
  minLength,
  required = true,
  name,
  'aria-label': ariaLabel,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-container">
      <input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        name={name}
        aria-label={ariaLabel ?? placeholder}
      />
      <button
        type="button"
        className="toggle-password"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? `Ocultar ${placeholder}` : `Mostrar ${placeholder}`}
        aria-pressed={visible}
        title={visible ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {visible ? <EyeOff size={21} /> : <Eye size={21} />}
      </button>
    </div>
  );
}
