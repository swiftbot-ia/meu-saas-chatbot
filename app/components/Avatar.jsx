'use client';

import { useState } from 'react';

/**
 * Avatar com fallback automático
 * Se a imagem falhar ao carregar, mostra iniciais
 */
export default function Avatar({
    src,
    name,
    size = 48,
    className = ''
}) {
    const [hasError, setHasError] = useState(false);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    };

    const sizeClasses = {
        32: 'w-8 h-8 text-sm',
        40: 'w-10 h-10 text-sm',
        48: 'w-12 h-12 text-base',
        56: 'w-14 h-14 text-lg',
        64: 'w-16 h-16 text-xl',
    };

    const sizeClass = sizeClasses[size] || `w-[${size}px] h-[${size}px]`;

    // Se tem src válido e não houve erro, mostra imagem
    if (src && !hasError) {
        return (
            <img
                src={src}
                alt={name || 'Avatar'}
                className={`${sizeClass} rounded-full object-cover ${className}`}
                onError={() => setHasError(true)}
            />
        );
    }

    // Fallback: iniciais com gradiente
    return (
        <div
            className={`${sizeClass} rounded-full flex items-center justify-center text-white font-semibold ${className}`}
            style={{ background: 'linear-gradient(135deg, #00FF99 0%, #00E88C 100%)' }}
        >
            {getInitials(name)}
        </div>
    );
}
