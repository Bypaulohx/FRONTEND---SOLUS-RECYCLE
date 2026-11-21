import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Check, ImagePlus, ScanLine } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Layout from '../components/Layout';
import { solusApi, type AgendamentoDTO } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { addCollectionCredit, addMaterialLot, pointsForWeight } from '../utils/operations';

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}
type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike;

function extrairId(valor: string): number | null {
  const nomeado = valor.match(/coleta\s*[=:]\s*(\d+)/i);
  const texto = nomeado?.[1] ?? valor.match(/(\d+)/)?.[1];
  const id = Number(texto);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export default function EscanearQr() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [agendamentos, setAgendamentos] = useState<AgendamentoDTO[]>([]);
  const [coletaId, setColetaId] = useState<number | null>(null);
  const [codigoManual, setCodigoManual] = useState('');
  const [statusCamera, setStatusCamera] = useState('Solicitando acesso à câmera…');
  const [peso, setPeso] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let ativo = true;
    solusApi.agendamentosDaEmpresa(user.id).then(({ data, error }) => {
      if (!ativo) return;
      if (error) setErro(error);
      else setAgendamentos(data ?? []);
    });
    return () => {
      ativo = false;
    };
  }, [user?.id]);

  const usarCodigo = useCallback(
    (valor: string) => {
      const id = extrairId(valor);
      if (!id) {
        setErro('Código inválido. Informe o QR da coleta.');
        return;
      }
      setErro('');
      setSucesso('');
      setColetaId(id);
      setCodigoManual(String(id));
      const coleta = agendamentos.find((item) => item.id === id);
      if (coleta) {
        setPeso(String(coleta.pesoEstimado ?? ''));
        setStatusCamera(`Coleta #${id} lida. Confira os dados abaixo.`);
      } else {
        setStatusCamera(`Código ${id} lido. Aguardando os dados da coleta.`);
      }
    },
    [agendamentos]
  );

  const coletaParam = params.get('coleta');

  useEffect(() => {
    if (coletaParam && agendamentos.length) usarCodigo(coletaParam);
  }, [coletaParam, agendamentos, usarCodigo]);

  useEffect(() => {
    if (coletaId) return;
    let ativo = true;
    let stream: MediaStream | null = null;
    let frame = 0;

    async function iniciarCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatusCamera('Câmera indisponível neste navegador. Use a leitura manual.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!ativo) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
        if (!Detector) {
          setStatusCamera('Câmera ativa. Leitura automática indisponível — informe o código abaixo.');
          return;
        }

        setStatusCamera('Aponte a câmera para o QR do usuário');
        const detector = new Detector({ formats: ['qr_code'] });
        const verificar = async () => {
          if (!ativo || coletaId) return;
          try {
            if (video.readyState >= 2) {
              const encontrados = await detector.detect(video);
              if (encontrados.length > 0) {
                usarCodigo(encontrados[0].rawValue);
                return;
              }
            }
          } catch {
            // quadro inválido — tenta novamente
          }
          frame = window.requestAnimationFrame(verificar);
        };
        frame = window.requestAnimationFrame(verificar);
      } catch {
        setStatusCamera('Não foi possível abrir a câmera. Use a leitura manual abaixo.');
      }
    }

    void iniciarCamera();
    return () => {
      ativo = false;
      window.cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [coletaId, usarCodigo]);

  const coleta = agendamentos.find((item) => item.id === coletaId);
  const pesoNumero = Number(peso.replace(',', '.'));

  async function confirmar() {
    if (!coleta) {
      setErro('Leia o QR ou informe o número da coleta antes de confirmar.');
      return;
    }
    if (!Number.isFinite(pesoNumero) || pesoNumero <= 0) {
      setErro('Informe o peso real recebido.');
      return;
    }
    setProcessando(true);
    setErro('');
    const { error } = await solusApi.concluirAgendamento(coleta.id);
    setProcessando(false);
    if (error) {
      setErro(error);
      return;
    }
    const material = coleta.tipoResiduo ?? 'Recicláveis';
    addCollectionCredit(pointsForWeight(pesoNumero), material, coleta.id);
    addMaterialLot({
      id: `L-${coleta.id}`,
      material,
      weightKg: pesoNumero,
      origin: coleta.userName ?? 'Usuário Solus',
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      destination: 'Recicladora parceira',
    });
    setSucesso(`Coleta #${coleta.id} concluída. ${pointsForWeight(pesoNumero)} pontos liberados para o usuário.`);
  }

  return (
    <Layout>
      <div className="ops-page scanner-page">
        <BackButton to="/agenda-empresa" />
        <h1 className="section-title">Escanear QR</h1>
        <p className="page-text">Aponte para o código do usuário</p>

        <div className="scanner-view">
          <video ref={videoRef} playsInline muted autoPlay className="scanner-video" aria-label="Câmera para leitura do QR" />
          <div className="scanner-frame" aria-hidden="true"><ScanLine size={30} /></div>
          <span className="scanner-status"><Camera size={14} /> {statusCamera}</span>
        </div>

        {erro && <p className="form-error">{erro}</p>}
        {sucesso && <p className="form-success">{sucesso}</p>}

        <div className="scanner-readout">
          <span className="chat-avatar">{(coleta?.userName ?? 'US').slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{coleta ? `${coleta.userName ?? 'Morador'} · Coleta #${coleta.id}` : 'Aguardando leitura'}</strong>
            <p>{coleta ? `${coleta.tipoResiduo ?? 'Recicláveis'} · ${coleta.pesoEstimado ?? 0} kg estimados` : 'Leia o QR exibido pelo usuário'}</p>
          </div>
        </div>

        <div className="scanner-fallback">
          <label className="field-label">
            Código da coleta
            <input
              className="field-input"
              inputMode="numeric"
              placeholder="Ex.: 1042"
              value={codigoManual}
              onChange={(event) => setCodigoManual(event.target.value)}
            />
          </label>
          <div className="button-row compact">
            <button type="button" className="mini-btn outline" onClick={() => usarCodigo(codigoManual)}>
              <ScanLine size={15} /> Ler código
            </button>
          </div>
        </div>

        <label className="field-label">
          Peso real
          <input
            className="field-input"
            inputMode="decimal"
            placeholder="0,0 kg"
            value={peso}
            onChange={(event) => setPeso(event.target.value)}
          />
        </label>

        <label className="photo-upload">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => {
              const arquivo = event.target.files?.[0];
              if (!arquivo) return;
              const leitor = new FileReader();
              leitor.onload = () => setFoto(typeof leitor.result === 'string' ? leitor.result : null);
              leitor.readAsDataURL(arquivo);
            }}
          />
          {foto ? <img src={foto} alt="Foto do material recebido" /> : <><ImagePlus size={22} /><span>Foto do material</span></>}
        </label>

        {!sucesso && (
          <button type="button" className="green-btn full" onClick={confirmar} disabled={processando}>
            <Check size={17} /> {processando ? 'Confirmando…' : 'Confirmar recebimento'}
          </button>
        )}

        {sucesso && <Link to="/materiais-empresa" className="outline-btn full">Ver materiais e impacto</Link>}
      </div>
    </Layout>
  );
}
