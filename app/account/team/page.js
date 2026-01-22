'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function TeamManagement() {
    const router = useRouter()

    // States
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [members, setMembers] = useState([])
    const [account, setAccount] = useState(null)
    const [isOwner, setIsOwner] = useState(false)
    const [canManageTeam, setCanManageTeam] = useState(false)
    const [currentUserId, setCurrentUserId] = useState(null)

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [memberToRemove, setMemberToRemove] = useState(null)
    const [memberToEdit, setMemberToEdit] = useState(null)

    // Form states
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'consultant',
        canAssignSelf: true,
        canAssignOthers: false
    })
    const [editFormData, setEditFormData] = useState({
        role: 'consultant',
        canAssignSelf: true,
        canAssignOthers: false
    })
    const [formErrors, setFormErrors] = useState({})
    const [saving, setSaving] = useState(false)

    // Connection states
    const [availableConnections, setAvailableConnections] = useState([])
    const [selectedConnections, setSelectedConnections] = useState([])
    const [editSelectedConnections, setEditSelectedConnections] = useState([])

    // Result modal
    const [resultModal, setResultModal] = useState({
        show: false,
        type: 'success',
        title: '',
        message: ''
    })

    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            // 1. Verify permissions explicitly
            const res = await fetch('/api/account/member-permissions');
            const permData = await res.json();
            const role = permData.permissions?.role || permData.role;

            if (permData.success && role && !['owner', 'manager'].includes(role)) {
                router.push('/dashboard');
                return; // Stop execution
            }

            setUser(user)
            await loadTeamData()
            await loadConnections()
        } catch (error) {
            console.error('Erro ao verificar usuário:', error)
            router.push('/login')
        } finally {
            setLoading(false)
        }
    }

    const loadTeamData = async () => {
        try {
            const response = await fetch('/api/account/team')
            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error)
            }

            setMembers(data.members || [])
            setAccount(data.account)
            setIsOwner(data.isOwner)
            setCanManageTeam(data.canManageTeam)
            setCurrentUserId(data.currentUserId)
        } catch (error) {
            console.error('Erro ao carregar equipe:', error)
            setResultModal({
                show: true,
                type: 'error',
                title: 'Erro ao Carregar',
                message: 'Não foi possível carregar os dados da equipe.'
            })
        }
    }

    const loadConnections = async () => {
        try {
            const response = await fetch('/api/account/connections')
            const data = await response.json()

            if (data.success) {
                setAvailableConnections(data.connections || [])
            }
        } catch (error) {
            console.error('Erro ao carregar conexões:', error)
        }
    }

    const handleConnectionToggle = (connectionId, checked) => {
        if (checked) {
            setSelectedConnections(prev => [...prev, connectionId])
        } else {
            setSelectedConnections(prev => prev.filter(id => id !== connectionId))
        }
    }

    const handleEditConnectionToggle = (connectionId, checked) => {
        if (checked) {
            setEditSelectedConnections(prev => [...prev, connectionId])
        } else {
            setEditSelectedConnections(prev => prev.filter(id => id !== connectionId))
        }
    }

    const validateForm = () => {
        const errors = {}

        if (!formData.fullName.trim()) {
            errors.fullName = 'Nome é obrigatório'
        }

        if (!formData.email.trim()) {
            errors.email = 'Email é obrigatório'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Email inválido'
        }

        if (!formData.password) {
            errors.password = 'Senha é obrigatória'
        } else if (formData.password.length < 6) {
            errors.password = 'Senha deve ter pelo menos 6 caracteres'
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleAddMember = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        setSaving(true)
        try {
            const response = await fetch('/api/account/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    canAssignSelf: formData.canAssignSelf,
                    canAssignOthers: formData.canAssignOthers,
                    connectionIds: formData.role === 'owner' ? [] : selectedConnections
                })
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error)
            }

            setShowAddModal(false)
            setFormData({ fullName: '', email: '', password: '', role: 'consultant', canAssignSelf: true, canAssignOthers: false })
            setSelectedConnections([])
            setFormErrors({})
            await loadTeamData()

            setResultModal({
                show: true,
                type: 'success',
                title: 'Membro Adicionado',
                message: `${formData.fullName} foi adicionado à equipe. Ele deverá redefinir a senha no primeiro acesso.`
            })
        } catch (error) {
            console.error('Erro ao adicionar membro:', error)
            setResultModal({
                show: true,
                type: 'error',
                title: 'Erro ao Adicionar',
                message: error.message || 'Não foi possível adicionar o membro.'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleRemoveMember = async () => {
        if (!memberToRemove) return

        setSaving(true)
        try {
            const response = await fetch(`/api/account/team/${memberToRemove.userId}`, {
                method: 'DELETE'
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error)
            }

            setShowConfirmModal(false)
            setMemberToRemove(null)
            await loadTeamData()

            setResultModal({
                show: true,
                type: 'success',
                title: 'Membro Removido',
                message: `${memberToRemove.fullName} foi removido da equipe.`
            })
        } catch (error) {
            console.error('Erro ao remover membro:', error)
            setResultModal({
                show: true,
                type: 'error',
                title: 'Erro ao Remover',
                message: error.message || 'Não foi possível remover o membro.'
            })
        } finally {
            setSaving(false)
        }
    }

    const openRemoveConfirmation = (member) => {
        setMemberToRemove(member)
        setShowConfirmModal(true)
    }

    const closeResultModal = () => {
        setResultModal(prev => ({ ...prev, show: false }))
    }

    const openEditModal = async (member) => {
        setMemberToEdit(member)
        setEditFormData({
            role: member.role,
            canAssignSelf: member.canAssignSelf ?? true,
            canAssignOthers: member.canAssignOthers ?? false
        })

        // Load member's connections
        try {
            const response = await fetch(`/api/account/team/${member.id}/connections`)
            const data = await response.json()
            if (data.success) {
                setEditSelectedConnections(data.connectionIds || [])
            }
        } catch (error) {
            console.error('Erro ao carregar conexões do membro:', error)
            setEditSelectedConnections([])
        }

        setShowEditModal(true)
    }

    const handleEditMember = async () => {
        if (!memberToEdit) return

        setSaving(true)
        const updateData = {
            canAssignSelf: editFormData.canAssignSelf,
            canAssignOthers: editFormData.canAssignOthers
        }

        // Only send role if it's not owner (owners cannot have their role changed here)
        if (editFormData.role !== 'owner') {
            updateData.role = editFormData.role
        }

        try {
            const response = await fetch(`/api/account/team/${memberToEdit.userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error)
            }

            // Update connections separately
            if (editFormData.role !== 'owner') {
                const connResponse = await fetch(`/api/account/team/${memberToEdit.id}/connections`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        connectionIds: editSelectedConnections
                    })
                })

                const connData = await connResponse.json()
                if (!connData.success) {
                    console.error('Erro ao atualizar conexões:', connData.error)
                }
            }

            setShowEditModal(false)
            setMemberToEdit(null)
            setEditSelectedConnections([])
            await loadTeamData()

            setResultModal({
                show: true,
                type: 'success',
                title: 'Membro Atualizado',
                message: `As configurações de ${memberToEdit.fullName} foram atualizadas.`
            })
        } catch (error) {
            console.error('Erro ao editar membro:', error)
            setResultModal({
                show: true,
                type: 'error',
                title: 'Erro ao Editar',
                message: error.message || 'Não foi possível editar o membro.'
            })
        } finally {
            setSaving(false)
        }
    }

    // Helper function to get role badge
    const getRoleBadge = (role) => {
        switch (role) {
            case 'owner':
                return <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">👑 Proprietário</span>
            case 'manager':
                return <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium">⭐ Gestor</span>
            case 'consultant':
                return <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full font-medium">👤 Consultor</span>
            default:
                return <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full font-medium">Membro</span>
        }
    }

    const canAddMoreMembers = account && members.length < account.maxMembers

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            <main className="transition-all duration-300 ml-0 md:ml-[80px] lg:ml-[80px]">
                <div className="min-h-screen p-4 sm:p-6 lg:p-8">
                    <div className="max-w-4xl mx-auto">

                        {/* Header */}
                        <div className="mb-8 pt-8">
                            <h1 className="text-4xl font-bold text-white">
                                Gerenciar Equipe
                            </h1>
                            <p className="text-[#B0B0B0] text-lg mt-3">
                                Adicione membros para trabalhar em conjunto na plataforma
                            </p>
                        </div>

                        {/* Stats Card */}
                        <div className="bg-[#111111] rounded-2xl p-6 mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Membros da Equipe</p>
                                    <p className="text-3xl font-bold text-white mt-1">
                                        {members.length}
                                        <span className="text-lg text-gray-500 font-normal">
                                            /{account?.maxMembers || 5}
                                        </span>
                                    </p>
                                </div>

                                {isOwner && (
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        disabled={!canAddMoreMembers}
                                        className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${canAddMoreMembers
                                            ? 'bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black hover:shadow-[0_0_30px_rgba(0,255,153,0.4)]'
                                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Adicionar Membro
                                    </button>
                                )}
                            </div>

                            {!canAddMoreMembers && isOwner && (
                                <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg">
                                    <p className="text-yellow-400 text-sm flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Limite de membros atingido
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Members List */}
                        <div className="bg-[#111111] rounded-2xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Membros
                            </h2>

                            <div className="space-y-4">
                                {members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="bg-[#0A0A0A] rounded-xl p-4 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00FF99] to-[#00BFFF] flex items-center justify-center text-black font-bold text-lg">
                                                {member.fullName?.charAt(0)?.toUpperCase() || '?'}
                                            </div>

                                            {/* Info */}
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-white font-medium">
                                                        {member.fullName}
                                                    </p>
                                                    {member.userId === currentUserId && (
                                                        <span className="text-xs text-gray-500">(você)</span>
                                                    )}
                                                    {getRoleBadge(member.role)}
                                                </div>
                                                <p className="text-gray-500 text-sm">{member.email}</p>
                                                {member.mustResetPassword && (
                                                    <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        Aguardando primeiro acesso
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {canManageTeam && member.role !== 'owner' && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(member)}
                                                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                                    title="Editar membro"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => openRemoveConfirmation(member)}
                                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                    title="Remover membro"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {members.length === 0 && (
                                    <div className="text-center py-8">
                                        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <p className="text-gray-500">Nenhum membro na equipe ainda</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="relative bg-[#111111] rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-[#00FF99]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Adicionar Membro</h3>
                            <p className="text-gray-400 text-sm">
                                O membro deverá redefinir a senha no primeiro acesso
                            </p>
                        </div>

                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="Ex: Maria Santos"
                                    className="w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] outline-none"
                                />
                                {formErrors.fullName && <p className="mt-1 text-red-400 text-sm">{formErrors.fullName}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Ex: maria@empresa.com"
                                    className="w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] outline-none"
                                />
                                {formErrors.email && <p className="mt-1 text-red-400 text-sm">{formErrors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Senha Temporária *
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] outline-none"
                                />
                                {formErrors.password && <p className="mt-1 text-red-400 text-sm">{formErrors.password}</p>}
                            </div>

                            {/* Role Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Perfil *
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'manager', canAssignOthers: true })}
                                        className={`p-3 rounded-xl border-2 transition-all ${formData.role === 'manager'
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-gray-700 hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="text-left">
                                            <p className={`font-medium ${formData.role === 'manager' ? 'text-blue-400' : 'text-white'}`}>
                                                ⭐ Gestor
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Acesso total, como dono</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'consultant', canAssignOthers: false })}
                                        className={`p-3 rounded-xl border-2 transition-all ${formData.role === 'consultant'
                                            ? 'border-purple-500 bg-purple-500/10'
                                            : 'border-gray-700 hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="text-left">
                                            <p className={`font-medium ${formData.role === 'consultant' ? 'text-purple-400' : 'text-white'}`}>
                                                👤 Consultor
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Acesso restrito</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Permissions */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-300">
                                    Permissões de Atribuição
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.canAssignSelf}
                                        onChange={(e) => setFormData({ ...formData, canAssignSelf: e.target.checked })}
                                        className="w-5 h-5 rounded bg-[#0A0A0A] border-gray-600 text-[#00FF99] focus:ring-[#00FF99]"
                                    />
                                    <span className="text-gray-300 text-sm">Pode atribuir leads para si mesmo</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.canAssignOthers}
                                        onChange={(e) => setFormData({ ...formData, canAssignOthers: e.target.checked })}
                                        className="w-5 h-5 rounded bg-[#0A0A0A] border-gray-600 text-[#00FF99] focus:ring-[#00FF99]"
                                    />
                                    <span className="text-gray-300 text-sm">Pode atribuir leads para outros membros</span>
                                </label>
                            </div>

                            {/* Connections */}
                            {formData.role !== 'owner' && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-300">
                                        Conexões Permitidas
                                    </label>
                                    {availableConnections.length === 0 ? (
                                        <p className="text-gray-500 text-sm">Nenhuma conexão disponível</p>
                                    ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {availableConnections.map((conn, index) => {
                                                const isSelected = selectedConnections.includes(conn.id)
                                                const isConnected = conn.status === 'connected'
                                                const displayName = conn.name || `Conexão ${index + 1}`
                                                const phoneNumber = conn.phoneNumber || ''

                                                return (
                                                    <label
                                                        key={conn.id}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                                            ? 'border-[#00FF99] bg-[#00FF99]/10'
                                                            : 'border-gray-700 hover:border-gray-600 hover:bg-[#1E1E1E]'
                                                            }`}
                                                    >
                                                        {/* Checkbox */}
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => handleConnectionToggle(conn.id, e.target.checked)}
                                                            className="w-5 h-5 rounded bg-[#0A0A0A] border-gray-600 text-[#00FF99] focus:ring-[#00FF99] flex-shrink-0"
                                                        />

                                                        {/* Avatar */}
                                                        <div className="flex-shrink-0">
                                                            <div className="w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white font-semibold">
                                                                {displayName.charAt(0).toUpperCase()}
                                                            </div>
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-white font-medium text-sm truncate">
                                                                {displayName}
                                                            </div>
                                                            <div className="text-gray-400 text-xs truncate mt-0.5">
                                                                {phoneNumber ? `+${phoneNumber}` : 'Sem número'}
                                                            </div>
                                                        </div>

                                                        {/* Status Indicator */}
                                                        <div className="flex-shrink-0">
                                                            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                                                        </div>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    )}
                                    {selectedConnections.length === 0 && (
                                        <p className="text-yellow-400 text-xs flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Sem conexões selecionadas, o membro não poderá acessar nenhum dado
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="p-3 bg-yellow-500/10 rounded-lg">
                                <p className="text-yellow-400 text-sm flex items-start gap-2">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Compartilhe a senha temporária com o membro. Ele será solicitado a criar uma nova senha no primeiro acesso.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false)
                                        setFormData({ fullName: '', email: '', password: '', role: 'consultant', canAssignSelf: true, canAssignOthers: false })
                                        setFormErrors({})
                                    }}
                                    className="flex-1 bg-[#272727] hover:bg-[#333333] text-white py-3 px-4 rounded-xl font-medium transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black py-3 px-4 rounded-xl font-bold transition-all disabled:opacity-50"
                                >
                                    {saving ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                                            Adicionando...
                                        </div>
                                    ) : (
                                        'Adicionar'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Remove Modal */}
            {showConfirmModal && memberToRemove && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="relative bg-[#111111] rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Remover Membro</h3>
                            <p className="text-gray-400">
                                Tem certeza que deseja remover <strong className="text-white">{memberToRemove.fullName}</strong> da equipe?
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false)
                                    setMemberToRemove(null)
                                }}
                                className="flex-1 bg-[#272727] hover:bg-[#333333] text-white py-3 px-4 rounded-xl font-medium transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRemoveMember}
                                disabled={saving}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-xl font-bold transition-all disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                        Removendo...
                                    </div>
                                ) : (
                                    'Remover'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Member Modal */}
            {showEditModal && memberToEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-[#1E1E1E] p-8 rounded-3xl border border-[#00FF99]/20 shadow-[0_0_50px_rgba(0,255,153,0.15)] max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold text-white mb-6 text-center">
                            Editar Membro
                        </h3>

                        <div className="mb-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00FF99] to-[#00BFFF] flex items-center justify-center text-black font-bold text-xl mx-auto mb-2">
                                {memberToEdit.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <p className="text-white font-medium">{memberToEdit.fullName}</p>
                            <p className="text-gray-500 text-sm">{memberToEdit.email}</p>
                        </div>

                        <div className="space-y-6">
                            {/* Role Selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Perfil
                                </label>
                                {editFormData.role === 'owner' ? (
                                    <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">👑</span>
                                            <div>
                                                <p className="font-bold text-yellow-500">Proprietário da Conta</p>
                                                <p className="text-xs text-gray-400">O proprietário tem acesso total e não pode ter seu perfil alterado.</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setEditFormData({ ...editFormData, role: 'manager', canAssignOthers: true })}
                                            className={`p-3 rounded-xl border-2 transition-all ${editFormData.role === 'manager'
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-gray-700 hover:border-gray-600'
                                                }`}
                                        >
                                            <div className="text-left">
                                                <p className={`font-medium ${editFormData.role === 'manager' ? 'text-blue-400' : 'text-white'}`}>
                                                    ⭐ Gestor
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">Acesso total</p>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditFormData({ ...editFormData, role: 'consultant', canAssignOthers: false })}
                                            className={`p-3 rounded-xl border-2 transition-all ${editFormData.role === 'consultant'
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-gray-700 hover:border-gray-600'
                                                }`}
                                        >
                                            <div className="text-left">
                                                <p className={`font-medium ${editFormData.role === 'consultant' ? 'text-purple-400' : 'text-white'}`}>
                                                    👤 Consultor
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">Acesso restrito</p>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Permissions */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-300">
                                    Permissões de Atribuição
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editFormData.canAssignSelf}
                                        onChange={(e) => setEditFormData({ ...editFormData, canAssignSelf: e.target.checked })}
                                        className="w-5 h-5 rounded bg-[#0A0A0A] border-gray-600 text-[#00FF99] focus:ring-[#00FF99]"
                                    />
                                    <span className="text-gray-300 text-sm">Pode atribuir leads para si mesmo</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editFormData.canAssignOthers}
                                        onChange={(e) => setEditFormData({ ...editFormData, canAssignOthers: e.target.checked })}
                                        className="w-5 h-5 rounded bg-[#0A0A0A] border-gray-600 text-[#00FF99] focus:ring-[#00FF99]"
                                    />
                                    <span className="text-gray-300 text-sm">Pode atribuir leads para outros membros</span>
                                </label>
                            </div>

                            {/* Connections */}
                            {editFormData.role !== 'owner' && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-300">
                                        Conexões Permitidas
                                    </label>
                                    {availableConnections.length === 0 ? (
                                        <p className="text-gray-500 text-sm">Nenhuma conexão disponível</p>
                                    ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {availableConnections.map((conn, index) => {
                                                const isSelected = editSelectedConnections.includes(conn.id)
                                                const isConnected = conn.status === 'connected'
                                                const displayName = conn.name || `Conexão ${index + 1}`
                                                const phoneNumber = conn.phoneNumber || ''

                                                return (
                                                    <label
                                                        key={conn.id}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                                            ? 'border-[#00FF99] bg-[#00FF99]/10'
                                                            : 'border-gray-700 hover:border-gray-600 hover:bg-[#1E1E1E]'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => handleEditConnectionToggle(conn.id, e.target.checked)}
                                                            className="w-5 h-5 rounded bg-[#0A0A0A] border-gray-600 text-[#00FF99] focus:ring-[#00FF99] flex-shrink-0"
                                                        />
                                                        <div className="flex-shrink-0">
                                                            <div className="w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white font-semibold">
                                                                {displayName.charAt(0).toUpperCase()}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-white font-medium text-sm truncate">
                                                                {displayName}
                                                            </div>
                                                            <div className="text-gray-400 text-xs truncate mt-0.5">
                                                                {phoneNumber ? `+${phoneNumber}` : 'Sem número'}
                                                            </div>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                                                        </div>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    )}
                                    {editSelectedConnections.length === 0 && (
                                        <p className="text-yellow-400 text-xs flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Sem conexões selecionadas, o membro não poderá acessar nenhum dado
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowEditModal(false)
                                    setMemberToEdit(null)
                                }}
                                className="flex-1 bg-[#272727] hover:bg-[#333333] text-white py-3 px-4 rounded-xl font-medium transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEditMember}
                                disabled={saving}
                                className="flex-1 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black py-3 px-4 rounded-xl font-bold transition-all disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                                        Salvando...
                                    </div>
                                ) : (
                                    'Salvar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            {resultModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div
                        className={`bg-[#1E1E1E] p-8 rounded-3xl border shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-md w-full text-center ${resultModal.type === 'error'
                            ? 'border-red-500/20'
                            : 'border-[#00FF99]/20'
                            }`}
                    >
                        <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${resultModal.type === 'error' ? 'bg-red-500/10' : 'bg-[#00FF99]/10'
                                }`}
                        >
                            {resultModal.type === 'error' ? (
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">
                            {resultModal.title}
                        </h3>

                        <p className="text-gray-400 mb-8">
                            {resultModal.message}
                        </p>

                        <button
                            onClick={closeResultModal}
                            className={`w-full py-4 font-bold rounded-2xl transition-all ${resultModal.type === 'error'
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black'
                                }`}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
