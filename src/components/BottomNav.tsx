import React from 'react';
import { UtensilsCrossed, ReceiptText, Sparkles, ShoppingBag } from 'lucide-react';

export type BottomNavTab = 'menu' | 'orders' | 'guide' | 'cart';

export interface BottomNavProps {
  activeTab?: BottomNavTab;
  cartItemCount?: number;
  onSelectTab: (tab: BottomNavTab) => void;
  triggerHaptic?: (pattern?: 'light' | 'medium' | 'success' | 'warning') => boolean;
}

/**
 * Barra de Navegação Inferior Fixa (Bottom Navigation) otimizada para mobile.
 * Posiciona os principais acessos ao alcance natural do polegar,
 * respeitando a área segura de dispositivos modernos.
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab = 'menu',
  cartItemCount = 0,
  onSelectTab,
  triggerHaptic
}) => {
  const handleTabClick = (tab: BottomNavTab) => {
    if (triggerHaptic) {
      triggerHaptic('light');
    } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(35);
      } catch (e) {
        // Ignora silenciosamente
      }
    }
    onSelectTab(tab);
  };

  const navItems: Array<{
    id: BottomNavTab;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    hasBadge?: boolean;
  }> = [
    {
      id: 'menu',
      label: 'Cardápio',
      icon: UtensilsCrossed
    },
    {
      id: 'orders',
      label: 'Meus Pedidos',
      icon: ReceiptText
    },
    {
      id: 'guide',
      label: 'Guia Maná',
      icon: Sparkles
    },
    {
      id: 'cart',
      label: 'Carrinho',
      icon: ShoppingBag,
      hasBadge: true
    }
  ];

  return (
    <nav
      aria-label="Navegação inferior mobile"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#FDFCF6]/95 backdrop-blur-md border-t border-stone-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] sm:hidden"
    >
      <div className="grid grid-cols-4 items-center h-16 px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center gap-1 h-full py-1 text-center transition-colors active:scale-95 duration-150 relative cursor-pointer select-none ${
                isActive
                  ? 'text-[#2D5A27] font-bold'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  size={20}
                  className={`transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.3]' : 'scale-100 stroke-[1.8]'
                  }`}
                />

                {item.hasBadge && cartItemCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2.5 bg-[#2D5A27] text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-50 duration-200"
                    aria-label={`${cartItemCount} itens no carrinho`}
                  >
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] tracking-tight leading-none ${
                  isActive ? 'font-bold text-[#2D5A27]' : 'font-medium'
                }`}
              >
                {item.label}
              </span>

              {/* Indicador sutil de item ativo */}
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#2D5A27]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
