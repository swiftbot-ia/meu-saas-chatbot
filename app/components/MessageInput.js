'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Smile, 
  Sparkles, 
  Braces,
  MoreHorizontal,
  Loader2,
  X
} from 'lucide-react'

// Common emojis to avoid external dependency for now
const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
  '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒',
  '😞', '😔', 'mds', '😕', '😟', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐',
  '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
  '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️',
  '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐️',
  '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
  '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾'
]

const SYSTEM_VARIABLES = [
  { label: 'Primeiro Nome', value: '{{first_name}}' },
  { label: 'Sobrenome', value: '{{last_name}}' },
  { label: 'Nome Completo', value: '{{name}}' },
  { label: 'Telefone', value: '{{phone}}' },
  { label: 'Email', value: '{{email}}' },
  { label: 'Data Atual', value: '{{date}}' },
  { label: 'Hora Atual', value: '{{time}}' }
]

export default function MessageInput({ 
  value, 
  onChange, 
  placeholder = 'Digite sua mensagem...',
  rows = 4,
  className = '',
  disabled = false
}) {
  const [showEmojis, setShowEmojis] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const textareaRef = useRef(null)
  const containerRef = useRef(null)

  // Handle outside click to close popovers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowEmojis(false)
        setShowVariables(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const insertAtCursor = (text) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value.substring(0, start) + text + value.substring(end)
    
    onChange({ target: { value: newValue } })
    
    // Restore focus and move cursor
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
    
    setShowEmojis(false)
    setShowVariables(false)
  }

  const handleImproveText = async () => {
    if (!value.trim() || isImproving) return

    setIsImproving(true)
    try {
      const response = await fetch('/api/swiftbot-ia/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value })
      })
      
      const data = await response.json()
      
      if (data.success && data.improvedText) {
        onChange({ target: { value: data.improvedText } })
      } else {
        if (data.code === 'INSUFFICIENT_CREDITS') {
          alert('Créditos insuficientes para usar a IA.')
        } else {
          console.error('Failed to improve text:', data.error)
        }
      }
    } catch (error) {
      console.error('Error improving text:', error)
    } finally {
      setIsImproving(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className={`relative bg-[#252525] rounded-xl border border-white/10 focus-within:ring-2 focus-within:ring-[#00FF99]/30 transition-all ${className}`}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled || isImproving}
          className="w-full bg-transparent text-white px-4 py-3 pb-12 rounded-xl focus:outline-none resize-none"
        />
        
        {/* Toolbar */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1 bg-[#1A1A1A]/80 backdrop-blur-sm p-1 rounded-lg pointer-events-auto border border-white/5">
            
            {/* Variables Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowVariables(!showVariables); setShowEmojis(false); }}
                className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${showVariables ? 'text-[#00FF99] bg-white/5' : 'text-gray-400'}`}
                title="Inserir Variável"
              >
                <Braces size={16} />
              </button>
              
              {/* Variables Menu */}
              {showVariables && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 transform origin-bottom-left animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-2 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Campos do Sistema
                  </div>
                  <div className="max-h-48 overflow-y-auto py-1">
                    {SYSTEM_VARIABLES.map((v, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => insertAtCursor(v.value)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-between group"
                      >
                        {v.label}
                        <span className="text-xs text-gray-600 group-hover:text-gray-500 font-mono">{v.value}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Emoji Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowEmojis(!showEmojis); setShowVariables(false); }}
                className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${showEmojis ? 'text-yellow-400 bg-white/5' : 'text-gray-400'}`}
                title="Inserir Emoji"
              >
                <Smile size={16} />
              </button>

              {/* Emoji Picker */}
              {showEmojis && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 p-2 transform origin-bottom-left animate-in fade-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {COMMON_EMOJIS.map((emoji, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => insertAtCursor(emoji)}
                        className="p-1 hover:bg-white/10 rounded text-lg flex items-center justify-center transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Improve Button */}
            <div className="h-4 w-[1px] bg-white/10 mx-1" />
            
            <button
              type="button"
              onClick={handleImproveText}
              disabled={isImproving || !value.trim()}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all
                ${isImproving 
                  ? 'bg-[#00FF99]/10 text-[#00FF99]' 
                  : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                }
              `}
              title="Melhorar com IA (1 crédito)"
            >
              {isImproving ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              {isImproving ? 'Melhorando...' : 'MelhorarTexto'}
            </button>
          </div>

          {/* Char Count */}
          <div className="text-[10px] text-gray-500 font-mono px-2 py-1 bg-[#1A1A1A]/80 backdrop-blur-sm rounded-lg border border-white/5 pointer-events-auto">
             {value.length} chars
          </div>
        </div>
      </div>
    </div>
  )
}
