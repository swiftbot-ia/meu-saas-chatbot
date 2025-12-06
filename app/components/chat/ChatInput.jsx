'use client';

import React, { useState, useRef } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';
import AudioRecorder from './AudioRecorder';

export default function ChatInput({ onSend, disabled = false }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only check message content and disabled, allow parallel sends
    if (!message.trim() || disabled) return;

    // Clear input immediately (optimistic UI) so user can type next message right away
    const messageToSend = message;
    setMessage('');

    // Focus back to input immediately
    setTimeout(() => textareaRef.current?.focus(), 0);

    // Send message in background (don't block UI)
    try {
      await onSend({ text: messageToSend });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem: ' + messageToSend);
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

  const handleAudioSend = async (audioFile, duration) => {
    setIsRecording(false);
    setSending(true);
    try {
      await onSend({ file: audioFile, duration });
    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
      alert('Erro ao enviar áudio. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 relative">
      <form onSubmit={handleSubmit} className="relative z-10">
        {/* File input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          onChange={handleFileChange}
          disabled={sending || disabled || isRecording}
        />

        {/* Floating capsule container */}
        <div className={`bg-[#1E1E1E] rounded-full shadow-lg shadow-black/40 flex items-center px-2 py-2 ${isRecording ? 'justify-between' : ''}`}>

          {isRecording ? (
            <AudioRecorder
              onSend={handleAudioSend}
              onCancel={() => setIsRecording(false)}
            />
          ) : (
            <>
              {/* Attachment button */}
              <button
                type="button"
                onClick={handleFileSelect}
                disabled={sending || disabled}
                className="p-3 text-gray-400 hover:text-[#00FF99] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                title="Anexar arquivo"
              >
                <Paperclip size={20} />
              </button>

              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite uma mensagem..."
                disabled={disabled}
                rows={1}
                className="flex-1 bg-transparent text-white placeholder-gray-500 px-3 py-2 outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  minHeight: '20px',
                  maxHeight: '120px'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />

              {/* Send/Mic button - Toggle based on message content */}
              {message.trim() ? (
                // Send button when there's text
                <button
                  type="submit"
                  disabled={sending || disabled}
                  className="p-3 bg-[#00FF99] text-black rounded-full hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Enviar mensagem"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              ) : (
                // Mic button when empty
                <button
                  type="button"
                  disabled={disabled}
                  className="p-3 text-gray-400 hover:text-[#00FF99] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Gravar áudio"
                  onClick={() => setIsRecording(true)}
                >
                  <Mic size={20} />
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
}
