/**
 * Utilitário de Haptic Feedback (Vibração Tátil)
 * Fornece respostas físicas sutis em navegadores móveis compatíveis
 * com verificação estrita para nunca bloquear a execução caso o dispositivo não suporte.
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'success' = 'light') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') navigator.vibrate(12);
      else if (type === 'medium') navigator.vibrate(25);
      else if (type === 'success') navigator.vibrate([15, 50, 20]);
    } catch {
      // Ignora silenciosamente em navegadores/dispositivos sem suporte
    }
  }
};
