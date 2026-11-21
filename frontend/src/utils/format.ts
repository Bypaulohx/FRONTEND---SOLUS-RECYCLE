/** Máscaras progressivas para documentos, CEP e telefone (Solus Recycle). */

export function digits(value: string, max = 14): string {
  return value.replace(/\D/g, '').slice(0, max);
}

export function documentKind(value: string): 'cpf' | 'cnpj' {
  return digits(value).length > 11 ? 'cnpj' : 'cpf';
}

/** Formata automaticamente CPF (000.000.000-00) ou CNPJ (00.000.000/0001-00). */
export function formatDocument(value: string): string {
  const d = digits(value, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
}

export function formatCep(value: string): string {
  const d = digits(value, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function formatPhone(value: string): string {
  const d = digits(value, 11);
  if (d.length > 10) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length > 0) return `(${d}`;
  return '';
}
