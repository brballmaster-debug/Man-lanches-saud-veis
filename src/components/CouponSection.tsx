import React, { useState } from 'react';
import { Tag, X } from 'lucide-react';
import { Coupon } from '../types';
import { triggerHaptic } from '../utils/haptic';

export interface CouponSectionProps {
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  onApplyCoupon: (coupon: Coupon) => void;
  onRemoveCoupon: () => void;
  subtotal: number;
  className?: string;
}

export const CouponSection: React.FC<CouponSectionProps> = ({
  coupons,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  subtotal,
  className = ''
}) => {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');

  const handleApply = () => {
    const normalized = inputCode.trim().toUpperCase();
    if (!normalized) {
      setError('Digite o código do cupom');
      return;
    }

    const found = coupons.find(
      c => c.code.trim().toUpperCase() === normalized && c.isActive
    );

    if (!found) {
      setError('Cupom inválido ou expirado');
      triggerHaptic('light');
      return;
    }

    if (found.minOrderValue && subtotal < found.minOrderValue) {
      setError(`Pedido mínimo de R$ ${found.minOrderValue.toFixed(2).replace('.', ',')} não atingido`);
      triggerHaptic('light');
      return;
    }

    setError('');
    setInputCode('');
    triggerHaptic('success');
    onApplyCoupon(found);
  };

  if (appliedCoupon) {
    const discountLabel = appliedCoupon.discountType === 'percentage'
      ? `-${appliedCoupon.discountValue}%`
      : `-R$ ${appliedCoupon.discountValue.toFixed(2)}`;

    return (
      <div 
        className={`bg-[#2D5A27]/10 border border-[#2D5A27]/30 p-2.5 rounded-xl flex items-center justify-between mt-3 transition-all animate-in fade-in duration-200 ${className}`}
      >
        <div className="flex items-center gap-2 text-sm text-[#2D5A27]">
          <Tag size={16} className="text-[#2D5A27] shrink-0" />
          <span className="font-medium">
            Cupom <strong className="font-bold uppercase tracking-wide">{appliedCoupon.code}</strong> ({discountLabel})
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onRemoveCoupon();
          }}
          className="text-xs text-stone-500 hover:text-red-600 flex items-center gap-1 font-semibold transition-colors px-2 py-1 rounded-md hover:bg-red-50 cursor-pointer active:scale-95 duration-100 select-none"
          title="Remover cupom"
        >
          <X size={15} />
          <span>Remover</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`mt-3 ${className}`}>
      <div className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl border border-stone-200/80">
        <input
          type="text"
          value={inputCode}
          onChange={(e) => {
            setInputCode(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
          placeholder="CUPOM DE DESCONTO"
          className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm uppercase font-semibold text-stone-800 placeholder:normal-case placeholder:font-normal placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2D5A27] flex-1"
        />
        <button
          type="button"
          onClick={handleApply}
          className="bg-[#2D5A27] hover:bg-[#23471f] text-white text-xs font-semibold px-4 py-2.5 rounded-lg active:scale-95 transition-all select-none cursor-pointer shrink-0"
        >
          Aplicar
        </button>
      </div>
      {error && (
        <p className="text-xs font-medium text-red-600 px-1 mt-1.5 animate-in fade-in duration-200">
          {error}
        </p>
      )}
    </div>
  );
};

export default CouponSection;
