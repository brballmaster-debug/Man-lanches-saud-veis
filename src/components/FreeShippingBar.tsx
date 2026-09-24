import React from 'react';
import { Truck, Gift } from 'lucide-react';

export interface FreeShippingBarProps {
  subtotal: number;
  freeShippingThreshold?: number;
  freeShippingMin?: number;
  className?: string;
}

/**
 * Barra de Progresso Dinâmica de Frete Grátis no Carrinho
 * Estimula o aumento do ticket médio exibindo quanto falta para atingir a meta.
 */
export const FreeShippingBar: React.FC<FreeShippingBarProps> = ({
  subtotal,
  freeShippingThreshold,
  freeShippingMin,
  className = ''
}) => {
  // Suporte a freeShippingMin, freeShippingThreshold ou valor padrão de 50.00
  const target = Number(freeShippingMin ?? freeShippingThreshold ?? 50.00);

  // Se o frete grátis estiver desativado ou configurado como 0, oculte o componente
  if (target <= 0) {
    return null;
  }

  // Tratamento monetário preciso em centavos inteiros para evitar dízimas e imprecisões de ponto flutuante
  const subtotalCents = Math.round(Number(subtotal || 0) * 100);
  const targetCents = Math.round(target * 100);
  const remainingCents = Math.max(0, targetCents - subtotalCents);
  const remaining = remainingCents / 100;
  const progress = targetCents > 0 ? Math.min(100, Math.round((subtotalCents / targetCents) * 100)) : 0;
  const hasFreeShipping = subtotalCents >= targetCents;

  const formattedRemaining = remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (hasFreeShipping) {
    return (
      <div 
        className={`bg-[#2D5A27]/10 border border-[#2D5A27]/20 p-3.5 rounded-xl transition-all duration-300 animate-in fade-in ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#2D5A27] mb-2">
          <Gift size={18} className="text-[#2D5A27] shrink-0" />
          <span>
            Parabéns! Você desbloqueou <strong className="font-bold">Frete Grátis</strong> nesta compra! 🎉
          </span>
        </div>
        <div className="h-2.5 w-full bg-[#2D5A27]/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2D5A27] rounded-full transition-all duration-500 ease-out shadow-xs"
            style={{ width: '100%' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-xs transition-all duration-300 animate-in fade-in ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between text-xs gap-2 mb-2">
        <span className="text-stone-700 font-medium flex items-center gap-1.5 flex-wrap">
          <Truck size={15} className="text-[#2D5A27] shrink-0 inline" />
          <span>
            Faltam apenas <strong className="text-[#2D5A27] font-bold">{formattedRemaining}</strong> para você ganhar <strong className="text-[#2D5A27] font-bold">Frete Grátis</strong>! 🚚
          </span>
        </span>
        <span className="text-[11px] font-bold text-[#2D5A27] bg-[#2D5A27]/10 px-2 py-0.5 rounded-full shrink-0 ml-auto">
          {progress}%
        </span>
      </div>
      <div className="h-2.5 w-full bg-stone-200 rounded-full overflow-hidden relative">
        <div
          className="h-full bg-[#2D5A27] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default FreeShippingBar;
