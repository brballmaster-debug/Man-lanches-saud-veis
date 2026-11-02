import React from 'react';
import { Order } from '../types';
import { ConciergeBell, ArrowRight, X, Volume2, Clock, MapPin, ShoppingBag } from 'lucide-react';
import { playOrderChime } from '../utils/adminNotification';

interface AdminNewOrderBannerProps {
  order: Order;
  onOpenOrder: (order: Order) => void;
  onDismiss: () => void;
}

export const AdminNewOrderBanner: React.FC<AdminNewOrderBannerProps> = ({
  order,
  onOpenOrder,
  onDismiss,
}) => {
  const isPickup =
    order.deliveryType === 'pickup' ||
    order.deliveryType === 'retirada' ||
    order.address?.street?.toUpperCase?.()?.includes('RETIRADA');

  const itemsCount = (order.items || []).reduce((acc, item) => acc + (item.quantity || 1), 0);
  const itemsText = (order.items || [])
    .map(i => `${i.quantity}x ${i.name}`)
    .slice(0, 3)
    .join(', ');
  const hasMoreItems = (order.items || []).length > 3;

  return (
    <aside 
      aria-label="Alerta de novo pedido"
      className="fixed top-3 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-[120] animate-in fade-in slide-in-from-top-6 duration-300"
    >
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 overflow-hidden ring-4 ring-emerald-500/20">
        {/* Barra superior de destaque com Sino de Restaurante */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-700 text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
            </span>
            <div className="flex items-center gap-1.5 font-bold text-sm tracking-wide">
              <ConciergeBell size={17} className="text-amber-300 animate-bounce" />
              <span>NOVO PEDIDO RECEBIDO!</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => playOrderChime()}
              className="p-1.5 rounded-lg hover:bg-white/15 text-emerald-100 hover:text-white transition-colors cursor-pointer"
              title="Tocar sino de restaurante novamente"
            >
              <Volume2 size={16} />
            </button>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg hover:bg-white/15 text-emerald-100 hover:text-white transition-colors cursor-pointer"
              title="Dispensar aviso"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Corpo do Pedido */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-bold text-gray-900 text-base leading-tight">
                {order.customerName || 'Cliente'}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Pedido #{order.id?.slice(-6)?.toUpperCase() || 'NOVO'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-semibold text-gray-500 block">Total</span>
              <span className="font-serif font-extrabold text-lg text-emerald-700">
                R$ {(order.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Resumo dos Itens */}
          <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100 text-xs text-gray-700 flex items-start gap-2">
            <ShoppingBag size={14} className="text-emerald-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-emerald-900">{itemsCount} item(ns): </span>
              <span className="text-gray-600 truncate inline-block max-w-[260px] align-bottom">
                {itemsText}
                {hasMoreItems ? '...' : ''}
              </span>
            </div>
          </div>

          {/* Dados de Entrega / Retirada */}
          <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-amber-600" />
              <span>{order.deliveryDate} às {order.deliveryTime}</span>
            </div>
            <div className="flex items-center gap-1 font-medium text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
              <MapPin size={12} />
              <span>{isPickup ? 'Retirada' : 'Entrega'}</span>
            </div>
          </div>

          {/* Ações */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => onOpenOrder(order)}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-700/20 active:scale-[0.98] cursor-pointer"
            >
              <span>Ver no Painel Admin</span>
              <ArrowRight size={15} />
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
