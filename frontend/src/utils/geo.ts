/** Geocodificação e filtros geográficos usados no mapa do usuário. */
import type { FuncionamentoDTO } from '../api/client';

export type Coordenada = [number, number];

interface NominatimItem {
  lat: string;
  lon: string;
  display_name?: string;
}

export interface EnderecoLocalizado {
  latitude: number;
  longitude: number;
  descricao: string;
}

/** Busca rua ou bairro no Brasil usando Nominatim (OpenStreetMap). */
export async function geocodificar(texto: string, signal?: AbortSignal): Promise<EnderecoLocalizado | null> {
  const params = new URLSearchParams({
    q: texto.trim(),
    format: 'jsonv2',
    addressdetails: '1',
    limit: '1',
    countrycodes: 'br',
    'accept-language': 'pt-BR',
  });
  const resposta = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!resposta.ok) return null;
  const itens = (await resposta.json()) as NominatimItem[];
  if (!itens.length) return null;
  const latitude = Number(itens[0].lat);
  const longitude = Number(itens[0].lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    latitude,
    longitude,
    descricao: itens[0].display_name?.split(',').slice(0, 3).join(', ').trim() ?? texto.trim(),
  };
}

/** Distância aproximada em km pela fórmula de Haversine. */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const raio = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const seno =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * raio * Math.asin(Math.min(1, Math.sqrt(seno)));
}

const DIAS: Array<{ chave: string; rotulo: string }> = [
  { chave: 'dom', rotulo: 'dom' },
  { chave: 'seg', rotulo: 'seg' },
  { chave: 'ter', rotulo: 'ter' },
  { chave: 'qua', rotulo: 'qua' },
  { chave: 'qui', rotulo: 'qui' },
  { chave: 'sex', rotulo: 'sex' },
  { chave: 'sab', rotulo: 'sab' },
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9a\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function diaAberto(diaSemana: string, hoje: Date): boolean {
  const texto = normalizar(diaSemana);
  if (!texto || texto.includes('todos os dias') || texto.includes('diario')) return true;
  const atual = DIAS[hoje.getDay()].chave;
  if (texto.includes('seg a sex') || texto.includes('segunda a sexta') || texto.includes('seg-sex')) {
    return atual !== 'dom' && atual !== 'sab';
  }
  if (texto.includes('fim de semana')) return atual === 'sab' || atual === 'dom';
  return DIAS.some((dia) => texto.includes(dia.rotulo) && dia.chave === atual);
}

function horaDentro(abertura: string | null | undefined, fechamento: string | null | undefined, agora: number): boolean {
  const paraMinutos = (valor: string | null | undefined): number | null => {
    const correspondencia = valor?.match(/(\d{1,2})\s*:?\s*(\d{2})/);
    if (!correspondencia) return null;
    return Number(correspondencia[1]) * 60 + Number(correspondencia[2]);
  };
  const inicio = paraMinutos(abertura);
  const fim = paraMinutos(fechamento);
  if (inicio === null || fim === null) return true;
  return agora >= inicio && agora <= fim;
}

/** Verifica se ao menos um horário cadastrado está aberto agora. Sem horários, não filtra. */
export function abertoAgora(funcionamento: FuncionamentoDTO[] | null | undefined, agora = new Date()): boolean {
  const itens = funcionamento ?? [];
  if (!itens.length) return true;
  const minutos = agora.getHours() * 60 + agora.getMinutes();
  return itens.some(
    (item) =>
      diaAberto(item.diaSemana ?? '', agora) &&
      horaDentro(item.horarioAbertura, item.horarioFechamento, minutos)
  );
}

export function rotuloFuncionamento(funcionamento: FuncionamentoDTO[] | null | undefined): string {
  const itens = funcionamento ?? [];
  if (!itens.length) return 'Horário não informado';
  return itens
    .map((item) => {
      const abertura = item.horarioAbertura ?? '';
      const fechamento = item.horarioFechamento ?? '';
      return `${item.diaSemana ?? ''}${abertura ? ` ${abertura}${fechamento ? ` às ${fechamento}` : ''}` : ''}`.trim();
    })
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ');
}
