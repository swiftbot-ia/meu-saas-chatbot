/**
 * MediaModal Component
 * Fullscreen modal for viewing images and videos
 */

'use client';

import React from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';

export default function MediaModal({ mediaUrl, mediaType, onClose }) {
    const [zoom, setZoom] = React.useState(1);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = mediaUrl;
        link.download = mediaUrl.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

    // Close on escape
    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center space-x-2">
                    {mediaType === 'image' && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                title="Diminuir zoom"
                            >
                                <ZoomOut size={20} className="text-white" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                title="Aumentar zoom"
                            >
                                <ZoomIn size={20} className="text-white" />
                            </button>
                            <span className="text-white text-sm">{Math.round(zoom * 100)}%</span>
                        </>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        title="Baixar"
                    >
                        <Download size={20} className="text-white" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        title="Fechar (ESC)"
                    >
                        <X size={20} className="text-white" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {mediaType === 'image' ? (
                    <img
                        src={mediaUrl}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain transition-transform duration-200"
                        style={{ transform: `scale(${zoom})` }}
                    />
                ) : (
                    <video
                        src={mediaUrl}
                        controls
                        autoPlay
                        className="max-w-full max-h-full"
                    />
                )}
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-sm">
                Clique fora para fechar • ESC para sair
            </div>
        </div>
    );
}
