/**
 * Sistema de Notificações de Novos Pedidos para Administradores
 * Maná Lanches Saudáveis
 * 
 * Inclui:
 * 1. Chime Sonoro de Alta Fidelidade (Web Audio API - sem arquivos externos)
 * 2. Notificações do Sistema / Navegador (Notification API para Desktop e Mobile/Android)
 * 3. Feedback Tátil (Vibração no celular / TWA)
 * 4. Gerenciamento de Permissões e Preferências
 */

import { Order } from '../types';

export interface AdminNotificationSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
}

const STORAGE_KEYS = {
  NOTIF_ENABLED: 'mana_admin_notif_enabled',
  SOUND_ENABLED: 'mana_admin_sound_enabled',
  VIBRATE_ENABLED: 'mana_admin_vibrate_enabled',
};

// Singleton para o AudioContext do Web Audio API
let globalAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
      globalAudioCtx = new AudioContextClass();
    }
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }
    return globalAudioCtx;
  } catch (e) {
    console.warn("Web Audio API indisponível:", e);
    return null;
  }
};

/**
 * Toca um sino sonoro cristalino de restaurante / novo pedido ("Ding-Dong-Chime")
 * gerado via síntese senoidal harmônica, funcionando 100% offline sem arquivos pesados.
 */
export const playOrderChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Frequências das notas do sino harmonioso (Sol 5 -> Si 5 -> Mi 6)
    const notes = [
      { freq: 783.99, time: now, duration: 0.65, gain: 0.28 },       // G5
      { freq: 987.77, time: now + 0.12, duration: 0.70, gain: 0.32 }, // B5
      { freq: 1318.51, time: now + 0.24, duration: 0.95, gain: 0.36 } // E6
    ];

    notes.forEach(({ freq, time, duration, gain }) => {
      // Oscilador Principal (Fundamental senoidal suave)
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      // Oscilador harmônico sutil (brilho de sino)
      const harmonicOsc = ctx.createOscillator();
      const harmonicGain = ctx.createGain();
      harmonicOsc.type = 'triangle';
      harmonicOsc.frequency.setValueAtTime(freq * 2, time);

      // Envelope ADSR natural de sino
      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(gain, time + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      harmonicGain.gain.setValueAtTime(0.001, time);
      harmonicGain.gain.linearRampToValueAtTime(gain * 0.25, time + 0.01);
      harmonicGain.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.6);

      // Conexões
      osc.connect(gainNode);
      harmonicOsc.connect(harmonicGain);
      gainNode.connect(ctx.destination);
      harmonicGain.connect(ctx.destination);

      // Dispara os sons
      osc.start(time);
      osc.stop(time + duration);
      harmonicOsc.start(time);
      harmonicOsc.stop(time + duration);
    });
  } catch (error) {
    console.warn("Erro ao reproduzir alerta sonoro de novo pedido:", error);
  }
};

/**
 * Dispara vibração tátil no celular / TWA Android para novos pedidos
 */
export const triggerOrderVibration = () => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([250, 100, 250, 100, 450]);
    } catch {
      // Ignora silenciosamente se o dispositivo não permitir
    }
  }
};

/**
 * Lê as configurações salvas de notificação do administrador
 */
export const getAdminNotificationSettings = (): AdminNotificationSettings => {
  if (typeof window === 'undefined') {
    return { notificationsEnabled: true, soundEnabled: true, vibrateEnabled: true };
  }

  const notif = localStorage.getItem(STORAGE_KEYS.NOTIF_ENABLED);
  const sound = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
  const vibrate = localStorage.getItem(STORAGE_KEYS.VIBRATE_ENABLED);

  return {
    notificationsEnabled: notif === null ? true : notif === 'true',
    soundEnabled: sound === null ? true : sound === 'true',
    vibrateEnabled: vibrate === null ? true : vibrate === 'true',
  };
};

/**
 * Salva as configurações de notificação do administrador
 */
export const saveAdminNotificationSettings = (settings: Partial<AdminNotificationSettings>) => {
  if (typeof window === 'undefined') return;

  if (settings.notificationsEnabled !== undefined) {
    localStorage.setItem(STORAGE_KEYS.NOTIF_ENABLED, String(settings.notificationsEnabled));
  }
  if (settings.soundEnabled !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(settings.soundEnabled));
  }
  if (settings.vibrateEnabled !== undefined) {
    localStorage.setItem(STORAGE_KEYS.VIBRATE_ENABLED, String(settings.vibrateEnabled));
  }
};

/**
 * Verifica o status da permissão de notificações do navegador
 */
export const getBrowserNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

/**
 * Solicita permissão para exibir notificações nativas no navegador / celular
 */
export const requestBrowserNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn("Erro ao solicitar permissão de notificação:", error);
    return Notification.permission;
  }
};

/**
 * Envia notificação nativa do sistema / navegador para o administrador
 */
export const sendSystemNotification = (
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
  }
) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon || '/logo.png?v=5',
      badge: '/logo.png?v=5',
      tag: options.tag || 'mana-order-notification',
      requireInteraction: true,
      silent: true // Usamos o nosso sintetizador de áudio para controle perfeito de volume
    });

    notification.onclick = () => {
      window.focus();
      if (options.onClick) {
        options.onClick();
      }
      notification.close();
    };
  } catch (err) {
    console.warn("Não foi possível disparar notificação do sistema:", err);
  }
};

/**
 * Executa o alerta completo de um novo pedido para o administrador
 */
export const notifyNewOrder = (
  order: Order,
  options?: {
    appIconUrl?: string;
    onClick?: () => void;
  }
) => {
  const settings = getAdminNotificationSettings();
  if (!settings.notificationsEnabled) return;

  // 1. Alerta sonoro (se ativado)
  if (settings.soundEnabled) {
    playOrderChime();
  }

  // 2. Alerta de vibração móvel (se ativado)
  if (settings.vibrateEnabled) {
    triggerOrderVibration();
  }

  // 3. Notificação nativa do navegador/Android (se permitida)
  const isPickup = order.deliveryType === 'pickup' || 
    order.deliveryType === 'retirada' || 
    order.address?.street?.toUpperCase?.()?.includes('RETIRADA');

  const itemsSummary = (order.items || [])
    .map(i => `${i.quantity}x ${i.name}`)
    .join(', ');

  const title = `🔔 Novo Pedido Recebido! • R$ ${(order.total || 0).toFixed(2)}`;
  const body = `Cliente: ${order.customerName || 'Cliente'}\nModalidade: ${isPickup ? 'Retirada no Balcão' : 'Entrega'}\nItens: ${itemsSummary || 'Ver detalhes no painel'}`;

  sendSystemNotification(title, {
    body,
    icon: options?.appIconUrl || '/logo.png?v=5',
    tag: `order-${order.id}`,
    onClick: options?.onClick
  });
};

/**
 * Realiza um teste imediato de notificação com som e vibração
 */
export const testAdminNotification = (options?: { appIconUrl?: string; onToast?: (msg: string) => void }) => {
  // Desbloqueia e toca o som
  playOrderChime();
  triggerOrderVibration();

  // Envia notificação nativa se permitida
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    sendSystemNotification('🔔 Teste de Notificação • Maná Lanches', {
      body: 'Seus alertas sonoros e notificações de novos pedidos estão configurados e funcionando perfeitamente!',
      icon: options?.appIconUrl || '/logo.png?v=5',
      tag: 'test-notification'
    });
  }

  if (options?.onToast) {
    options.onToast('Campainha e notificação de teste disparadas com sucesso!');
  }
};
