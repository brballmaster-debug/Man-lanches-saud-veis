import React, { useState } from 'react';
import { Tag, Plus, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { Coupon } from '../types';

interface CouponManagerProps {
  coupons: Coupon[];
  onSaveCoupons: (updated: Coupon[]) => Promise<boolean>;
  isSaving: boolean;
  showToast: (msg: string) => void;
  triggerHaptic: (pattern: 'light' | 'medium' | 'success' | 'warning') => boolean;
}

export const CouponManager: React.FC<CouponManagerProps> = ({
  coupons,
  onSaveCoupons,
  isSaving,
  showToast,
  triggerHaptic
}) => {
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [formError, setFormError] = useState('');

  const handleToggle = async (targetCode: string) => {
    triggerHaptic('light');
    const updated = coupons.map(c => {
      if (c.code.toUpperCase() === targetCode.toUpperCase()) {
        return { ...c, isActive: !c.isActive };
      }
      return c;
    });

    const success = await onSaveCoupons(updated);
    if (success) {
      const item = updated.find(c => c.code.toUpperCase() === targetCode.toUpperCase());
      showToast(`Cupom ${targetCode} agora está ${item?.isActive ? 'Ativo' : 'Pausado'}.`);
    }
  };

  const handleDelete = async (targetCode: string) => {
    triggerHaptic('medium');
    if (!window.confirm(`Tem certeza que deseja excluir o cupom "${targetCode}"?`)) {
      return;
    }

    const updated = coupons.filter(c => c.code.toUpperCase() !== targetCode.toUpperCase());
    const success = await onSaveCoupons(updated);
    if (success) {
      showToast(`Cupom ${targetCode} removido com sucesso.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    
    if (!cleanCode) {
      setFormError('Digite o código do cupom.');
      triggerHaptic('light');
      return;
    }

    if (cleanCode.length < 3) {
      setFormError('O código deve ter pelo menos 3 caracteres.');
      triggerHaptic('light');
      return;
    }

    const val = parseFloat(discountValue.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      setFormError('Informe um valor de desconto válido maior que zero.');
      triggerHaptic('light');
      return;
    }

    if (discountType === 'percentage' && val > 100) {
      setFormError('O desconto em porcentagem não pode ultrapassar 100%.');
      triggerHaptic('light');
      return;
    }

    const minVal = minOrderValue.trim() ? parseFloat(minOrderValue.replace(',', '.')) : undefined;
    if (minVal !== undefined && (isNaN(minVal) || minVal < 0)) {
      setFormError('Informe um valor de pedido mínimo válido.');
      triggerHaptic('light');
      return;
    }

    const newCoupon: Coupon = {
      code: cleanCode,
      discountType,
      discountValue: val,
      isActive: true,
      ...(minVal !== undefined && minVal > 0 ? { minOrderValue: minVal } : {})
    };

    // Atualiza ou insere o cupom mantendo outros
    const updated = [newCoupon, ...coupons.filter(c => c.code.toUpperCase() !== cleanCode)];
    const success = await onSaveCoupons(updated);
    if (success) {
      showToast(`Cupom ${cleanCode} salvo com sucesso!`);
      setShowForm(false);
      setCode('');
      setDiscountValue('');
      setMinOrderValue('');
      setFormError('');
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-mana-gold/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-[#2D5A27]/10 p-2.5 rounded-xl text-[#2D5A27] shrink-0">
            <Tag size={24} />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-mana-green">Cupons de Desconto</h3>
            <p className="text-xs text-mana-text-light mt-0.5">
              Crie e gerencie códigos promocionais para seus clientes aplicarem no carrinho.
            </p>
          </div>
        </div>

        {!showForm && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setShowForm(true);
              setFormError('');
            }}
            className="bg-[#2D5A27] hover:bg-[#23471f] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all select-none cursor-pointer shrink-0"
          >
            <Plus size={18} />
            <span>Criar Novo Cupom</span>
          </button>
        )}
      </div>

      {/* Formulário Expansível de Novo Cupom */}
      {showForm && (
        <form 
          onSubmit={handleSubmit}
          className="bg-stone-50 border border-stone-200/90 rounded-2xl p-4 sm:p-5 mb-6 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
            <div className="flex items-center gap-2 text-stone-800 font-bold text-sm sm:text-base">
              <Plus size={18} className="text-[#2D5A27]" />
              <span>Novo Cupom Promocional</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowForm(false);
                setFormError('');
              }}
              className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition-colors cursor-pointer"
              title="Cancelar"
            >
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Código do Cupom *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase().replace(/\s+/g, ''));
                  if (formError) setFormError('');
                }}
                placeholder="Ex: MANA10, CLIENTENOVO"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27] uppercase"
                required
              />
              <span className="text-[11px] text-stone-500 mt-1 block">
                Letras maiúsculas sem espaços.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Tipo de Desconto *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setDiscountType('percentage');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                    discountType === 'percentage'
                      ? 'bg-[#2D5A27] text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>Porcentagem (%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setDiscountType('fixed');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                    discountType === 'fixed'
                      ? 'bg-[#2D5A27] text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>Valor Fixo (R$)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                {discountType === 'percentage' ? 'Valor do Desconto (%) *' : 'Valor do Desconto (R$) *'}
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                max={discountType === 'percentage' ? '100' : undefined}
                value={discountValue}
                onChange={(e) => {
                  setDiscountValue(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder={discountType === 'percentage' ? 'Ex: 10 para 10%' : 'Ex: 5.00 para R$ 5,00'}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Pedido Mínimo (Opcional)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                placeholder="Ex: 30.00 (deixe vazio se não houver)"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowForm(false);
                setFormError('');
              }}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-200 text-xs font-semibold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#2D5A27] hover:bg-[#23471f] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all select-none cursor-pointer disabled:opacity-50"
            >
              <Check size={16} />
              <span>{isSaving ? 'Salvando...' : 'Salvar Cupom'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de Cupons */}
      {coupons.length === 0 ? (
        <div className="text-center py-10 px-4 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
          <div className="w-12 h-12 rounded-full bg-stone-200 text-stone-500 mx-auto flex items-center justify-center mb-3">
            <Tag size={22} />
          </div>
          <p className="text-sm font-semibold text-stone-700">
            Nenhum cupom cadastrado.
          </p>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Crie o seu primeiro código promocional para presentear clientes e aumentar suas vendas!
          </p>
          {!showForm && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowForm(true);
              }}
              className="mt-4 bg-[#2D5A27] hover:bg-[#23471f] text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Criar Primeiro Cupom</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {coupons.map((coupon) => {
            const isPercentage = coupon.discountType === 'percentage';
            const discountLabel = isPercentage 
              ? `${coupon.discountValue}% OFF` 
              : `R$ ${coupon.discountValue.toFixed(2).replace('.', ',')} OFF`;

            return (
              <div
                key={coupon.code}
                className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                  coupon.isActive
                    ? 'bg-white border-stone-200/90 shadow-xs'
                    : 'bg-stone-50/70 border-stone-200/50 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-base text-stone-900 tracking-wide">
                        {coupon.code}
                      </span>
                      <span className="bg-[#2D5A27]/10 text-[#2D5A27] text-xs font-bold px-2 py-0.5 rounded-md">
                        {discountLabel}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500">
                      {coupon.minOrderValue && coupon.minOrderValue > 0 ? (
                        <>Mínimo: <strong className="text-stone-700">R$ {coupon.minOrderValue.toFixed(2).replace('.', ',')}</strong></>
                      ) : (
                        'Sem valor mínimo de pedido'
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(coupon.code)}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer select-none"
                    title={`Excluir cupom ${coupon.code}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  <span className={`text-xs font-medium ${coupon.isActive ? 'text-[#2D5A27]' : 'text-stone-400'}`}>
                    Status: <strong className="font-bold">{coupon.isActive ? 'Ativo' : 'Pausado'}</strong>
                  </span>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={coupon.isActive}
                    onClick={() => handleToggle(coupon.code)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer select-none ${
                      coupon.isActive ? 'bg-[#2D5A27]' : 'bg-stone-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-xs ${
                        coupon.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CouponManager;
