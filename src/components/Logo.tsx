import React, { useState, useEffect } from 'react';
import logoSvgUrl from '../assets/logo.svg';
import logoIconUrl from '../assets/logo-icon.svg';

export const logoPngUrl = '/logo.png';
export { logoSvgUrl, logoIconUrl };

export interface LogoProps {
  /**
   * URL customizada da logo (se o admin configurar uma imagem externa ou Data URL no painel)
   */
  customUrl?: string;
  /**
   * Título principal (Padrão: "Maná")
   */
  title?: string;
  /**
   * Subtítulo (Padrão: "LANCHES SAUDÁVEIS")
   */
  subtitle?: string;
  /**
   * Classes Tailwind de tamanho e estilo
   * Exemplo: "h-12 sm:h-14 md:h-16 w-auto select-none"
   */
  className?: string;
  /**
   * Variante visual da logo
   */
  variant?: 'full' | 'icon' | 'image';
  /**
   * Texto alternativo para leitores de tela e acessibilidade
   */
  alt?: string;
  /**
   * Proporção esperada da logo (16:9, auto ou square)
   */
  aspectRatio?: '16:9' | 'square' | 'auto';
  /**
   * Escala da logo
   */
  scale?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({
  customUrl,
  className = 'h-12 sm:h-14 md:h-16 w-auto select-none',
  alt = 'Maná Lanches Saudáveis',
  aspectRatio,
}) => {
  const [imgError, setImgError] = useState(false);

  // Reseta o estado de erro caso o admin troque a URL customizada
  useEffect(() => {
    setImgError(false);
  }, [customUrl]);

  const logoSrc = (!imgError && customUrl) ? customUrl : '/logo.png';
  const isWidescreen = aspectRatio === '16:9';

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={`bg-transparent ${className} ${isWidescreen ? 'aspect-[16/9]' : ''} object-contain select-none transition-transform duration-300 hover:scale-105`}
      fetchPriority="high"
      decoding="async"
      loading="eager"
      onError={(e) => {
        if (!imgError && customUrl) {
          setImgError(true);
        } else {
          // Fallback caso a imagem não possa ser carregada
          e.currentTarget.src = '/favicon.svg';
        }
      }}
    />
  );
};

export default Logo;
