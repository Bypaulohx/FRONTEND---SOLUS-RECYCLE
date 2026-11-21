/** Consulta de feriados na BrasilAPI (sem chave) para o cadastro da organização. */

export interface Feriado {
  data: string;
  motivo: string;
  tipo: 'nacional' | 'estadual' | 'municipal';
}

interface BrasilApiFeriado {
  date?: string;
  name?: string;
  nome?: string;
}

export async function buscarFeriados(ano: number, uf?: string, municipio?: string): Promise<Feriado[]> {
  const resultados: Feriado[] = [];
  const consultar = async (url: string, tipo: Feriado['tipo']) => {
    try {
      const resposta = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!resposta.ok) return;
      const dados = (await resposta.json()) as BrasilApiFeriado[];
      dados.forEach((item) => {
        const data = item.date;
        const motivo = item.name ?? item.nome;
        if (data && motivo && !resultados.some((feriado) => feriado.data === data)) {
          resultados.push({ data, motivo, tipo });
        }
      });
    } catch {
      // API indisponível: mantém apenas os feriados já carregados.
    }
  };

  await consultar(`https://brasilapi.com.br/api/feriados/v1/${ano}`, 'nacional');
  const params = new URLSearchParams();
  if (uf) params.set('uf', uf);
  if (municipio) params.set('municipio', municipio);
  await consultar(
    `https://brasilapi.com.br/api/feriados/v1/${ano}?${params.toString()}`,
    'estadual'
  );
  return resultados.sort((a, b) => a.data.localeCompare(b.data));
}
