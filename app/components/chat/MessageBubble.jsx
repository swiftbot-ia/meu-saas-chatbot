/**
 * MessageBubble Component
 * Displays an individual message in the chat
 */

'use client';

import React from 'react';
import { Check, CheckCheck, Image, Video, FileText, Mic } from 'lucide-react';

export default function MessageBubble({ message, isOwn }) {
  const [showTranscription, setShowTranscription] = React.useState(false);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getMediaUrl = () => {
    // DEBUG: Log message data for audio messages
    if (message.message_type === 'audio') {
      console.log('🔍 Audio Message Debug:', {
        message_id: message.message_id,
        local_media_path: message.local_media_path,
        media_url: message.media_url,
        transcription: message.transcription,
        full_message: message
      });
    }

    // Prefer local_media_path (stored on VPS) over media_url (external URL)
    if (message.local_media_path) {
      return `/${message.local_media_path}`;
    }
    return message.media_url;
  };

  const renderMediaContent = () => {
    const mediaUrl = getMediaUrl();
    if (!mediaUrl && !message.transcription) return null;

    switch (message.message_type) {
      case 'image':
        return mediaUrl ? (
          <div className="mb-2">
            <img
              src={mediaUrl}
              alt="Imagem"
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(mediaUrl, '_blank')}
            />
          </div>
        ) : null;

      case 'video':
        return mediaUrl ? (
          <div className="mb-2">
            <video
              src={mediaUrl}
              controls
              className="max-w-xs rounded-lg"
            />
          </div>
        ) : null;

      case 'audio':
        return (
          <div className="mb-2">
            {mediaUrl && (
              <audio src={mediaUrl} controls className="w-64" />
            )}
            {message.transcription && (
              <div className="mt-2">
                <button
                  onClick={() => setShowTranscription(!showTranscription)}
                  className={`text-xs flex items-center space-x-1 hover:underline ${
                    isOwn ? 'text-green-100' : 'text-gray-600'
                  }`}
                >
                  <Mic size={12} />
                  <span>{showTranscription ? 'ocultar transcrição' : 'ver transcrição'}</span>
                </button>
                {showTranscription && (
                  <div className={`mt-1 text-xs italic ${
                    isOwn ? 'text-green-100' : 'text-gray-500'
                  }`}>
                    {message.transcription}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'document':
        return mediaUrl ? (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-3 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition-colors mb-2"
          >
            <FileText className="w-6 h-6 mr-3" />
            <span className="font-medium">Documento</span>
          </a>
        ) : null;

      default:
        return null;
    }
  };

  const renderMediaIcon = () => {
    if (!message.media_url && !message.local_media_path) return null;

    const iconProps = { size: 16, className: 'inline mr-1' };

    switch (message.message_type) {
      case 'image':
        return <Image {...iconProps} />;
      case 'video':
        return <Video {...iconProps} />;
      case 'audio':
        return <Mic {...iconProps} />;
      case 'document':
        return <FileText {...iconProps} />;
      default:
        return null;
    }
  };

  const renderStatusIcon = () => {
    if (!isOwn) return null;

    if (message.status === 'read') {
      return <CheckCheck size={16} className="text-blue-400" />;
    } else if (message.status === 'delivered') {
      return <CheckCheck size={16} />;
    } else if (message.status === 'sent') {
      return <Check size={16} />;
    }

    return null;
  };

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
        {renderMediaContent()}

        {/* Text content */}
        {message.message_content && (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {renderMediaIcon()}
            {message.message_content}
          </p>
        )}

        {/* Timestamp and status */}
        <div className="flex items-center justify-end mt-1 space-x-1">
          <span
            className={`text-xs ${
              isOwn ? 'text-green-100' : 'text-gray-500'
            }`}
          >
            {formatTime(message.received_at)}
          </span>

          {renderStatusIcon()}
        </div>
      </div>
    </div>
  );
}
