'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, Plus, FileText, Upload, Trash2, FolderPlus, Loader2 } from 'lucide-react'

/**
 * KnowledgeBaseManager Component
 * Modal para gerenciar a base de conhecimento do agente
 * Segue o padrão visual do StandardModal
 */
export default function KnowledgeBaseManager({ agentId, isOpen, onClose }) {
    const [documents, setDocuments] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    // Controle de etapas
    const [step, setStep] = useState('list') // 'list' | 'create_category' | 'add_document'

    // Form state
    const [inputType, setInputType] = useState('text') // 'text' | 'file'
    const [selectedCategory, setSelectedCategory] = useState('')
    const [newCategoryName, setNewCategoryName] = useState('')
    const [title, setTitle] = useState('')
    const [textContent, setTextContent] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)

    // Confirmação de recriar/incluir
    const [showReplaceConfirm, setShowReplaceConfirm] = useState(false)
    const [existingDocTitle, setExistingDocTitle] = useState('')

    const fileInputRef = useRef(null)

    // Handler: Fechar com ESC
    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Escape') {
            onClose()
        }
    }, [onClose])

    // Handler: Clique no overlay
    const handleOverlayClick = useCallback((event) => {
        if (event.target === event.currentTarget) {
            onClose()
        }
    }, [onClose])

    // Efeito: Listener para ESC
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'hidden'
            loadData()
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, handleKeyDown])

    const loadData = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/agent/documents')
            const data = await res.json()
            if (res.ok) {
                setDocuments(data.documents || [])
                setCategories(data.categories || [])
                // Se retornou mensagem de agente não encontrado, mostrar alerta especial
                if (data.message === 'Agente não encontrado') {
                    setError('⚠️ Salve a configuração do agente primeiro para usar o Manual.')
                }
            } else {
                if (data.error?.includes('Agente não encontrado')) {
                    setError('⚠️ Salve a configuração do agente primeiro para usar o Manual.')
                } else {
                    setError(data.error || 'Erro ao carregar documentos')
                }
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor')
        } finally {
            setLoading(false)
        }
    }

    const createCategory = async () => {
        if (!newCategoryName.trim()) {
            setError('Nome da categoria é obrigatório')
            return
        }

        setUploading(true)
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
                setSuccess('Categoria criada com sucesso!')
                setStep('add_document') // Avança para adicionar documento
                setTimeout(() => setSuccess(null), 3000)
            } else {
                setError(data.error)
            }
        } catch (err) {
            setError('Erro ao criar categoria')
        } finally {
            setUploading(false)
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
                resolve(`[Binary file: ${file.name}]`)
            }
        })
    }

    const checkExistingDocument = () => {
        // Verifica se já existe documento com mesmo título na categoria
        const existing = documents.find(
            d => d.title === title.trim() && d.category === selectedCategory
        )
        if (existing) {
            setExistingDocTitle(existing.title)
            setShowReplaceConfirm(true)
            return true
        }
        return false
    }

    const handleSubmit = async (replaceExisting = false) => {
        setError(null)
        setSuccess(null)

        if (!selectedCategory) {
            setError('Selecione uma categoria primeiro')
            return
        }

        if (!title.trim()) {
            setError('Título é obrigatório')
            return
        }

        // Verifica documento existente (se não está no modo replace)
        if (!replaceExisting && checkExistingDocument()) {
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
            const ext = selectedFile.name.split('.').pop().toLowerCase()
            fileType = ext
        }

        setUploading(true)
        setShowReplaceConfirm(false)

        try {
            // Se substituir, deletar existente primeiro
            if (replaceExisting) {
                const existingDoc = documents.find(
                    d => d.title === title.trim() && d.category === selectedCategory
                )
                if (existingDoc) {
                    await fetch(`/api/agent/documents/${existingDoc.id}`, { method: 'DELETE' })
                }
            }

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
                resetForm()
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

    const resetForm = () => {
        setTitle('')
        setTextContent('')
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        setStep('list')
    }

    const deleteDocument = async (docId, docTitle) => {
        if (!confirm(`Deletar "${docTitle}"?`)) return

        try {
            const res = await fetch(`/api/agent/documents/${docId}`, { method: 'DELETE' })
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

    // Agrupar documentos por categoria
    const groupedDocs = documents.reduce((acc, doc) => {
        const cat = doc.category || 'Sem categoria'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(doc)
        return acc
    }, {})

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
        >
            <div className="relative bg-[#1F1F1F] rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-hidden transform transition-all duration-200 animate-slideIn border border-gray-800">

                {/* Botão Fechar */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-800"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-green-500/10 text-[#00FF99] p-3 rounded-full">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Manual do Agente</h2>
                        <p className="text-sm text-gray-400">Base de conhecimento RAG</p>
                    </div>
                </div>

                {/* Mensagens */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                        {success}
                    </div>
                )}

                {/* Confirmação de Substituição */}
                {showReplaceConfirm && (
                    <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <p className="text-orange-400 mb-3">
                            Já existe um documento "{existingDocTitle}" nesta categoria. O que deseja fazer?
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleSubmit(true)}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                            >
                                Substituir
                            </button>
                            <button
                                onClick={() => {
                                    setTitle(title + ' (novo)')
                                    setShowReplaceConfirm(false)
                                    handleSubmit(false)
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                            >
                                Adicionar como novo
                            </button>
                            <button
                                onClick={() => setShowReplaceConfirm(false)}
                                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Conteúdo baseado na etapa */}
                <div className="overflow-y-auto max-h-[calc(85vh-200px)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Loader2 className="animate-spin mb-2" size={32} />
                            <p>Carregando...</p>
                        </div>
                    ) : step === 'list' ? (
                        /* LISTA DE DOCUMENTOS */
                        <div className="space-y-4">
                            {/* Botões de Ação */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setStep('create_category')}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#00FF99] text-black font-medium rounded-lg hover:bg-[#00E88C] transition-colors"
                                >
                                    <FolderPlus size={18} />
                                    Nova Categoria
                                </button>
                                {categories.length > 0 && (
                                    <button
                                        onClick={() => setStep('add_document')}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        <Plus size={18} />
                                        Adicionar Documento
                                    </button>
                                )}
                            </div>

                            {/* Lista de Categorias e Documentos */}
                            {categories.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <FolderPlus size={48} className="mx-auto mb-3 opacity-50" />
                                    <p>Nenhuma categoria criada</p>
                                    <p className="text-sm">Crie uma categoria para começar a adicionar documentos</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(groupedDocs).map(([category, docs]) => (
                                        <div key={category} className="bg-gray-800/50 rounded-lg overflow-hidden">
                                            <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
                                                <span className="font-medium text-white flex items-center gap-2">
                                                    📁 {category}
                                                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
                                                        {docs.length}
                                                    </span>
                                                </span>
                                                <button
                                                    onClick={() => deleteCategory(category)}
                                                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                                                >
                                                    <Trash2 size={14} />
                                                    Deletar
                                                </button>
                                            </div>
                                            <div className="divide-y divide-gray-700/50">
                                                {docs.map(doc => (
                                                    <div key={doc.id} className="flex items-center justify-between px-4 py-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-white truncate">{doc.title}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {doc.file_type === 'text_input' ? '✏️ Texto' : `📄 ${doc.file_type?.toUpperCase()}`}
                                                                {doc.total_chunks > 1 && ` • ${doc.total_chunks} chunks`}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => deleteDocument(doc.id, doc.title)}
                                                            className="ml-2 p-1 text-gray-400 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {/* Categorias vazias */}
                                    {categories.filter(c => !groupedDocs[c.name]).map(cat => (
                                        <div key={cat.id} className="bg-gray-800/50 rounded-lg overflow-hidden">
                                            <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
                                                <span className="font-medium text-white flex items-center gap-2">
                                                    📁 {cat.name}
                                                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">0</span>
                                                </span>
                                                <button
                                                    onClick={() => deleteCategory(cat.name)}
                                                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                                                >
                                                    <Trash2 size={14} />
                                                    Deletar
                                                </button>
                                            </div>
                                            <div className="px-4 py-3 text-sm text-gray-500">
                                                Nenhum documento nesta categoria
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : step === 'create_category' ? (
                        /* CRIAR CATEGORIA */
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Nova Categoria</h3>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Nome da Categoria</label>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Ex: FAQ, Produtos, Políticas"
                                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-[#00FF99] focus:outline-none"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={createCategory}
                                    disabled={uploading || !newCategoryName.trim()}
                                    className="flex-1 px-4 py-3 bg-[#00FF99] text-black font-semibold rounded-lg hover:bg-[#00E88C] transition-colors disabled:opacity-50"
                                >
                                    {uploading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Criar Categoria'}
                                </button>
                                <button
                                    onClick={() => { setStep('list'); setNewCategoryName('') }}
                                    className="px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ADICIONAR DOCUMENTO */
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Adicionar Documento</h3>

                            {/* Seleção de Categoria */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Categoria</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-[#00FF99] focus:outline-none"
                                >
                                    <option value="">Selecione uma categoria</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Mostrar campos apenas se categoria selecionada */}
                            {selectedCategory && (
                                <>
                                    {/* Título */}
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Título</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Ex: Política de Devolução"
                                            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-[#00FF99] focus:outline-none"
                                        />
                                    </div>

                                    {/* Tipo de Entrada */}
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Tipo de Entrada</label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setInputType('text')}
                                                className={`flex-1 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${inputType === 'text'
                                                    ? 'bg-[#00FF99] text-black'
                                                    : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                                                    }`}
                                            >
                                                <FileText size={18} />
                                                Digitar Texto
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setInputType('file')}
                                                className={`flex-1 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${inputType === 'file'
                                                    ? 'bg-[#00FF99] text-black'
                                                    : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                                                    }`}
                                            >
                                                <Upload size={18} />
                                                Upload Arquivo
                                            </button>
                                        </div>
                                    </div>

                                    {/* Conteúdo */}
                                    {inputType === 'text' ? (
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Conteúdo</label>
                                            <textarea
                                                value={textContent}
                                                onChange={(e) => setTextContent(e.target.value)}
                                                placeholder="Cole ou digite o conteúdo aqui..."
                                                rows={6}
                                                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-[#00FF99] focus:outline-none resize-none"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{textContent.length} caracteres</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Arquivo</label>
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-[#00FF99] transition-colors"
                                            >
                                                {selectedFile ? (
                                                    <div className="text-white">
                                                        <FileText size={32} className="mx-auto mb-2 text-[#00FF99]" />
                                                        <p className="font-medium">{selectedFile.name}</p>
                                                        <p className="text-sm text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-400">
                                                        <Upload size={32} className="mx-auto mb-2" />
                                                        <p>Clique para selecionar</p>
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

                                    {/* Botão Enviar */}
                                    <button
                                        onClick={() => handleSubmit(false)}
                                        disabled={uploading}
                                        className="w-full py-3 bg-[#00FF99] text-black font-bold rounded-lg hover:bg-[#00E88C] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                Processando...
                                            </>
                                        ) : (
                                            'Adicionar ao Manual'
                                        )}
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => { resetForm(); setSelectedCategory('') }}
                                className="w-full py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Voltar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
