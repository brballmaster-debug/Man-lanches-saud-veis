import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ConciergeBell, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Play,
  Check,
  BellRing,
  Clock,
  ShieldCheck,
  Info
} from 'lucide-react';
import { 
  getAdminNotificationSettings, 
  saveAdminNotificationSettings, 
  getBrowserNotificationPermission, 
  requestBrowserNotificationPermission, 
  testAdminNotification,
  testDelayedBackgroundNotification,
  getServiceWorkerStatus,
  playRestaurantServiceBell,
  AdminNotificationSettings,
  BellSoundType
} from '../utils/adminNotification';

interface AdminNotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appIconUrl?: string;
  onShowToast: (msg: string) => void;
}

export const AdminNotificationSettingsModal: React.FC<AdminNotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  appIconUrl,
  onShowToast,
}) => {
  const [settings, setSettings] = useState<AdminNotificationSettings>(getAdminNotificationSettings);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [swStatus, setSwStatus] = useState<'active' | 'installing' | 'unsupported'>('installing');
  const [countdown, setCountdown] = useState<number | null>(null);
  const cancelDelayedRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(getAdminNotificationSettings());
      setBrowserPermission(getBrowserNotificationPermission());
      getServiceWorkerStatus().then(setSwStatus);
    } else {
      if (cancelDelayedRef.current) {
        cancelDelayedRef.current();
        cancelDelayedRef.current = null;
      }
      setCountdown(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: 'notificationsEnabled' | 'soundEnabled' | 'vibrateEnabled') => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveAdminNotificationSettings(updated);
    onShowToast(`Configuração atualizada.`);
  };

  const handleSelectSoundType = (type: BellSoundType) => {
    const updated = { ...settings, soundType: type };
    setSettings(updated);
    saveAdminNotificationSettings(updated);
    playRestaurantServiceBell(type);
    onShowToast(`Timbre de sino alterado!`);
  };

  const handleRequestBrowserPermission = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserPermission(res);
    getServiceWorkerStatus().then(setSwStatus);
    if (res === 'granted') {
      onShowToast("Notificações nativas ativadas com sucesso!");
    } else if (res === 'denied') {
      onShowToast("Permissão negada no navegador. Habilite nas configurações do site.");
    }
  };

  const handleTestNotification = () => {
    testAdminNotification({
      appIconUrl,
      soundType: settings.soundType,
      onToast: onShowToast
    });
  };

  const handleStartBackgroundTest = () => {
    if (cancelDelayedRef.current) {
      cancelDelayedRef.current();
    }
    setCountdown(4);
    cancelDelayedRef.current = testDelayedBackgroundNotification(4, {
      appIconUrl,
      soundType: settings.soundType,
      onTick: (rem) => {
        if (rem <= 0) {
          setCountdown(null);
        } else {
          setCountdown(rem);
        }
      },
      onToast: onShowToast
    });
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-mana-gold/30 overflow-hidden flex flex-col">
        {/* Cabeçalho com Sino de Balcão de Restaurante */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 via-white to-amber-50/40 border-b border-mana-gold/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-600/20 ring-2 ring-amber-400/30">
              <ConciergeBell size={22} className="animate-wiggle" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base text-mana-green leading-tight">
                  Sino de Pedidos de Restaurante
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  Cozinha & Balcão
                </span>
              </div>
              <p className="text-xs text-mana-text-light">
                Campainha metálica estilo "Pedido Pronto!" e alertas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-mana-text-light hover:text-mana-text hover:bg-white rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Seletor do Timbre do Sino */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-mana-green flex items-center gap-1.5">
                <ConciergeBell size={15} className="text-amber-600" />
                Estilo do Sino de Restaurante
              </label>
              <span className="text-[11px] text-mana-text-light">
                Toque para testar cada som
              </span>
            </div>

            <div className="space-y-2">
              {/* Opção 1: Duplo Ding-Ding (Padrão de Cozinha) */}
              <div
                onClick={() => handleSelectSoundType('restaurant_double')}
                className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  settings.soundType === 'restaurant_double'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    settings.soundType === 'restaurant_double'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <ConciergeBell size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-gray-900">
                        Sino de Balcão (Duplo Ding-Ding!)
                      </h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        Mais Usado
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Clássico sino metálico de restaurante quando a cozinha finaliza um pedido.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playRestaurantServiceBell('restaurant_double');
                    }}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-emerald-100/50 text-emerald-800 transition-colors shadow-2xs cursor-pointer"
                    title="Ouvir este sino"
                  >
                    <Play size={14} className="fill-current text-emerald-700" />
                  </button>
                  {settings.soundType === 'restaurant_double' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Opção 2: Ding Único Metálico Prolongado */}
              <div
                onClick={() => handleSelectSoundType('restaurant_single')}
                className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  settings.soundType === 'restaurant_single'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    settings.soundType === 'restaurant_single'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <ConciergeBell size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Sino de Restaurante (Ding Único)
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Um toque metálico nítido com reverberação longa e sustentada ("Diiing...").
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playRestaurantServiceBell('restaurant_single');
                    }}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-emerald-100/50 text-emerald-800 transition-colors shadow-2xs cursor-pointer"
                    title="Ouvir este sino"
                  >
                    <Play size={14} className="fill-current text-emerald-700" />
                  </button>
                  {settings.soundType === 'restaurant_single' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Opção 3: Chime Harmônico Suave */}
              <div
                onClick={() => handleSelectSoundType('chime')}
                className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  settings.soundType === 'chime'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    settings.soundType === 'chime'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Volume2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Chime Harmônico Suave
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sequência harmônica de 3 notas musicais suaves.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playRestaurantServiceBell('chime');
                    }}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-emerald-100/50 text-emerald-800 transition-colors shadow-2xs cursor-pointer"
                    title="Ouvir este chime"
                  >
                    <Play size={14} className="fill-current text-emerald-700" />
                  </button>
                  {settings.soundType === 'chime' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card de Notificações Nativas & Web Push (Celular e PC) */}
          <div className="bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 border border-emerald-200/80 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <BellRing size={15} className="text-emerald-700" />
                Web Push & Notificação Nativa
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  browserPermission === 'granted'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : browserPermission === 'denied'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {browserPermission === 'granted'
                    ? 'Permissão Ativa'
                    : browserPermission === 'denied'
                    ? 'Permissão Bloqueada'
                    : 'Pendente'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="Status do Service Worker">
                  {swStatus === 'active' ? '✓ SW Ativo' : 'SW Carregando'}
                </span>
              </div>
            </div>

            <p className="text-xs text-emerald-950/90 leading-relaxed">
              Receba notificações nativas com som e vibração na barra de status do seu celular Android (PWA) e no computador mesmo com a tela bloqueada ou aba em segundo plano.
            </p>

            {browserPermission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestBrowserPermission}
                className="w-full mt-1 bg-mana-green hover:bg-mana-green-dark text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <ConciergeBell size={15} />
                <span>Ativar Notificações no Celular / Computador</span>
              </button>
            )}

            {browserPermission === 'denied' && (
              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                <span>
                  O navegador bloqueou as notificações deste site. Clique no ícone de cadeado/ajustes ao lado do link para permitir notificações.
                </span>
              </div>
            )}

            {/* Testes de Notificação */}
            <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleTestNotification}
                className="bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Play size={13} className="text-emerald-700" />
                <span>Teste Imediato</span>
              </button>

              <button
                type="button"
                onClick={handleStartBackgroundTest}
                disabled={countdown !== null}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                  countdown !== null
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
                title="Dá 4 segundos para você minimizar o app ou bloquear o celular antes do alerta disparar"
              >
                <Clock size={13} />
                <span>
                  {countdown !== null
                    ? `Bloqueie a tela (${countdown}s)...`
                    : 'Testar em 2º Plano (4s)'}
                </span>
              </button>
            </div>

            {countdown !== null && (
              <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-lg text-[11px] text-amber-950 flex items-center gap-2 animate-in fade-in">
                <Clock size={16} className="text-amber-700 shrink-0 animate-spin" />
                <span>
                  <strong>Atenção:</strong> Bloqueie a tela do celular ou minimize a aba agora! A notificação chegará em <strong>{countdown} segundos</strong>.
                </span>
              </div>
            )}

            {/* Dicas para Celular e PC */}
            <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100 text-[11px] text-gray-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-gray-800">
                <Info size={13} className="text-emerald-600" />
                <span>Dicas para garantir o recebimento:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-gray-600">
                <li><strong>No celular:</strong> Instale o app na tela inicial para melhor desempenho em segundo plano.</li>
                <li><strong>Som:</strong> Certifique-se de que o modo "Não Perturbe" ou "Silencioso" esteja desativado.</li>
              </ul>
            </div>
          </div>

          {/* Opções de Ativação / Toggles */}
          <div className="space-y-3 pt-1">
            {/* Toggle Geral */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-mana-gold/20 bg-mana-bg/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-mana-green/10 text-mana-green flex items-center justify-center">
                  <ConciergeBell size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-mana-text">Alertas de Novos Pedidos</h4>
                  <p className="text-xs text-mana-text-light">Monitoramento automático ativado</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('notificationsEnabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  settings.notificationsEnabled ? 'bg-mana-green' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Toggle Som */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-mana-gold/20 bg-mana-bg/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-mana-green/10 text-mana-green flex items-center justify-center">
                  {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-mana-text">Campainha de Balcão (Áudio)</h4>
                  <p className="text-xs text-mana-text-light">Toca o sino de restaurante ao receber pedidos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('soundEnabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  settings.soundEnabled ? 'bg-mana-green' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Toggle Vibração */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-mana-gold/20 bg-mana-bg/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-mana-green/10 text-mana-green flex items-center justify-center">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-mana-text">Vibração no Celular</h4>
                  <p className="text-xs text-mana-text-light">Padrão tátil para celulares e tablets</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('vibrateEnabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  settings.vibrateEnabled ? 'bg-mana-green' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.vibrateEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Botão de Teste Imediato com Sino de Restaurante */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestNotification}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-600/20 active:scale-[0.99] cursor-pointer"
            >
              <ConciergeBell size={17} className="animate-wiggle" />
              <span>Testar Sino de Restaurante e Notificação Agora</span>
            </button>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-mana-green hover:bg-mana-green-dark text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle size={15} />
            <span>Salvar e Fechar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
