/** Estado local das operações que ainda não possuem contrato no backend. */

import type { PrincipalType } from '../api/client';

export interface ChatMessage {
  id: string;
  from: 'me' | 'them';
  /** Quem escreveu a mensagem. Define o lado do balão em cada papel. */
  author?: PrincipalType;
  text: string;
  time: string;
}

export interface CreditEntry {
  id: number;
  points: number;
  material: string;
  date: string;
}

export interface MaterialLot {
  id: string;
  material: string;
  weightKg: number;
  origin: string;
  date: string;
  destination: string;
}

const KEYS = {
  credits: 'solus.credits.v1',
  history: 'solus.credit-history.v1',
  messages: 'solus.chat.v2',
  materials: 'solus.materials.v1',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const initialHistory: CreditEntry[] = [
  { id: 1042, points: 40, material: 'Papel', date: '12/11' },
  { id: 1038, points: 25, material: 'Vidro', date: '04/11' },
];

const initialMaterials: MaterialLot[] = [
  {
    id: 'L-2401',
    material: 'Papel e plástico',
    weightKg: 38.4,
    origin: 'Cooperativa Vitória',
    date: '18/11',
    destination: 'Recicladora Solar',
  },
  {
    id: 'L-2398',
    material: 'Vidro',
    weightKg: 22.7,
    origin: 'Ponto Verde',
    date: '16/11',
    destination: 'Vetro Reciclagem',
  },
];

const initialMessages: Record<string, ChatMessage[]> = {
  '1042': [
    { id: 'm1', from: 'them', text: 'Bom dia! Deixei os materiais na portaria.', time: '10:58' },
    { id: 'm2', from: 'me', text: 'Ótimo, obrigado! Vou confirmar o recebimento pelo QR.', time: '11:01' },
    { id: 'm3', from: 'them', text: 'Posso retirar até as 12h? Obrigada!', time: '11:04' },
  ],
};

export function getCredits(): number {
  const value = read<number | null>(KEYS.credits, null);
  return typeof value === 'number' ? value : 240;
}

export function getCreditHistory(): CreditEntry[] {
  return read<CreditEntry[]>(KEYS.history, initialHistory);
}

export function addCollectionCredit(points: number, material: string, id: number): void {
  write(KEYS.credits, getCredits() + points);
  const history = getCreditHistory();
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  write(KEYS.history, [
    { id, points, material, date },
    ...history.filter((item) => item.id !== id),
  ]);
}

export function getMessages(collectionId: number): ChatMessage[] {
  return read<Record<string, ChatMessage[]>>(KEYS.messages, initialMessages)[String(collectionId)] ?? [];
}

export function sendMessage(collectionId: number, text: string, author: PrincipalType = 'USER'): ChatMessage[] {
  const all = read<Record<string, ChatMessage[]>>(KEYS.messages, initialMessages);
  const message: ChatMessage = {
    id: `${Date.now()}`,
    from: 'me',
    author,
    text,
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
  const next = [...(all[String(collectionId)] ?? []), message];
  write(KEYS.messages, { ...all, [String(collectionId)]: next });
  return next;
}

export function getMaterialLots(): MaterialLot[] {
  return read<MaterialLot[]>(KEYS.materials, initialMaterials);
}

export function addMaterialLot(lot: MaterialLot): void {
  write(KEYS.materials, [lot, ...getMaterialLots().filter((item) => item.id !== lot.id)]);
}

export function creditInReais(points: number): string {
  return (points / 20).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function pointsForWeight(weightKg?: number | null): number {
  if (!weightKg || weightKg <= 0) return 30;
  return Math.max(10, Math.round(weightKg * 6));
}
