/**
 * ChatInput Component
 * Input field for sending messages with media support and voice recording
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Smile, Mic } from 'lucide-react';

export default function ChatInput({ onSend, disabled = false }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState('0:00');
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

  // Recording timer
  useEffect(() => {
    let interval;
    let seconds = 0;

    if (isRecording) {
      interval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        setRecordingTime(`${mins}:${secs.toString().padStart(2, '0')}`);

        // Auto-stop after 60 seconds
        if (seconds >= 60) {
          stopRecording();
        }
      }, 1000);
    } else {
      setRecordingTime('0:00');
    }

    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `recording_${Date.now()}.webm`, { type: 'audio/webm' });

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Send audio file
        setSending(true);
        try {
          await onSend({ file, caption: '' });
        } catch (error) {
          console.error('Erro ao enviar áudio:', error);
          alert('Erro ao enviar áudio. Tente novamente.');
        } finally {
          setSending(false);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Erro ao access microfone:', error);
      alert('Permissão de microfone necessária para gravar áudio.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="border-t bg-white p-4">
      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-700 text-sm font-medium">Gravando...</span>
              <span className="text-red-600 font-mono text-sm">{recordingTime}</span>
            </div>
            <button
              onClick={stopRecording}
              className="text-red-700 hover:text-red-900 text-sm font-medium px-3 py-1 hover:bg-red-100 rounded transition-colors"
            >
              Parar
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* File input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          onChange={handleFileChange}
          disabled={sending || disabled || isRecording}
        />

        {/* Attachment button */}
        <button
          type="button"
          onClick={handleFileSelect}
          disabled={sending || disabled || isRecording}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Anexar arquivo"
        >
          <Paperclip size={20} />
        </button>

        {/* Message input */}
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite uma mensagem..."
            disabled={sending || disabled || isRecording}
            rows={1}
            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              minHeight: '40px',
              maxHeight: '120px'
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
        </div>

        {/* Dynamic button: Microphone OR Send */}
        {message.trim() ? (
          // Send button (when there's text)
          <button
            type="submit"
            disabled={sending || disabled}
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-500"
            title="Enviar mensagem"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        ) : (
          // Microphone button (when input is empty)
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={sending || disabled}
            className={`p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isRecording
                ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
          >
            <Mic size={20} />
          </button>
        )}
      </form>

      {/* Info text */}
      <p className="text-xs text-gray-500 mt-2 px-2">
        {isRecording
          ? 'Gravando áudio... Clique no botão vermelho para parar'
          : 'Enter para enviar, Shift+Enter para nova linha'}
      </p>
    </div>
  );
}
