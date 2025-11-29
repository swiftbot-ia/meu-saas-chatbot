/**
 * ChatInput Component
 * Input field for sending messages with media support
 */

'use client';

import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, Smile } from 'lucide-react';

export default function ChatInput({ onSend, disabled = false }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim() || sending || disabled) return;

    setSending(true);
    try {
      await onSend({ text: message });
      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Arquivo muito grande. Tamanho máximo: 50MB');
      return;
    }

    setSending(true);
    try {
      await onSend({ file, caption: message || '' });
      setMessage('');
      e.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      alert('Erro ao enviar arquivo. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-[#2A2A2A] bg-[#1F1F1F] p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* File input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          onChange={handleFileChange}
          disabled={sending || disabled}
        />

        {/* Plus button (for actions menu - simplified to attachment) */}
        <button
          type="button"
          onClick={handleFileSelect}
          disabled={sending || disabled}
          className="p-2.5 text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A2A2A] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Anexar arquivo"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Message input */}
        <div className="flex-1 bg-[#2A2A2A] rounded-lg flex items-center px-3 py-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escrever uma mensagem"
            disabled={sending || disabled}
            rows={1}
            className="flex-1 bg-transparent text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              minHeight: '24px',
              maxHeight: '120px'
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />

          {/* Emoji button */}
          <button
            type="button"
            className="p-1 text-[#8696A0] hover:text-[#E9EDEF] transition-colors"
            title="Emoji"
          >
            <Smile size={20} />
          </button>
        </div>

        {/* Send/Mic button */}
        {message.trim() ? (
          <button
            type="submit"
            disabled={sending || disabled}
            className="p-2.5 bg-[#00A884] text-[#111] rounded-full hover:bg-[#00A884]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Enviar mensagem"
          >
            {sending ? (
              <div className="w-6 h-6 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            className="p-2.5 text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A2A2A] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Gravar áudio"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
        )}
      </form>
    </div>
  );
}
