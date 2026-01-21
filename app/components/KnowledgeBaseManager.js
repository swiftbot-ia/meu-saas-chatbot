'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * KnowledgeBaseManager Component
 * Modal for managing agent's knowledge base with:
 * - Category creation
 * - Text input or file upload (txt, pdf, doc, docx, xlsx)
 * - Document listing and deletion
 */
export default function KnowledgeBaseManager({ agentId, isOpen, onClose }) {
    const [documents, setDocuments] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    // Form state
    const [inputType, setInputType] = useState('text') // 'text' | 'file'
    const [selectedCategory, setSelectedCategory] = useState('')
    const [newCategoryName, setNewCategoryName] = useState('')
    const [showNewCategory, setShowNewCategory] = useState(false)
    const [title, setTitle] = useState('')
    const [textContent, setTextContent] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)

    const fileInputRef = useRef(null)

    // Load documents and categories when modal opens
    useEffect(() => {
        if (isOpen) {
            loadData()
        }
    }, [isOpen])

    const loadData = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/agent/documents')
            const data = await res.json()
            if (res.ok) {
                setDocuments(data.documents || [])
                setCategories(data.categories || [])
                if (data.categories?.length > 0 && !selectedCategory) {
                    setSelectedCategory(data.categories[0].name)
                }
            } else {
                setError(data.error || 'Erro ao carregar documentos')
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor')
        } finally {
            setLoading(false)
        }
    }

    const createCategory = async () => {
        if (!newCategoryName.trim()) return

        try {
            const res = await fetch('/api/agent/documents/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName.trim() })
            })

            const data = await res.json()
            if (res.ok) {
                setCategories([...categories, data.category])
                setSelectedCategory(data.category.name)
                setNewCategoryName('')
                setShowNewCategory(false)
                setSuccess('Categoria criada!')
                setTimeout(() => setSuccess(null), 2000)
            } else {
                setError(data.error)
            }
        } catch (err) {
            setError('Erro ao criar categoria')
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            const validTypes = [
                'text/plain',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ]

            if (!validTypes.includes(file.type)) {
                setError('Tipo de arquivo não suportado. Use: txt, pdf, doc, docx, xlsx')
                return
            }

            setSelectedFile(file)
            if (!title) {
                setTitle(file.name.replace(/\.[^/.]+$/, ''))
            }
        }
    }

    const readFileContent = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            if (file.type === 'text/plain') {
                reader.onload = (e) => resolve(e.target.result)
                reader.onerror = reject
                reader.readAsText(file)
            } else {
                // For binary files (PDF, DOC, XLSX), we'll need server-side parsing
                // For now, return a placeholder and handle on backend
                resolve(`[Binary file: ${file.name}]`)
            }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (!selectedCategory) {
            setError('Selecione ou crie uma categoria')
            return
        }

        if (!title.trim()) {
            setError('Título é obrigatório')
            return
        }

        let content = ''
        let fileType = 'text_input'
        let fileName = null
        let fileSize = null

        if (inputType === 'text') {
            if (!textContent.trim() || textContent.trim().length < 10) {
                setError('Conteúdo deve ter pelo menos 10 caracteres')
                return
            }
            content = textContent.trim()
        } else {
            if (!selectedFile) {
                setError('Selecione um arquivo')
                return
            }

            content = await readFileContent(selectedFile)
            fileName = selectedFile.name
            fileSize = selectedFile.size

            // Determine file type from extension
            const ext = selectedFile.name.split('.').pop().toLowerCase()
            fileType = ext
        }

        setUploading(true)

        try {
            const res = await fetch('/api/agent/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    title: title.trim(),
                    category: selectedCategory,
                    file_type: fileType,
                    file_name: fileName,
                    file_size: fileSize
                })
            })

            const data = await res.json()

            if (res.ok) {
                setSuccess(`Documento adicionado! ${data.chunks_created} chunk(s) criado(s).`)
                setTitle('')
                setTextContent('')
                setSelectedFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
                loadData()
                setTimeout(() => setSuccess(null), 3000)
            } else {
                setError(data.error)
            }
        } catch (err) {
            setError('Erro ao enviar documento')
        } finally {
            setUploading(false)
        }
    }

    const deleteDocument = async (docId, docTitle) => {
        if (!confirm(`Deletar "${docTitle}"?`)) return

        try {
            const res = await fetch(`/api/agent/documents/${docId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                setDocuments(documents.filter(d => d.id !== docId))
                setSuccess('Documento deletado')
                setTimeout(() => setSuccess(null), 2000)
            } else {
                const data = await res.json()
                setError(data.error)
            }
        } catch (err) {
            setError('Erro ao deletar documento')
        }
    }

    const deleteCategory = async (categoryName) => {
        if (!confirm(`Deletar categoria "${categoryName}" e todos os documentos?`)) return

        try {
            const res = await fetch(`/api/agent/documents/categories/${encodeURIComponent(categoryName)}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                loadData()
                setSuccess('Categoria deletada')
                setTimeout(() => setSuccess(null), 2000)
            } else {
                const data = await res.json()
                setError(data.error)
            }
        } catch (err) {
            setError('Erro ao deletar categoria')
        }
    }

    // Group documents by category
    const groupedDocs = documents.reduce((acc, doc) => {
        const cat = doc.category || 'Sem categoria'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(doc)
        return acc
    }, {})

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#0a0a0a] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-800 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📚</span>
                        <h2 className="text-xl font-bold text-white">Manual do Agente</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
                            {success}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Add Document Form */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span>➕</span> Adicionar Documento
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Category Selection */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Categoria</label>
                                    {!showNewCategory ? (
                                        <div className="flex gap-2">
                                            <select
                                                value={selectedCategory}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                                className="flex-1 bg-[#1a1a1a] text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-[#00FF99] focus:outline-none"
                                            >
                                                <option value="">Selecione uma categoria</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setShowNewCategory(true)}
                                                className="px-4 py-2 bg-[#00FF99]/10 text-[#00FF99] rounded-xl hover:bg-[#00FF99]/20 transition-colors"
                                            >
                                                + Nova
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="Nome da categoria"
                                                className="flex-1 bg-[#1a1a1a] text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-[#00FF99] focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={createCategory}
                                                className="px-4 py-2 bg-[#00FF99] text-black font-medium rounded-xl hover:bg-[#00FF99]/90 transition-colors"
                                            >
                                                Criar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setShowNewCategory(false); setNewCategoryName('') }}
                                                className="px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Título</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ex: Política de Devolução"
                                        className="w-full bg-[#1a1a1a] text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-[#00FF99] focus:outline-none"
                                    />
                                </div>

                                {/* Input Type Toggle */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Tipo de Entrada</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setInputType('text')}
                                            className={`flex-1 py-3 rounded-xl font-medium transition-all ${inputType === 'text'
                                                    ? 'bg-[#00FF99] text-black'
                                                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            ✏️ Digitar Texto
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setInputType('file')}
                                            className={`flex-1 py-3 rounded-xl font-medium transition-all ${inputType === 'file'
                                                    ? 'bg-[#00FF99] text-black'
                                                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            📁 Upload Arquivo
                                        </button>
                                    </div>
                                </div>

                                {/* Content Input */}
                                {inputType === 'text' ? (
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Conteúdo</label>
                                        <textarea
                                            value={textContent}
                                            onChange={(e) => setTextContent(e.target.value)}
                                            placeholder="Cole ou digite o conteúdo aqui..."
                                            rows={8}
                                            className="w-full bg-[#1a1a1a] text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-[#00FF99] focus:outline-none resize-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{textContent.length} caracteres</p>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Arquivo</label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-[#00FF99] transition-colors"
                                        >
                                            {selectedFile ? (
                                                <div className="text-white">
                                                    <span className="text-3xl mb-2 block">📄</span>
                                                    <p className="font-medium">{selectedFile.name}</p>
                                                    <p className="text-sm text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            ) : (
                                                <div className="text-gray-400">
                                                    <span className="text-3xl mb-2 block">📂</span>
                                                    <p>Clique para selecionar ou arraste um arquivo</p>
                                                    <p className="text-xs mt-1">txt, pdf, doc, docx, xlsx</p>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".txt,.pdf,.doc,.docx,.xlsx"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full py-4 bg-[#00FF99] text-black font-bold rounded-xl hover:bg-[#00FF99]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Processando...
                                        </span>
                                    ) : (
                                        'Adicionar ao Manual'
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Right: Document List */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span>📋</span> Documentos ({documents.length})
                            </h3>

                            {loading ? (
                                <div className="text-center py-8 text-gray-400">
                                    <svg className="animate-spin h-8 w-8 mx-auto mb-2" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Carregando...
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <span className="text-4xl block mb-2">📭</span>
                                    Nenhum documento adicionado ainda
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {Object.entries(groupedDocs).map(([category, docs]) => (
                                        <div key={category} className="bg-[#1a1a1a] rounded-xl overflow-hidden">
                                            <div className="flex items-center justify-between px-4 py-3 bg-[#252525]">
                                                <span className="font-medium text-white flex items-center gap-2">
                                                    <span>📁</span> {category}
                                                    <span className="text-xs text-gray-400">({docs.length})</span>
                                                </span>
                                                <button
                                                    onClick={() => deleteCategory(category)}
                                                    className="text-xs text-red-400 hover:text-red-300"
                                                >
                                                    Deletar categoria
                                                </button>
                                            </div>
                                            <div className="divide-y divide-gray-800">
                                                {docs.map(doc => (
                                                    <div key={doc.id} className="flex items-center justify-between px-4 py-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-white truncate">{doc.title}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {doc.file_type === 'text_input' ? '✏️ Texto' : `📄 ${doc.file_type?.toUpperCase()}`}
                                                                {doc.total_chunks > 1 && ` • ${doc.total_chunks} chunks`}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => deleteDocument(doc.id, doc.title)}
                                                            className="ml-2 p-2 text-gray-400 hover:text-red-400 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    )
}
