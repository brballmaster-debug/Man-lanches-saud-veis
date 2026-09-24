import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, Printer, ExternalLink, QrCode, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';

interface CareGuideQrModalProps {
  onClose: () => void;
  homeTitle?: string;
  logoUrl?: string;
}

export const CareGuideQrModal: React.FC<CareGuideQrModalProps> = ({
  onClose,
  homeTitle = 'Maná Saudável',
  logoUrl
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Calcula o link direto padrão do Guia de Preparo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname.endsWith('/') 
        ? window.location.pathname 
        : `${window.location.pathname}/`;
      // Link direto que aciona a abertura automática do Guia
      const defaultGuideUrl = `${origin}${pathname}?tab=guia`;
      setCustomUrl(defaultGuideUrl);
    }
  }, []);

  // Gera o QR code sempre que a URL mudar
  useEffect(() => {
    if (!customUrl) return;

    let isMounted = true;
    QRCode.toDataURL(customUrl, {
      width: 800,
      margin: 2,
      color: {
        dark: '#20371E', // Verde institucional escuro elegante
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // Alta taxa de correção de erro para impressão
    })
      .then(url => {
        if (isMounted) {
          setQrDataUrl(url);
        }
      })
      .catch(err => {
        console.error('Erro ao gerar QR Code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [customUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(customUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = customUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadPng = async (highRes = true) => {
    try {
      setDownloading(true);
      const size = highRes ? 1200 : 600;
      const downloadUrl = await QRCode.toDataURL(customUrl, {
        width: size,
        margin: 2,
        color: {
          dark: '#20371E',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });

      const link = document.createElement('a');
      link.download = `qr-code-guia-de-preparo-${highRes ? 'alta-res' : 'padrao'}.png`;
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao baixar QR code:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintTag = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#FAF7F0] border border-[#DDD3C1] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
      >
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 bg-[#F4EFE6] border-b border-[#DDD3C1] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2B4A28] text-white flex items-center justify-center shadow-xs">
              <QrCode size={20} />
            </div>
            <div>
              <h3 id="qr-modal-title" className="font-serif font-bold text-lg text-[#20371E]">
                QR Code do Guia de Preparo
              </h3>
              <p className="text-xs text-stone-500">
                Pronto para embalagens, adesivos, tags e folhetos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-black/5 transition-colors"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo com Rolagem */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Cartão de Visualização / Impressão */}
          <div 
            ref={printRef}
            className="bg-white border-2 border-[#2B4A28]/20 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-sm relative overflow-hidden"
          >
            {/* Tag Decorativa */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2B4A28]/10 text-[#2B4A28] text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles size={13} />
              <span>Acesso Instantâneo</span>
            </div>

            <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#20371E] mb-1">
              Guia de Conservação & Preparo
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 max-w-sm mb-5">
              Aponte a câmera do seu celular para conferir tempos de forno, air fryer e dicas de conservação.
            </p>

            {/* Imagem do QR Code com Moldura */}
            <div className="p-3.5 bg-white border-2 border-[#D8CEBC] rounded-2xl shadow-inner mb-4 relative group">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code Guia de Preparo Maná Saudável" 
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-stone-50 rounded-lg text-stone-400 text-xs animate-pulse">
                  Gerando QR Code...
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-[#2B4A28]">
              <Smartphone size={15} />
              <span>Funciona direto na câmera do smartphone (sem app)</span>
            </div>

            <div className="mt-3 text-[11px] text-stone-400 font-mono break-all max-w-md px-2">
              {customUrl}
            </div>
          </div>

          {/* Botões de Ação Principal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleDownloadPng(true)}
              disabled={downloading || !qrDataUrl}
              className="flex items-center justify-center gap-2 bg-[#2B4A28] hover:bg-[#20371E] active:scale-[0.98] text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-[#2B4A28]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download size={16} />
              <span>{downloading ? 'Baixando...' : 'Baixar Imagem (PNG)'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-700 border border-stone-300 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              <span className={copied ? 'text-emerald-600' : ''}>
                {copied ? 'Link Copiado!' : 'Copiar Link Direto'}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrintTag}
              className="flex items-center justify-center gap-2 bg-white hover:bg-stone-50 active:scale-[0.98] text-[#2B4A28] border border-[#2B4A28]/30 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            >
              <Printer size={16} />
              <span>Imprimir Etiqueta</span>
            </button>
          </div>

          {/* Dicas Práticas de Aplicação */}
          <div className="bg-[#FAF7F0] border border-[#DDD3C1] rounded-2xl p-4 text-xs text-stone-600 space-y-2.5">
            <div className="font-bold text-[#20371E] flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <ShieldCheck size={16} className="text-[#2B4A28]" />
              <span>Como utilizar na sua operação:</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-stone-600">
              <li>
                <strong>Etiquetas & Adesivos:</strong> Baixe a imagem em alta resolução e envie para sua gráfica para estampar nos potes ou sacolas térmicas.
              </li>
              <li>
                <strong>Tags & Cartões de Entrega:</strong> Imprima o encarte recortável e anexe junto aos pedidos enviados nas sextas-feiras.
              </li>
              <li>
                <strong>Zero Fricção:</strong> O cliente não precisa digitar nada nem fazer download de aplicativo: ao apontar a câmera do celular, o Guia de Preparo abre de imediato na tela.
              </li>
            </ul>
          </div>

          {/* Configuração avançada de URL (se desejar usar domínio próprio) */}
          <div className="pt-2 border-t border-stone-200">
            <details className="group text-xs text-stone-500">
              <summary className="cursor-pointer font-semibold text-stone-600 hover:text-stone-800 flex items-center justify-between py-1">
                <span>Personalizar endereço de destino (opcional)</span>
                <span className="text-[10px] text-stone-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-2 space-y-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://sua-loja.com.br/?tab=guia"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B4A28] font-mono text-stone-800"
                />
                <p className="text-[11px] text-stone-400">
                  Insira aqui o domínio personalizado da sua loja caso utilize um link próprio fixo.
                </p>
              </div>
            </details>
          </div>

        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3.5 bg-[#F4EFE6] border-t border-[#DDD3C1] flex items-center justify-between text-xs text-stone-500">
          <span>Formato: PNG 1200x1200px (300 DPI)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CareGuideQrModal;
