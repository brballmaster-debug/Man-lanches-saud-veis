/**
 * Sistema de Notificações de Novos Pedidos para Administradores
 * Maná Lanches Saudáveis
 * 
 * Inclui:
 * 1. Sino Autêntico de Balcão de Restaurante ("Restaurant Service Desk Bell")
 *    - Efeito de impacto do êmbolo mecânico
 *    - Ressonância metálica brilhante de domo de aço/latão (C7 ~2093 Hz)
 *    - Toque duplo clássico de cozinha ("DING-DING!") ou toque único
 * 2. Notificações do Sistema / Navegador (Notification API para Desktop e Mobile/Android)
 * 3. Feedback Tátil (Vibração no celular / TWA)
 * 4. Gerenciamento de Permissões e Preferências
 */

import { Order } from '../types';

export type BellSoundType = 'restaurant_double' | 'restaurant_single' | 'chime';

export interface AdminNotificationSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  soundType: BellSoundType;
  vibrateEnabled: boolean;
}

const STORAGE_KEYS = {
  NOTIF_ENABLED: 'mana_admin_notif_enabled',
  SOUND_ENABLED: 'mana_admin_sound_enabled',
  SOUND_TYPE: 'mana_admin_sound_type',
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
 * Toca o autêntico sino metálico de balcão de restaurante ("Service Desk Bell"),
 * exatamente como o sino tocado na bancada da cozinha de restaurantes quando um pedido fica pronto.
 */
export const playRestaurantServiceBell = (soundType: BellSoundType = 'restaurant_double') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Função interna que sintetiza um golpe realista na campainha metálica
    const strikeBell = (startTime: number, volumeScale = 1.0) => {
      // 1. Ruído de impacto do martelo metálico batendo no topo do domo
      try {
        const clickDuration = 0.005;
        const bufferSize = Math.floor(ctx.sampleRate * clickDuration);
        const clickBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = clickBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.0015));
        }

        const clickSource = ctx.createBufferSource();
        clickSource.buffer = clickBuffer;

        const clickFilter = ctx.createBiquadFilter();
        clickFilter.type = 'highpass';
        clickFilter.frequency.setValueAtTime(3200, startTime);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(0.35 * volumeScale, startTime);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + clickDuration);

        clickSource.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickSource.start(startTime);
      } catch (clickErr) {
        // Ignora caso buffer falhe
      }

      // 2. Ressonância acústica do domo de metal (aço/bronze de balcão de restaurante)
      // Frequência fundamental C7 (2093 Hz) + harmônicos e parciais metálicos inarmônicos
      const baseFreq = 2093;
      const partials = [
        { freq: baseFreq, gain: 0.42 * volumeScale, duration: 2.2, wave: 'sine' as OscillatorType },          // Tom fundamental puro
        { freq: baseFreq * 1.58, gain: 0.22 * volumeScale, duration: 1.6, wave: 'sine' as OscillatorType },   // Ressonância metálica do sino
        { freq: baseFreq * 2.71, gain: 0.15 * volumeScale, duration: 0.9, wave: 'triangle' as OscillatorType }, // Brilho metálico agudo
        { freq: baseFreq * 4.16, gain: 0.08 * volumeScale, duration: 0.4, wave: 'sine' as OscillatorType }    // Shimmer do ataque
      ];

      partials.forEach(({ freq, gain, duration, wave }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = wave;
        osc.frequency.setValueAtTime(freq, startTime);

        // Ataque percussivo ultra-rápido (2ms) seguido de decaimento exponencial natural
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.002);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    };

    if (soundType === 'restaurant_double') {
      // Clássico duplo toque de restaurante: "DING-DING!"
      strikeBell(now, 0.88);
      strikeBell(now + 0.20, 1.0);
    } else if (soundType === 'restaurant_single') {
      // Toque único metálico prolongado: "DIIING!"
      strikeBell(now, 1.0);
    } else {
      // Chime melódico suave (Sol 5 -> Si 5 -> Mi 6)
      const notes = [
        { freq: 783.99, time: now, duration: 0.65, gain: 0.28 },
        { freq: 987.77, time: now + 0.12, duration: 0.70, gain: 0.32 },
        { freq: 1318.51, time: now + 0.24, duration: 0.95, gain: 0.36 }
      ];

      notes.forEach(({ freq, time, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gainNode.gain.setValueAtTime(0.001, time);
        gainNode.gain.linearRampToValueAtTime(gain, time + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + duration);
      });
    }
  } catch (error) {
    console.warn("Erro ao reproduzir sino de restaurante:", error);
  }
};

/**
 * Toca o sino de novo pedido respeitando as preferências do administrador
 */
export const playOrderChime = (overrideType?: BellSoundType) => {
  const settings = getAdminNotificationSettings();
  const type = overrideType || settings.soundType || 'restaurant_double';
  playRestaurantServiceBell(type);
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
    return { 
      notificationsEnabled: true, 
      soundEnabled: true, 
      soundType: 'restaurant_double',
      vibrateEnabled: true 
    };
  }

  const notif = localStorage.getItem(STORAGE_KEYS.NOTIF_ENABLED);
  const sound = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
  const soundTypeRaw = localStorage.getItem(STORAGE_KEYS.SOUND_TYPE);
  const vibrate = localStorage.getItem(STORAGE_KEYS.VIBRATE_ENABLED);

  const soundType: BellSoundType = 
    soundTypeRaw === 'restaurant_single' || soundTypeRaw === 'chime' 
      ? soundTypeRaw 
      : 'restaurant_double';

  return {
    notificationsEnabled: notif === null ? true : notif === 'true',
    soundEnabled: sound === null ? true : sound === 'true',
    soundType,
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
  if (settings.soundType !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SOUND_TYPE, settings.soundType);
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
    // Se concedido, garante registro imediato do Service Worker
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (e) {
        console.warn("Falha ao registrar Service Worker ao conceder permissão:", e);
      }
    }
    return permission;
  } catch (error) {
    console.warn("Erro ao solicitar permissão de notificação:", error);
    return Notification.permission;
  }
};

/**
 * Retorna o registro ativo do Service Worker
 */
export const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js');
    }
    return reg;
  } catch (err) {
    console.warn("Falha ao obter registro do Service Worker:", err);
    return null;
  }
};

/**
 * Verifica se o Service Worker está ativo no navegador
 */
export const getServiceWorkerStatus = async (): Promise<'active' | 'installing' | 'unsupported'> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return 'unsupported';
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg?.active) return 'active';
    if (reg?.installing || reg?.waiting) return 'installing';
    return 'active';
  } catch {
    return 'unsupported';
  }
};

/**
 * Envia notificação nativa do sistema / navegador para o administrador.
 * Utiliza prioritariamente o Service Worker (exigido pelo Android e que funciona em segundo plano)
 * com fallback para Notification API de janela.
 */
export const sendSystemNotification = async (
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
    data?: any;
  }
) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const appIcon = options.icon || '/logo.png?v=5';
  const tag = options.tag || 'mana-order-notification';

  const notificationPayload = {
    body: options.body,
    icon: appIcon,
    badge: appIcon,
    tag: tag,
    vibrate: [250, 100, 250, 100, 450],
    renotify: true,
    requireInteraction: true,
    data: options.data || { url: '/' },
    actions: [
      { action: 'open_order', title: 'Ver Pedido 🚀' }
    ]
  };

  // 1. Tenta via Service Worker (obrigatório para Android Chrome e telas bloqueadas/background)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await getServiceWorkerRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationPayload);
        return;
      }
    } catch (swErr) {
      console.warn("Falha ao disparar notificação via Service Worker:", swErr);
    }
  }

  // 2. Fallback para Notification API clássica (desktop / aba em foco)
  try {
    const notification = new Notification(title, {
      body: options.body,
      icon: appIcon,
      badge: appIcon,
      tag: tag,
      requireInteraction: true,
      silent: false
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

  // 1. Alerta sonoro com o sino de restaurante (se ativado)
  if (settings.soundEnabled) {
    playOrderChime(settings.soundType);
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
    onClick: options?.onClick,
    data: { url: '/', orderId: order.id }
  });
};

/**
 * Realiza um teste imediato de notificação com som do sino de restaurante, vibração e push nativo
 */
export const testAdminNotification = async (options?: { 
  appIconUrl?: string; 
  soundType?: BellSoundType;
  onToast?: (msg: string) => void 
}) => {
  // Desbloqueia e toca o sino de restaurante
  playOrderChime(options?.soundType);
  triggerOrderVibration();

  // Envia notificação nativa se permitida
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    await sendSystemNotification('🔔 Sino de Balcão • Teste Maná', {
      body: 'Sino de restaurante e notificação nativa testados com sucesso! Seus alertas estão prontos.',
      icon: options?.appIconUrl || '/logo.png?v=5',
      tag: 'test-notification'
    });
  }

  if (options?.onToast) {
    options.onToast('Notificação nativa e sino disparados com sucesso!');
  }
};

/**
 * Executa um teste com contagem regressiva para que o administrador possa
 * bloquear o celular ou alternar para outro app e verificar a notificação em segundo plano.
 */
export const testDelayedBackgroundNotification = (
  delaySeconds: number = 4,
  options?: {
    appIconUrl?: string;
    soundType?: BellSoundType;
    onTick?: (remaining: number) => void;
    onToast?: (msg: string) => void;
  }
): (() => void) => {
  let remaining = delaySeconds;
  if (options?.onTick) options.onTick(remaining);

  const intervalId = window.setInterval(async () => {
    remaining -= 1;
    if (options?.onTick) options.onTick(remaining);

    if (remaining <= 0) {
      window.clearInterval(intervalId);
      playOrderChime(options?.soundType);
      triggerOrderVibration();

      await sendSystemNotification('🔔 Teste em Segundo Plano • Maná', {
        body: 'Notificação nativa recebida mesmo com a tela ou app em segundo plano!',
        icon: options?.appIconUrl || '/logo.png?v=5',
        tag: 'test-background-notification'
      });

      if (options?.onToast) {
        options.onToast('Notificação em segundo plano disparada!');
      }
    }
  }, 1000);

  return () => window.clearInterval(intervalId);
};
