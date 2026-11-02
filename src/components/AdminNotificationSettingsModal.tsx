import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Play
} from 'lucide-react';
import { 
  getAdminNotificationSettings, 
  saveAdminNotificationSettings, 
  getBrowserNotificationPermission, 
  requestBrowserNotificationPermission, 
  testAdminNotification,
  AdminNotificationSettings
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

  useEffect(() => {
    if (isOpen) {
      setSettings(getAdminNotificationSettings());
      setBrowserPermission(getBrowserNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof AdminNotificationSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveAdminNotificationSettings(updated);
    onShowToast(`Configuração de notificação atualizada.`);
  };

  const handleRequestBrowserPermission = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserPermission(res);
    if (res === 'granted') {
      onShowToast("Notificações do navegador ativadas com sucesso!");
    } else if (res === 'denied') {
      onShowToast("Permissão negada no navegador. Habilite nas configurações do site.");
    }
  };

  const handleTestNotification = () => {
    testAdminNotification({
      appIconUrl,
      onToast: onShowToast
    });
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-mana-gold/30 overflow-hidden flex flex-col">
        {/* Cabeçalho */}
        <div className="px-5 py-4 bg-mana-bg border-b border-mana-gold/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-mana-green text-white flex items-center justify-center shadow-sm">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-mana-green leading-tight">
                Notificações de Novos Pedidos
              </h3>
              <p className="text-xs text-mana-text-light">
                Configure alertas sonoros e avisos no celular / PC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-mana-text-light hover:text-mana-text hover:bg-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Card de Permissão do Navegador */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-600" />
                Notificações do Navegador / Sistema
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
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
            </div>

            <p className="text-xs text-emerald-950 leading-relaxed">
              Receba avisos na área de trabalho ou na barra de notificações do seu celular Android (TWA / PWA) mesmo com a aba em segundo plano.
            </p>

            {browserPermission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestBrowserPermission}
                className="w-full mt-1 bg-mana-green hover:bg-mana-green-dark text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Bell size={14} />
                <span>Ativar Notificações no Meu Navegador</span>
              </button>
            )}

            {browserPermission === 'denied' && (
              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                <span>
                  O navegador bloqueou as notificações deste site. Clique no ícone de cadeado na barra de endereço para permitir notificações.
                </span>
              </div>
            )}
          </div>

          {/* Opções de Ativação / Toggles */}
          <div className="space-y-3 pt-1">
            {/* Toggle Geral */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-mana-gold/20 bg-mana-bg/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-mana-green/10 text-mana-green flex items-center justify-center">
                  <Bell size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-mana-text">Alertas de Novos Pedidos</h4>
                  <p className="text-xs text-mana-text-light">Ativar monitoramento automático</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('notificationsEnabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
                  <h4 className="text-sm font-semibold text-mana-text">Alerta Sonoro (Campainha)</h4>
                  <p className="text-xs text-mana-text-light">Toca um sino harmonioso ao receber pedidos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('soundEnabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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

          {/* Botão de Teste Imediato */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestNotification}
              className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Play size={14} className="fill-current text-amber-700" />
              <span>Testar Som da Campainha e Notificação Agora</span>
            </button>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-mana-green hover:bg-mana-green-dark text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <CheckCircle size={15} />
            <span>Concluído</span>
          </button>
        </div>
      </div>
    </div>
  );
};
