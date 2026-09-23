import React, { useState, useEffect } from 'react';
import logoSvgUrl from '../assets/logo.svg';
import logoIconUrl from '../assets/logo-icon.svg';

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
   * - 'full': Logotipo completo com relógio dourado, ponteiros, Maná verde e Lanches Saudáveis
   * - 'icon': Apenas o símbolo do relógio estilizado
   * - 'image': Utiliza o arquivo SVG oficial importado via módulo Vite
   */
  variant?: 'full' | 'icon' | 'image';
  /**
   * Texto alternativo para leitores de tela e acessibilidade
   */
  alt?: string;
}

export const Logo: React.FC<LogoProps> = ({
  customUrl,
  title = 'Maná',
  subtitle = 'LANCHES SAUDÁVEIS',
  className = 'h-12 sm:h-14 md:h-16 w-auto select-none',
  variant = 'full',
  alt = 'Maná Lanches Saudáveis',
}) => {
  const [imgError, setImgError] = useState(false);

  // Reseta o estado de erro se a URL mudar
  useEffect(() => {
    setImgError(false);
  }, [customUrl]);

  // Se houver uma URL customizada configurada pelo admin e ela não falhou
  if (customUrl && !imgError) {
    return (
      <img
        src={customUrl}
        alt={alt}
        className={`${className} object-contain select-none transition-transform duration-300 hover:scale-105`}
        loading="eager"
        decoding="async"
        onError={() => setImgError(true)}
      />
    );
  }

  // Variante usando imagem importada pelo bundler Vite
  if (variant === 'image') {
    return (
      <img
        src={logoSvgUrl}
        alt={alt}
        className={`${className} object-contain select-none`}
        loading="eager"
        decoding="async"
      />
    );
  }

  // Ícone / Favicon circular
  if (variant === 'icon') {
    return (
      <img
        src={logoIconUrl}
        alt={alt}
        className={`${className} object-contain select-none`}
        loading="eager"
        decoding="async"
      />
    );
  }

  // Variante vetorial padrão: máxima nitidez Retina/4K, sem distorção
  return (
    <div 
      className={`inline-flex items-center select-none ${className}`}
      role="img"
      aria-label={alt}
      title={alt}
    >
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto aspect-square object-contain transition-transform duration-300 hover:scale-105"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="compGoldClockGrad" x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#C5A666" />
            <stop offset="25%" stopColor="#DFCB99" />
            <stop offset="50%" stopColor="#C1A05A" />
            <stop offset="75%" stopColor="#E9DBB4" />
            <stop offset="100%" stopColor="#9E7E3C" />
          </linearGradient>

          <linearGradient id="compGoldDetailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D8C28E" />
            <stop offset="50%" stopColor="#BE9E5A" />
            <stop offset="100%" stopColor="#9C7B38" />
          </linearGradient>

          <linearGradient id="compManaGreenText" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#557F2B" />
            <stop offset="45%" stopColor="#42651F" />
            <stop offset="100%" stopColor="#2D4814" />
          </linearGradient>

          <linearGradient id="compLeafAccentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3C611C" />
            <stop offset="50%" stopColor="#5D922E" />
            <stop offset="100%" stopColor="#7EB942" />
          </linearGradient>

          <filter id="compManaShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#263813" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Arco Superior do Relógio Dourado */}
        <path 
          d="M 112 230 A 150 150 0 0 1 388 230" 
          stroke="url(#compGoldClockGrad)" 
          strokeWidth="4.5" 
          strokeLinecap="round" 
          fill="none" 
        />

        {/* Marcadores Horários */}
        <line x1="250" y1="92" x2="250" y2="110" stroke="url(#compGoldDetailGrad)" strokeWidth="3" strokeLinecap="round" />
        <line x1="197" y1="106" x2="204" y2="123" stroke="url(#compGoldDetailGrad)" strokeWidth="2.6" strokeLinecap="round" />
        <line x1="152" y1="145" x2="164" y2="159" stroke="url(#compGoldDetailGrad)" strokeWidth="2.6" strokeLinecap="round" />
        <line x1="303" y1="106" x2="296" y2="123" stroke="url(#compGoldDetailGrad)" strokeWidth="2.6" strokeLinecap="round" />
        <line x1="348" y1="145" x2="336" y2="159" stroke="url(#compGoldDetailGrad)" strokeWidth="2.6" strokeLinecap="round" />

        {/* Ponteiros e Pivô Central */}
        <g transform="translate(250, 226)">
          <path d="M -1.8 0 L -1.2 -48 Q 0 -54 1.2 -48 L 1.8 0 Z" fill="url(#compGoldDetailGrad)" />
          <g transform="rotate(42)">
            <path d="M -2 0 L -1.5 -34 Q 0 -40 1.5 -34 L 2 0 Z" fill="url(#compGoldDetailGrad)" />
          </g>
          <circle cx="0" cy="0" r="7.5" fill="url(#compGoldClockGrad)" />
          <circle cx="0" cy="0" r="3.5" fill="#FDFBF7" opacity="0.6" />
        </g>

        {/* Palavra "Maná" com Caligrafia Cursiva Verde */}
        <g filter="url(#compManaShadow)">
          {/* M cursivo */}
          <path 
            d="M 94 250 
               C 88 238 98 230 110 232 
               C 126 235 131 254 128 274 
               C 125 292 118 300 112 300 
               C 107 300 106 295 110 280 
               C 116 256 123 234 135 234 
               C 145 234 148 248 147 266 
               C 145 284 142 296 142 296
               C 142 296 154 246 168 238 
               C 178 232 186 238 184 254 
               C 181 274 177 288 174 296 
               C 172 301 176 303 182 298
               C 188 293 194 284 198 274" 
            fill="none" 
            stroke="url(#compManaGreenText)" 
            strokeWidth="16" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* a conectado */}
          <path 
            d="M 235 258 
               C 230 245 212 242 202 254 
               C 192 266 193 286 206 297 
               C 217 304 233 298 236 284
               L 236 296
               C 236 300 242 302 248 296
               C 255 289 259 278 261 268" 
            fill="none" 
            stroke="url(#compManaGreenText)" 
            strokeWidth="14" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M 233 260 
               C 233 250 216 248 207 260 
               C 197 272 198 288 209 294 
               C 219 299 233 292 233 276 Z" 
            fill="url(#compManaGreenText)" 
          />

          {/* n cursivo */}
          <path 
            d="M 261 270 
               C 265 256 270 245 279 245 
               C 287 245 289 255 286 270 
               L 282 296 
               M 284 266 
               C 290 252 301 245 311 246 
               C 321 248 322 258 319 274 
               L 315 296 
               C 314 300 320 302 326 296
               C 334 288 338 276 341 266" 
            fill="none" 
            stroke="url(#compManaGreenText)" 
            strokeWidth="14" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* á cursivo final */}
          <path 
            d="M 374 258 
               C 369 245 351 242 341 254 
               C 331 266 332 286 345 297 
               C 356 304 372 298 375 284
               L 375 296
               C 375 301 384 304 394 297
               C 404 290 412 278 418 266" 
            fill="none" 
            stroke="url(#compManaGreenText)" 
            strokeWidth="14" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M 372 260 
               C 372 250 355 248 346 260 
               C 336 272 337 288 348 294 
               C 358 299 372 292 372 276 Z" 
            fill="url(#compManaGreenText)" 
          />

          {/* Folha Verde Orgânica no topo do 'á' */}
          <g transform="translate(382, 218) rotate(-22)">
            <path 
              d="M 0 24 
                 C -12 16 -18 2 0 -22 
                 C 18 2 12 16 0 24 Z" 
              fill="url(#compLeafAccentGrad)" 
            />
            <path 
              d="M 0 22 C 0 8 0 -6 0 -18" 
              stroke="#284410" 
              strokeWidth="1.2" 
              strokeLinecap="round" 
              opacity="0.6" 
            />
          </g>
        </g>

        {/* Subtítulo "LANCHES SAUDÁVEIS" */}
        <text 
          x="250" 
          y="330" 
          textAnchor="middle" 
          fontFamily="'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          fontSize="19" 
          fontWeight="500" 
          letterSpacing="0.22em" 
          fill="#576348"
        >
          {subtitle}
        </text>

        {/* Arco Inferior do Relógio */}
        <path 
          d="M 160 365 A 150 150 0 0 0 340 365" 
          stroke="url(#compGoldClockGrad)" 
          strokeWidth="4.5" 
          strokeLinecap="round" 
          fill="none" 
        />
        {/* Marcador 6h */}
        <line x1="250" y1="372" x2="250" y2="390" stroke="url(#compGoldDetailGrad)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export default Logo;
