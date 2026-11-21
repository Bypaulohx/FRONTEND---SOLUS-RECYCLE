/** Abre um seletor de aplicativos de navegação com a rota até o destino. */

export interface NavigationTarget {
  endereco: string;
  latitude?: number | null;
  longitude?: number | null;
  label?: string;
}

function destino(target: NavigationTarget): string {
  if (target.latitude != null && target.longitude != null) {
    return `${target.latitude},${target.longitude}`;
  }
  return target.endereco;
}

export function abrirNavegacao(target: NavigationTarget): void {
  const dest = encodeURIComponent(destino(target));
  const label = encodeURIComponent(target.label ?? 'Local da coleta');
  const opcoes = [
    {
      nome: 'Google Maps',
      url: `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`,
    },
    { nome: 'Waze', url: `https://www.waze.com/ul?ll=${dest}&navigate=yes` },
    { nome: 'Apple Maps', url: `https://maps.apple.com/?daddr=${dest}&dirflg=d&q=${label}` },
  ];

  if (opcoes.length === 1) {
    window.open(opcoes[0].url, '_blank', 'noopener,noreferrer');
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'presentation');
  const card = document.createElement('div');
  card.className = 'modal-card nav-selector';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-label', 'Escolher aplicativo de navegação');
  const titulo = document.createElement('h2');
  titulo.className = 'section-title';
  titulo.textContent = 'Abrir rota em';
  card.appendChild(titulo);
  const subtitulo = document.createElement('p');
  subtitulo.className = 'modal-warning';
  subtitulo.textContent = target.endereco || 'Destino da coleta';
  card.appendChild(subtitulo);

  function fechar() {
    overlay.remove();
  }
  overlay.addEventListener('click', fechar);

  opcoes.forEach((opcao) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'green-btn full spaced-top';
    botao.textContent = opcao.nome;
    botao.addEventListener('click', (event) => {
      event.stopPropagation();
      window.open(opcao.url, '_blank', 'noopener,noreferrer');
      fechar();
    });
    card.appendChild(botao);
  });
  const cancelar = document.createElement('button');
  cancelar.type = 'button';
  cancelar.className = 'green-btn outline-btn full spaced-top';
  cancelar.textContent = 'Cancelar';
  cancelar.addEventListener('click', (event) => {
    event.stopPropagation();
    fechar();
  });
  card.appendChild(cancelar);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
}
