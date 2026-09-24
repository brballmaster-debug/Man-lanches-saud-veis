import React from 'react';

export interface ProductSkeletonProps {
  className?: string;
}

/**
 * Skeleton com efeito Shimmer para cards de produtos do catálogo.
 * Reproduz fielmente a proporção e o layout responsivo dos cards reais,
 * eliminando saltos de tela (Cumulative Layout Shift - CLS).
 */
export const ProductSkeleton: React.FC<ProductSkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-stone-200/60 overflow-hidden shadow-xs flex flex-col sm:flex-row transition-shadow animate-shimmer ${className}`}
      aria-hidden="true"
    >
      {/* Área da Imagem */}
      <div className="h-48 sm:h-auto sm:w-2/5 w-full bg-stone-200/80 animate-pulse shrink-0 relative" />

      {/* Área de Informações */}
      <div className="p-4 sm:p-4.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Título e Valor */}
          <div className="flex justify-between items-start mb-2 gap-2">
            <div className="h-4 w-3/4 bg-stone-200 animate-pulse rounded-md mb-1" />
            <div className="h-5 w-16 bg-[#2D5A27]/20 animate-pulse rounded shrink-0" />
          </div>

          {/* Simulação do status de estoque */}
          <div className="h-2.5 w-24 bg-stone-200/60 animate-pulse rounded mb-2.5" />

          {/* Simulação da descrição curta (duas barras suaves) */}
          <div className="space-y-1 mb-3">
            <div className="h-3 w-full bg-stone-200/70 animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-stone-200/70 animate-pulse rounded" />
          </div>
        </div>

        {/* Rodapé do card: Detalhes e Botão Adicionar */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-100">
          <div className="h-3.5 w-16 bg-stone-200/60 animate-pulse rounded" />
          <div className="h-8 w-24 bg-stone-200 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton com efeito Shimmer para banners de destaque e promoções.
 */
export const BannerSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`h-36 md:h-48 w-full bg-stone-200/80 animate-pulse rounded-2xl mb-6 animate-shimmer ${className}`}
      aria-hidden="true"
    />
  );
};

export default ProductSkeleton;
