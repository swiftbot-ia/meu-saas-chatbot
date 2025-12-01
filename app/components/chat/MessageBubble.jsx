/**
 * MessageBubble Component
 * Displays an individual message in the chat
 * Supports: text, image, video, audio, document
 */

'use client';

import React, { useState } from 'react';
import {
  Check,
  CheckCheck,
  Image as ImageIcon,
  Video,
  FileText,
  Mic,
  Download,
  Play,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function MessageBubble({ message, isOwn }) {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Get document name from content or URL
  const getDocumentName = () => {
    if (message.message_content && message.message_content.trim()) {
      return message.message_content;
    }
    if (message.media_url) {
      try {
        const url = new URL(message.media_url);
        const pathname = url.pathname;
        const filename = pathname.split('/').pop();
        return decodeURIComponent(filename) || 'Documento';
      } catch {
        return 'Documento';
      }
    }
    return 'Documento';
  };

  // Render placeholder for media without URL
  const renderMediaPlaceholder = (type) => {
    const placeholderConfig = {
      image: {
        icon: ImageIcon,
        label: 'Imagem',
        bgClass: 'bg-blue-100 text-blue-600'
      },
      video: {
        icon: Video,
        label: 'Video',
        bgClass: 'bg-purple-100 text-purple-600'
      },
      audio: {
        icon: Mic,
        label: 'Audio',
        bgClass: 'bg-orange-100 text-orange-600'
      },
      document: {
        icon: FileText,
        label: getDocumentName(),
        bgClass: 'bg-gray-100 text-gray-600'
      }
    };

    const config = placeholderConfig[type] || placeholderConfig.document;
    const Icon = config.icon;

    return (
      <div className={`flex items-center p-3 rounded-lg mb-2 ${isOwn ? 'bg-green-600/30' : config.bgClass}`}>
        <div className={`p-2 rounded-full ${isOwn ? 'bg-green-600/50' : 'bg-white/50'} mr-3`}>
          <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${isOwn ? 'text-white' : 'text-gray-800'}`}>
            {config.label}
          </p>
          <p className={`text-xs ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
            Midia nao disponivel
          </p>
        </div>
      </div>
    );
  };

  // Render error state for failed media
  const renderMediaError = (type) => {
    const Icon = type === 'image' ? ImageIcon : type === 'video' ? Video : Mic;

    return (
      <div className={`flex items-center p-3 rounded-lg mb-2 ${isOwn ? 'bg-green-600/30' : 'bg-red-50'}`}>
        <div className={`p-2 rounded-full ${isOwn ? 'bg-green-600/50' : 'bg-red-100'} mr-3`}>
          <AlertCircle size={24} className={isOwn ? 'text-white' : 'text-red-500'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${isOwn ? 'text-white' : 'text-gray-800'}`}>
            {type === 'image' ? 'Imagem' : type === 'video' ? 'Video' : 'Audio'}
          </p>
          <p className={`text-xs ${isOwn ? 'text-green-100' : 'text-red-500'}`}>
            Midia expirada ou indisponivel
          </p>
        </div>
        {message.media_url && (
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-full ${isOwn ? 'hover:bg-green-600/50' : 'hover:bg-gray-100'}`}
            title="Tentar abrir"
          >
            <ExternalLink size={18} />
          </a>
        )}
      </div>
    );
  };

  const renderMediaContent = () => {
    const hasMedia = message.media_url && message.media_url.trim();
    const messageType = message.message_type;

    // Handle different message types
    switch (messageType) {
      case 'image':
        if (!hasMedia) {
          return renderMediaPlaceholder('image');
        }
        if (imageError) {
          return renderMediaError('image');
        }
        return (
          <div className="mb-2">
            <img
              src={message.media_url}
              alt="Imagem"
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.media_url, '_blank')}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </div>
        );

      case 'video':
        if (!hasMedia) {
          return renderMediaPlaceholder('video');
        }
        if (videoError) {
          return renderMediaError('video');
        }
        return (
          <div className="mb-2 relative">
            <video
              src={message.media_url}
              controls
              className="max-w-xs rounded-lg"
              onError={() => setVideoError(true)}
              preload="metadata"
            />
          </div>
        );

      case 'audio':
        if (!hasMedia) {
          return renderMediaPlaceholder('audio');
        }
        if (audioError) {
          return renderMediaError('audio');
        }
        return (
          <div className={`mb-2 p-3 rounded-lg ${isOwn ? 'bg-green-600/30' : 'bg-gray-100'}`}>
            <div className="flex items-center mb-2">
              <div className={`p-2 rounded-full ${isOwn ? 'bg-green-600/50' : 'bg-white'} mr-3`}>
                <Mic size={20} />
              </div>
              <span className="font-medium text-sm">Mensagem de voz</span>
            </div>
            <audio
              src={message.media_url}
              controls
              className="w-full max-w-[280px]"
              onError={() => setAudioError(true)}
              preload="metadata"
            />
          </div>
        );

      case 'document':
        const docName = getDocumentName();
        if (!hasMedia) {
          return (
            <div className={`flex items-center p-3 rounded-lg mb-2 ${isOwn ? 'bg-green-600/30' : 'bg-gray-100'}`}>
              <div className={`p-2 rounded-full ${isOwn ? 'bg-green-600/50' : 'bg-white'} mr-3`}>
                <FileText size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                  {docName}
                </p>
                <p className={`text-xs ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
                  Documento
                </p>
              </div>
            </div>
          );
        }
        return (
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center p-3 rounded-lg mb-2 transition-colors ${
              isOwn
                ? 'bg-green-600/30 hover:bg-green-600/50'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <div className={`p-2 rounded-full ${isOwn ? 'bg-green-600/50' : 'bg-white'} mr-3`}>
              <FileText size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                {docName}
              </p>
              <p className={`text-xs ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
                Documento - Clique para baixar
              </p>
            </div>
            <Download size={18} className={isOwn ? 'text-white' : 'text-gray-500'} />
          </a>
        );

      default:
        return null;
    }
  };

  const renderStatusIcon = () => {
    if (!isOwn) return null;

    const status = message.status;

    if (status === 'read') {
      return <CheckCheck size={16} className="text-blue-400" />;
    } else if (status === 'delivered') {
      return <CheckCheck size={16} className={isOwn ? 'text-green-200' : 'text-gray-400'} />;
    } else if (status === 'sent') {
      return <Check size={16} className={isOwn ? 'text-green-200' : 'text-gray-400'} />;
    } else if (status === 'pending') {
      return <Check size={16} className={isOwn ? 'text-green-300/50' : 'text-gray-300'} />;
    } else if (status === 'failed') {
      return <AlertCircle size={16} className="text-red-400" />;
    }

    return null;
  };

  // Check if message has any content to display
  const hasMediaContent = ['image', 'video', 'audio', 'document'].includes(message.message_type);
  const hasTextContent = message.message_content && message.message_content.trim();

  // If no content at all, show a minimal message indicator
  if (!hasMediaContent && !hasTextContent) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
        <div
          className={`max-w-md px-4 py-2 rounded-2xl shadow-sm ${
            isOwn
              ? 'bg-green-500 text-white rounded-br-none'
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
          }`}
        >
          <p className={`text-sm italic ${isOwn ? 'text-green-100' : 'text-gray-400'}`}>
            Mensagem vazia
          </p>
          <div className="flex items-center justify-end mt-1 space-x-1">
            <span className={`text-xs ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
              {formatTime(message.received_at)}
            </span>
            {renderStatusIcon()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-md px-4 py-2 rounded-2xl shadow-sm ${
          isOwn
            ? 'bg-green-500 text-white rounded-br-none'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
        }`}
      >
        {/* Media content */}
        {hasMediaContent && renderMediaContent()}

        {/* Text content - only show if it's text type or has caption */}
        {hasTextContent && message.message_type !== 'document' && (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.message_content}
          </p>
        )}

        {/* Timestamp and status */}
        <div className="flex items-center justify-end mt-1 space-x-1">
          <span className={`text-xs ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
            {formatTime(message.received_at)}
          </span>
          {renderStatusIcon()}
        </div>
      </div>
    </div>
  );
}
