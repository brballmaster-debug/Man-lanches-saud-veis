import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Snowflake, 
  Flame, 
  Utensils, 
  Thermometer, 
  Lightbulb, 
  AlertCircle, 
  Check, 
  Heart, 
  Instagram, 
  BookOpen
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { CareGuideData, CareGuideItem, defaultCareGuideData } from '../types';
import { Logo } from './Logo';

export interface CareGuideProps {
  onClose: () => void;
  logoUrl?: string;
  homeTitle?: string;
}

/* Ícones ilustrados fiéis ao encarte Maná */
const AirFryerIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 4h12a3 3 0 0 1 3 3v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a3 3 0 0 1 3-3z" />
    <path d="M4 10h16" />
    <rect x="10" y="13" width="4" height="5" rx="1.5" />
    <circle cx="9" cy="7" r="0.7" fill="currentColor" />
    <circle cx="15" cy="7" r="0.7" fill="currentColor" />
  </svg>
);

const OvenIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="7" cy="8" r="1" fill="currentColor" />
    <circle cx="11" cy="8" r="1" fill="currentColor" />
    <circle cx="15" cy="8" r="1" fill="currentColor" />
    <rect x="6" y="11" width="12" height="7" rx="1" />
  </svg>
);

const MicrowaveIcon: React.FC<{ className?: string; avoid?: boolean }> = ({ className = "w-6 h-6", avoid = false }) => (
  <div className="relative inline-flex items-center justify-center">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="15" rx="2.5" />
      <rect x="6" y="7" width="10" height="9" rx="1" />
      <circle cx="18.5" cy="8" r="0.8" fill="currentColor" />
      <circle cx="18.5" cy="11.5" r="0.8" fill="currentColor" />
      <line x1="17.5" y1="14.5" x2="19.5" y2="14.5" />
    </svg>
    {avoid && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full h-0.5 bg-red-600 rotate-45 transform origin-center shadow-sm" />
        <div className="w-full h-0.5 bg-red-600 -rotate-45 transform origin-center shadow-sm" />
      </div>
    )}
  </div>
);

const FridgeIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="5" y="2" width="14" height="20" rx="3" />
    <line x1="5" y1="9" x2="19" y2="9" />
    <line x1="8" y1="5.5" x2="8" y2="7.5" strokeWidth="2" />
    <line x1="8" y1="12.5" x2="8" y2="15.5" strokeWidth="2" />
  </svg>
);

const CookieIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="9" cy="9" r="1.2" fill="currentColor" />
    <circle cx="15" cy="10" r="1" fill="currentColor" />
    <circle cx="11" cy="15" r="1.2" fill="currentColor" />
    <circle cx="15" cy="15" r="0.8" fill="currentColor" />
  </svg>
);

const LeafOrnament: React.FC<{ className?: string; flipped?: boolean }> = ({ className = "w-8 h-8", flipped = false }) => (
  <svg 
    viewBox="0 0 40 40" 
    fill="currentColor" 
    className={`${className} ${flipped ? 'scale-x-[-1]' : ''} text-[#657B57]`}
  >
    <path d="M10 32C10 32 14 18 30 10C30 10 24 26 10 32Z" opacity="0.85" />
    <path d="M22 20C18 24 14 28 10 32" stroke="#485B3C" strokeWidth="1.2" fill="none" />
    <path d="M6 24C6 24 12 12 24 6C24 6 18 18 6 24Z" opacity="0.6" />
  </svg>
);

export const CareGuide: React.FC<CareGuideProps> = ({ 
  onClose,
  logoUrl,
  homeTitle = 'Maná'
}) => {
  const [data, setData] = useState<CareGuideData>(defaultCareGuideData);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'care_guide'), (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data() as CareGuideData;
        setData({
          ...defaultCareGuideData,
          ...remoteData,
          items: remoteData.items || defaultCareGuideData.items,
          importantBullets: remoteData.importantBullets || defaultCareGuideData.importantBullets,
          manaWayPoints: remoteData.manaWayPoints || defaultCareGuideData.manaWayPoints
        });
      }
    }, (error) => {
      console.warn("Firestore [settings/care_guide] offline/reconnecting:", error.message);
    });

    return () => unsub();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#F4EFE6] overflow-y-auto font-sans antialiased text-[#333333] animate-in fade-in duration-300">
      {/* Botão Superior Fixo de Voltar */}
      <div className="sticky top-0 z-30 bg-[#F4EFE6]/95 backdrop-blur-md border-b border-[#D8CEBC]/60 px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 bg-[#2B4A28] hover:bg-[#20371E] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow"
        >
          <ArrowLeft size={16} />
          <span>Voltar ao Catálogo</span>
        </button>

        <span className="text-xs font-serif font-bold text-[#4B5E3C] tracking-wide uppercase">
          Guia de Conservação & Preparo
        </span>
      </div>

      {/* Conteúdo Central inspirado exatamente no folheto */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <div className="bg-[#FAF7F0] border border-[#DDD3C1] rounded-[28px] p-5 sm:p-8 md:p-10 shadow-lg relative overflow-hidden">
          
          {/* Folhas decorativas nos cantos */}
          <div className="absolute top-2 left-2 pointer-events-none">
            <LeafOrnament className="w-12 h-12 opacity-70" />
          </div>
          <div className="absolute top-2 right-2 pointer-events-none">
            <LeafOrnament className="w-12 h-12 opacity-70" flipped />
          </div>

          {/* HEADER DO GUIA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-[#E3D9C8] text-center sm:text-left relative z-10">
            <div className="flex items-center gap-4">
              <Logo 
                customUrl={logoUrl} 
                title={homeTitle} 
                className="h-16 sm:h-20 md:h-24 w-auto max-w-[220px] sm:max-w-[280px] object-contain select-none" 
              />
            </div>

            <div className="sm:border-l sm:border-[#DDD3C1] sm:pl-8 flex-1">
              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-wider text-[#243A1B]">
                {data.headerTitle || 'GUIA MANÁ'}
              </h1>
              <p className="text-sm sm:text-base font-medium text-[#4D5A42] mt-1 whitespace-pre-line leading-snug">
                {data.headerSubtitle || 'Sabor e equilíbrio na sua rotina.\nObrigada por escolher a Maná! ♥'}
              </p>
            </div>
          </div>

          {/* Subtítulo Introdutório */}
          <div className="py-5 text-center sm:text-left">
            <p className="text-sm sm:text-base font-semibold text-[#2D3E24]">
              {data.introText || 'Confira abaixo como conservar e preparar os seus lanchinhos.'}
            </p>
          </div>

          {/* GRID DE CARDS DOS PRODUTOS (2 Colunas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {data.items.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-2xl border border-[#DED4C3] p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div>
                  {/* Topo do Card: Título e Badge */}
                  <div className="bg-[#DFE7D8]/70 -mx-5 -mt-5 px-5 py-3 border-b border-[#D5DEC9] mb-4">
                    <h2 className="font-serif text-lg sm:text-xl font-black tracking-wide text-[#23381B] uppercase leading-tight">
                      {item.title}
                    </h2>
                    <p className="text-xs font-semibold text-[#54644B]">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Conservar */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#EBF0E6] text-[#2F4D24] flex items-center justify-center shrink-0 mt-0.5 border border-[#CCD8C4]">
                      {item.storageIcon === 'thermometer' ? (
                        <Thermometer size={18} />
                      ) : (
                        <Snowflake size={18} />
                      )}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-[#273F1E] uppercase tracking-wide">
                        Conservar:
                      </span>
                      <p className="text-xs sm:text-sm text-[#3E4A35] leading-relaxed">
                        {item.storageType}
                      </p>
                    </div>
                  </div>

                  {/* Se for Pronta para consumir */}
                  {item.readyToEat && (
                    <div className="flex items-center gap-3 my-6 p-4 rounded-xl bg-[#F6F9F2] border border-[#CCD8C4]">
                      <div className="w-10 h-10 rounded-full bg-[#DFE7D8] text-[#2F4D24] flex items-center justify-center shrink-0">
                        <CookieIcon className="w-6 h-6" />
                      </div>
                      <span className="font-serif text-base sm:text-lg font-bold text-[#23381B]">
                        Pronta para consumir!
                      </span>
                    </div>
                  )}

                  {/* Se tiver métodos de preparo */}
                  {(item.airFryer || item.oven || item.thawRefrigerator || item.microwave || item.prepareTitle) && (
                    <div className="mt-2 pt-3 border-t border-[#EAE3D4]">
                      {item.prepareTitle && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-full bg-[#EBF0E6] text-[#2F4D24] flex items-center justify-center shrink-0 border border-[#CCD8C4]">
                            {item.prepareIcon === 'utensils' ? (
                              <Utensils size={15} />
                            ) : (
                              <Flame size={15} />
                            )}
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-[#243A1B]">
                            {item.prepareTitle}
                          </span>
                        </div>
                      )}

                      {/* Grade de Métodos: Air Fryer e Forno */}
                      {(item.airFryer || item.oven) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          {item.airFryer && (
                            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F7F9F4] border border-[#DFE7D8]">
                              <AirFryerIcon className="w-6 h-6 text-[#2E4A23] shrink-0 mt-0.5" />
                              <div className="text-xs">
                                <span className="font-bold text-[#23381B] block">Air fryer:</span>
                                <span className="text-[#44503C] leading-snug">{item.airFryer}</span>
                              </div>
                            </div>
                          )}

                          {item.oven && (
                            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F7F9F4] border border-[#DFE7D8]">
                              <OvenIcon className="w-6 h-6 text-[#2E4A23] shrink-0 mt-0.5" />
                              <div className="text-xs">
                                <span className="font-bold text-[#23381B] block">Forno:</span>
                                <span className="text-[#44503C] leading-snug">{item.oven}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Descongelamento na Geladeira / Micro-ondas */}
                      {item.thawRefrigerator && (
                        <div className="space-y-2 mb-3">
                          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F7F9F4] border border-[#DFE7D8]">
                            <FridgeIcon className="w-6 h-6 text-[#2E4A23] shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <span className="font-bold text-[#23381B] block">Descongelamento na geladeira:</span>
                              <span className="text-[#44503C] leading-snug">{item.thawRefrigerator}</span>
                            </div>
                          </div>

                          {item.microwave && (
                            <div className="text-center py-0.5">
                              <span className="text-[11px] font-bold text-[#6D7B64] uppercase tracking-wider">OU</span>
                            </div>
                          )}

                          {item.microwave && (
                            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F7F9F4] border border-[#DFE7D8]">
                              <MicrowaveIcon className="w-6 h-6 text-[#2E4A23] shrink-0 mt-0.5" />
                              <div className="text-xs">
                                <span className="font-bold text-[#23381B] block">Micro-ondas:</span>
                                <span className="text-[#44503C] leading-snug">{item.microwave}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Observações de preparo */}
                      {item.notes && (
                        <p className="text-[11px] text-[#55634D] italic leading-snug mt-2">
                          {item.notes}
                        </p>
                      )}

                      {/* Alerta de evitar micro-ondas */}
                      {item.avoidMicrowaveNotice && (
                        <div className="flex items-center gap-2.5 mt-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                          <MicrowaveIcon className="w-5 h-5 text-amber-800 shrink-0" avoid />
                          <p className="text-xs text-amber-900 font-medium leading-tight">
                            {item.avoidMicrowaveNotice}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Rodapé do Card: Dica e/ou Sabores */}
                <div className="mt-4 pt-3 border-t border-[#EAE3D4] space-y-2">
                  {item.flavors && (
                    <div className="bg-[#F3EFE6] px-3 py-1.5 rounded-lg text-center">
                      <span className="text-xs font-semibold text-[#273F1E]">
                        {item.flavors}
                      </span>
                    </div>
                  )}

                  {item.tip && (
                    <div className="flex items-center gap-2 bg-[#F3EFE6] p-2 rounded-lg text-xs text-[#2A4320]">
                      <Lightbulb size={16} className="text-amber-600 shrink-0" />
                      <span className="font-medium leading-snug">{item.tip}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* CARDS INFERIORES (3 Colunas) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#DDD3C1]">
            {/* 1. IMPORTANTE */}
            <div className="bg-[#FAF7F0] border border-[#DDD3C1] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-[#34462C] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    !
                  </div>
                  <h3 className="font-serif text-sm font-bold text-[#23381B] uppercase tracking-wide">
                    Importante
                  </h3>
                </div>

                <ul className="space-y-2 text-xs text-[#44523C] leading-relaxed">
                  {data.importantBullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#34462C] font-bold">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 2. O JEITO MANÁ */}
            <div className="bg-[#FAF7F0] border border-[#DDD3C1] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-[#2F4D24] text-white flex items-center justify-center shrink-0">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <h3 className="font-serif text-sm font-bold text-[#23381B] uppercase tracking-wide">
                    O Jeito Maná
                  </h3>
                </div>

                <div className="space-y-2 text-xs text-[#44523C] mb-4">
                  {data.manaWayPoints.map((point, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check size={14} className="text-[#2F4D24] shrink-0" strokeWidth={3} />
                      <span className="font-medium">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="font-serif italic text-sm text-[#273F1E] font-bold text-center pt-2 border-t border-[#E5DCBE]">
                {data.manaWayNote || 'Feito com cuidado, para você. ♥'}
              </p>
            </div>

            {/* 3. FEITO PARA FACILITAR A SUA ROTINA */}
            <div className="bg-[#FAF7F0] border border-[#DDD3C1] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-[#2F4D24] text-white flex items-center justify-center shrink-0">
                    <Heart size={15} fill="currentColor" />
                  </div>
                  <h3 className="font-serif text-xs sm:text-sm font-bold text-[#23381B] uppercase tracking-wide leading-tight">
                    Feito para facilitar a sua rotina
                  </h3>
                </div>

                <p className="text-xs text-[#44523C] mb-3 leading-snug">
                  {data.routineText || 'Sabor e equilíbrio na sua rotina.'}
                </p>

                <div className="flex items-center gap-2 text-xs text-[#304725] bg-white p-2.5 rounded-xl border border-[#DFE7D8] mb-4">
                  <Instagram size={18} className="text-[#2F4D24] shrink-0" />
                  <div>
                    <span className="font-bold block text-[11px] leading-tight">Gostou?</span>
                    <span className="text-[11px] text-[#55634D]">
                      Marque a Maná nas suas fotos: <strong>{data.instagramHandle || '@manalanches'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-[#2F4D24] hover:bg-[#203617] text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <BookOpen size={14} />
                <span>VOLTAR PARA O CATÁLOGO</span>
              </button>
            </div>
          </div>

          {/* RODAPÉ DO ENCARTE */}
          <div className="mt-8 pt-4 border-t border-[#DDD3C1] flex items-center justify-center gap-3 text-center">
            <LeafOrnament className="w-6 h-6 opacity-70 hidden sm:block" />
            <p className="font-serif italic text-xs sm:text-sm text-[#3E5234] font-semibold">
              {data.footerThankYou || 'Obrigada por fazer parte deste começo! ♥'}
            </p>
            <LeafOrnament className="w-6 h-6 opacity-70 hidden sm:block" flipped />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareGuide;
