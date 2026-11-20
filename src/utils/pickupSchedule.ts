export interface ScheduledFieldConfig {
  enabled: boolean;
  scheduleEnabled: boolean;
  scheduleDays: number[]; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const DAYS_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const DEFAULT_PICKUP_INFO =
  'Compareça ao local no horário informado para retirar o seu pedido!';

export const DEFAULT_PICKUP_HOURS_CONFIG: ScheduledFieldConfig = {
  enabled: true,
  scheduleEnabled: false,
  scheduleDays: ALL_DAYS,
  startTime: '17:30',
  endTime: '19:00',
};

export const DEFAULT_PICKUP_INFO_CONFIG: ScheduledFieldConfig = {
  enabled: true,
  scheduleEnabled: false,
  scheduleDays: ALL_DAYS,
  startTime: '08:00',
  endTime: '19:00',
};

/**
 * Obtém o dia da semana (0-6) e o total de minutos do dia (0-1439) no fuso horário de Brasília (America/Sao_Paulo).
 */
export function getBrasiliaTimeParts(referenceDate: Date = new Date()): {
  day: number;
  minutes: number;
  formattedTime: string;
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(referenceDate);
    const weekdayStr = parts.find((p) => p.type === 'weekday')?.value || 'Sun';
    const hourStr = parts.find((p) => p.type === 'hour')?.value || '0';
    const minuteStr = parts.find((p) => p.type === 'minute')?.value || '0';

    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const day = weekdayMap[weekdayStr] ?? referenceDate.getDay();
    const rawHour = parseInt(hourStr, 10);
    const hour = isNaN(rawHour) ? referenceDate.getHours() : rawHour === 24 ? 0 : rawHour;
    const rawMinute = parseInt(minuteStr, 10);
    const minute = isNaN(rawMinute) ? referenceDate.getMinutes() : rawMinute;

    const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return {
      day,
      minutes: hour * 60 + minute,
      formattedTime,
    };
  } catch {
    const day = referenceDate.getDay();
    const hour = referenceDate.getHours();
    const minute = referenceDate.getMinutes();
    return {
      day,
      minutes: hour * 60 + minute,
      formattedTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    };
  }
}

function parseTimeToMinutes(timeStr: string, fallbackMinutes: number): number {
  if (!timeStr || typeof timeStr !== 'string') return fallbackMinutes;
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
  if (!match) return fallbackMinutes;
  const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
  const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
  return h * 60 + m;
}

/**
 * Avalia se um campo (janela de retirada ou texto informativo de retirada) está ativo no momento atual.
 */
export function isScheduledFieldActive(
  config: ScheduledFieldConfig,
  referenceDate: Date = new Date()
): boolean {
  if (!config.enabled) return false;
  if (!config.scheduleEnabled) return true;

  const { day, minutes } = getBrasiliaTimeParts(referenceDate);
  const startMinutes = parseTimeToMinutes(config.startTime, 0);
  const endMinutes = parseTimeToMinutes(config.endTime, 23 * 60 + 59);
  const activeDays =
    Array.isArray(config.scheduleDays) && config.scheduleDays.length > 0
      ? config.scheduleDays
      : ALL_DAYS;

  if (startMinutes <= endMinutes) {
    // Intervalo no mesmo dia (ex: 17:30 às 19:00)
    if (!activeDays.includes(day)) return false;
    return minutes >= startMinutes && minutes <= endMinutes;
  } else {
    // Intervalo que vira a noite (ex: 22:00 às 06:00)
    if (minutes >= startMinutes) {
      return activeDays.includes(day);
    }
    if (minutes <= endMinutes) {
      const previousDay = (day + 6) % 7;
      return activeDays.includes(previousDay);
    }
    return false;
  }
}

export function formatScheduleDaysSummary(days: number[]): string {
  if (!Array.isArray(days) || days.length === 0 || days.length === 7) {
    return 'Todos os dias';
  }
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  return sorted.map((d) => DAYS_SHORT_PT[d] || '').filter(Boolean).join(', ');
}
