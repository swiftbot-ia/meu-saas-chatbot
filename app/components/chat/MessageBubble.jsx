/**
 * MessageBubble Component
 * Displays an individual message in the chat with media support
 */

'use client';

import React from 'react';
import { Check, CheckCheck, Clock, XCircle, Image as ImageIcon, Video as VideoIcon, FileText, Mic, Download, Play } from 'lucide-react';
import MediaModal from './MediaModal';

export default function MessageBubble({ message, isOwn }) {
  const [showTranscription, setShowTranscription] = React.useState(false);
  const [showMediaModal, setShowMediaModal] = React.useState(false);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getMediaUrl = () => {
    // Prefer local_media_path (stored on VPS) over media_url (external URL)
    if (message.local_media_path) {
      return message.local_media_path.startsWith('/')
        ? message.local_media_path
        : `/${message.local_media_path}`;
    }
    return message.media_url;
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || url.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMediaContent = () => {
    const mediaUrl = getMediaUrl();
    if (!mediaUrl && !message.transcription) return null;

    switch (message.message_type) {
      case 'image':
        return mediaUrl ? (
          <>
            <div
              className="mb-2 relative group cursor-pointer"
              onClick={() => setShowMediaModal(true)}
            >
              <img
                src={mediaUrl}
                alt="Imagem"
                className="max-w-[280px] rounded-lg transition-opacity group-hover:opacity-90"
                onError={(e) => {
                  console.error('Failed to load image:', mediaUrl);
                  // Hide broken image icon
                  e.target.style.display = 'none';
                  // Show error message
                  const errorDiv = e.target.nextSibling;
                  if (errorDiv) errorDiv.style.display = 'flex';
                }}
              />
              {/* Error fallback */}
              <div className="hidden w-[280px] h-40 bg-gray-100 rounded-lg items-center justify-center">
                <div className="text-center">
                  <ImageIcon size={48} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Imagem não disponível</p>
                </div>
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3">
                  <ImageIcon size={24} className="text-gray-700" />
                </div>
              </div>
            </div>
            {message.message_content && (
              <p className="text-sm mt-1">{message.message_content}</p>
            )}
          </>
        ) : null;

      case 'video':
        return mediaUrl ? (
          <>
            <div
              className="mb-2 relative group cursor-pointer"
              onClick={() => setShowMediaModal(true)}
            >
              <video
                src={mediaUrl}
                className="max-w-[280px] rounded-lg"
                poster={mediaUrl + '#t=0.1'}
              />
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 group-hover:bg-black/80 rounded-full p-4 transition-colors">
                  <Play size={32} className="text-white" fill="white" />
                </div>
              </div>
            </div>
            {message.message_content && (
              <p className="text-sm mt-1">{message.message_content}</p>
            )}
          </>
        ) : null;

      case 'audio':
        return (
          <div className="mb-2">
            {mediaUrl && (
              <audio src={mediaUrl} controls className="w-64 max-w-full" />
            )}
            {message.transcription && (
              <div className="mt-2">
                <button
                  onClick={() => setShowTranscription(!showTranscription)}
                  className={`text-xs flex items-center space-x-1 hover:underline ${isOwn ? 'text-green-100' : 'text-gray-600'
                    }`}
                >
                  <Mic size={12} />
                  <span>{showTranscription ? 'Ocultar transcrição' : 'Ver transcrição'}</span>
                </button>
                {showTranscription && (
                  <div className={`mt-2 p-2 rounded text-xs italic ${isOwn ? 'bg-green-600/30 text-green-50' : 'bg-gray-100 text-gray-700'
                    }`}>
                    "{message.transcription}"
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'document':
        return mediaUrl ? (
          <div className="mb-2">
            <button
              onClick={() => handleDownload(mediaUrl, message.message_content || 'documento')}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all hover:scale-[1.02] ${isOwn
                ? 'bg-green-600/30 border-green-400/30 hover:bg-green-600/40'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
            >
              <div className={`p-2 rounded ${isOwn ? 'bg-white/20' : 'bg-blue-50'}`}>
                <FileText size={24} className={isOwn ? 'text-white' : 'text-blue-600'} />
              </div>
              <div className="flex-1 text-left">
                <div className={`font-medium text-sm ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                  {message.message_content || 'Documento'}
                </div>
                <div className={`text-xs ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
                  Clique para baixar
                </div>
              </div>
              <Download size={20} className={isOwn ? 'text-white' : 'text-gray-400'} />
            </button>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const renderStatusIcon = () => {
    if (!isOwn) return null; // Only show status for own messages

    const iconClass = `w-4 h-4 ${message.status === 'sent' ? 'text-blue-400' : 'text-gray-400'
      }`;

    // Show status based on message.status
    if (message.status === 'sending') {
      return <Clock size={14} className="text-gray-400" />;
    }

    if (message.status === 'error') {
      return <XCircle size={14} className="text-red-500" />;
    }

    // Default: sent (double check)
    return <CheckCheck size={14} className={iconClass} />;
  };

  return (
    <>
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
        <div
          className={`max-w-md px-4 py-2 rounded-2xl shadow-sm ${isOwn
            ? 'bg-green-500 text-white rounded-br-none'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
            }`}
        >
          {/* Media content */}
          {renderMediaContent()}

          {/* Text content - Don't show for audio (transcription is in toggle) or if already shown in media */}
          {message.message_content &&
            message.message_type !== 'audio' &&
            message.message_type !== 'image' &&
            message.message_type !== 'video' &&
            message.message_type !== 'document' && (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {message.message_content}
              </p>
            )}

          {/* Timestamp and status */}
          <div className="flex items-center justify-end mt-1 space-x-1">
            <span
              className={`text-xs ${isOwn ? 'text-green-100' : 'text-gray-500'
                }`}
            >
              {formatTime(message.received_at)}
            </span>

            {renderStatusIcon()}
          </div>
        </div>
      </div>

      {/* Media Modal */}
      {showMediaModal && (message.message_type === 'image' || message.message_type === 'video') && (
        <MediaModal
          mediaUrl={getMediaUrl()}
          mediaType={message.message_type}
          onClose={() => setShowMediaModal(false)}
        />
      )}
    </>
  );
}
