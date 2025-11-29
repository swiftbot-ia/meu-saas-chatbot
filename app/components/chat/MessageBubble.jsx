/**
 * MessageBubble Component
 * Displays an individual message in the chat
 */

import React from 'react';
import { Check, CheckCheck, Image, Video, FileText, Mic } from 'lucide-react';

export default function MessageBubble({ message, isOwn }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMediaContent = () => {
    if (!message.media_url) return null;

    switch (message.message_type) {
      case 'image':
        return (
          <div className="mb-1">
            <img
              src={message.media_url}
              alt="Imagem"
              className="max-w-xs rounded-md cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.media_url, '_blank')}
            />
          </div>
        );

      case 'video':
        return (
          <div className="mb-1">
            <video
              src={message.media_url}
              controls
              className="max-w-xs rounded-md"
            />
          </div>
        );

      case 'audio':
        return (
          <div className="mb-1">
            <audio src={message.media_url} controls className="w-64" />
          </div>
        );

      case 'document':
        return (
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center p-3 rounded-lg transition-colors mb-1 ${
              isOwn
                ? 'bg-[#056162] hover:bg-[#056162]/90'
                : 'bg-[#1F1F1F] hover:bg-[#2A2A2A]'
            }`}
          >
            <FileText className="w-6 h-6 mr-3" />
            <span className="font-medium">Documento</span>
          </a>
        );

      default:
        return null;
    }
  };

  const renderMediaIcon = () => {
    if (!message.media_url) return null;

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
      return <CheckCheck size={16} className="text-[#53BDEB]" />;
    } else if (message.status === 'delivered') {
      return <CheckCheck size={16} className="text-[#8696A0]" />;
    } else if (message.status === 'sent') {
      return <Check size={16} className="text-[#8696A0]" />;
    }

    return null;
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-md px-3 py-2 rounded-lg shadow-sm ${
          isOwn
            ? 'bg-[#005C4B] text-white rounded-tr-sm'
            : 'bg-[#202C33] text-[#E9EDEF] rounded-tl-sm'
        }`}
      >
        {/* Media content */}
        {renderMediaContent()}

        {/* Text content */}
        {message.message_content && (
          <p className="whitespace-pre-wrap break-words text-[14.2px] leading-[19px]">
            {renderMediaIcon()}
            {message.message_content}
          </p>
        )}

        {/* Timestamp and status */}
        <div className="flex items-center justify-end mt-1 space-x-1 min-w-[60px]">
          <span
            className={`text-[11px] ${
              isOwn ? 'text-[#8696A0]' : 'text-[#8696A0]'
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
