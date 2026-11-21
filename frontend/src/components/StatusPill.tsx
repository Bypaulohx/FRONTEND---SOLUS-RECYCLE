import type { AgendamentoDTO } from '../api/client';

const STATUS: Record<AgendamentoDTO['status'], { label: string; className: string }> = {
  PENDENTE: { label: 'Aguardando decisão', className: 'pending' },
  CONFIRMADO: { label: 'Agendada', className: 'confirmed' },
  CANCELADO: { label: 'Cancelada', className: 'cancelled' },
  CONCLUIDO: { label: 'Concluída', className: 'done' },
};

export default function StatusPill({ status }: { status: AgendamentoDTO['status'] }) {
  const item = STATUS[status] ?? STATUS.PENDENTE;
  return <span className={`ops-status ${item.className}`}>{item.label}</span>;
}
