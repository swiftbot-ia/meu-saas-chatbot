'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Page for team members to reset their password on first login
 */
export default function ResetPasswordPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    })
    const [errors, setErrors] = useState({})
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

            setUser(user)

            // Check if user needs to reset password
            const response = await fetch('/api/account/check-reset-password')
            const data = await response.json()

            if (!data.success || !data.mustResetPassword) {
                // User doesn't need to reset, redirect to dashboard
                router.push('/dashboard')
                return
            }

        } catch (error) {
            console.error('Erro ao verificar usuário:', error)
            router.push('/login')
        } finally {
            setLoading(false)
        }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.newPassword) {
            newErrors.newPassword = 'Nova senha é obrigatória'
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Senha deve ter pelo menos 6 caracteres'
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirmação de senha é obrigatória'
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'As senhas não coincidem'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        setSubmitting(true)
        try {
            // Update password in Supabase Auth
            const { error: updateError } = await supabase.auth.updateUser({
                password: formData.newPassword
            })

            if (updateError) {
                throw updateError
            }

            // Clear the must_reset_password flag
            const response = await fetch('/api/account/check-reset-password', {
                method: 'POST'
            })

            const data = await response.json()

            if (!data.success) {
                console.warn('⚠️ Flag de reset não foi limpa:', data.error)
            }

            setResultModal({
                show: true,
                type: 'success',
                title: 'Senha Atualizada',
                message: 'Sua senha foi redefinida com sucesso! Você será redirecionado para o dashboard.'
            })

            // Redirect after a short delay
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)

        } catch (error) {
            console.error('Erro ao redefinir senha:', error)
            setResultModal({
                show: true,
                type: 'error',
                title: 'Erro ao Redefinir',
                message: error.message || 'Não foi possível redefinir sua senha. Tente novamente.'
            })
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                        <svg width="64" height="64" viewBox="0 0 1564 1564" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1001.683,23.139L433.941,727.705C433.941,727.705 414.727,752.657 429.123,757.818C454,766.738 783.43,754.723 771.86,756.415C771.86,756.415 799.555,753.473 791.713,787.082C784.04,819.968 735.527,1088.176 721.925,1130.644C708.323,1173.112 714.745,1159.731 714.745,1159.731C712.575,1159.731 711.288,1182.876 723.478,1185.568C736.204,1188.379 743.209,1188.065 756.911,1174.333C771.677,1159.534 861.262,1028.542 863.24,1028.542L1226.88,546.873C1227.906,548.514 1248.393,525.692 1221.45,522.235M1221.45,522.235L1115.236,520.972L902.566,520.972C902.566,520.972 885.36,525.188 897.567,497.267C909.774,469.345 912.072,456.497 912.072,456.497L1022.331,70.647L1028.875,32.645C1028.875,32.645 1026.615,9.308 1001.808,23.139" fill="#00FF99" />
                            <path d="M507.177,1105.829C493.786,1121.663 477.201,1132.121 457.867,1137.955L690.658,1372.989C705.266,1359.456 721.561,1351.518 738.923,1347.115L507.177,1105.829ZM429.844,939.939C485.576,939.939 530.824,985.187 530.824,1040.92C530.824,1096.653 485.576,1141.901 429.844,1141.901C374.111,1141.901 328.863,1096.653 328.863,1040.92C328.863,985.187 374.111,939.939 429.844,939.939ZM429.844,981.253C462.775,981.253 489.511,1007.989 489.511,1040.92C489.511,1073.851 462.775,1100.587 429.844,1100.587C396.912,1100.587 370.176,1073.851 370.176,1040.92C370.176,1007.989 396.912,981.253 429.844,981.253ZM1028.441,1105.372L797.555,1352.091C814.771,1359.117 830.462,1370.383 842.586,1387.319L1073.308,1136.429C1056.017,1130.603 1041.204,1119.974 1028.441,1105.372ZM760.432,1345.038C816.124,1345.076 861.398,1390.3 861.413,1446.019C861.428,1501.752 816.165,1547 760.432,1547C704.699,1547 659.451,1501.752 659.451,1446.019C659.451,1390.286 704.699,1345 760.432,1345.038ZM760.432,1386.352C793.363,1386.352 820.1,1413.088 820.1,1446.019C820.1,1478.951 793.363,1505.687 760.432,1505.687C727.501,1505.687 700.765,1478.951 700.765,1446.019C700.765,1413.088 727.501,1386.352 760.432,1386.352ZM1106.156,939.939C1161.889,939.939 1207.137,985.187 1207.137,1040.92C1207.137,1096.653 1161.889,1141.901 1106.156,1106.156C1050.424,1141.901 1005.176,1096.653 1005.176,1040.92C1005.176,985.187 1050.424,939.939 1106.156,939.939ZM1106.156,981.253C1139.088,981.253 1165.824,1007.989 1165.824,1040.92C1165.824,1073.851 1139.088,1100.587 1106.156,1100.587C1073.225,1100.587 1046.489,1073.851 1046.489,1040.92C1046.489,1007.989 1073.225,981.253 1106.156,981.253Z" fill="#00FF99" stroke="#00FF99" strokeWidth="1" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white">SwiftBot</h1>
                </div>

                {/* Card */}
                <div className="bg-[#111111] rounded-2xl p-8">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-[#00FF99]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            Redefina sua Senha
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Por segurança, você precisa criar uma nova senha para acessar a plataforma.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nova Senha *
                            </label>
                            <input
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] outline-none"
                                autoFocus
                            />
                            {errors.newPassword && <p className="mt-1 text-red-400 text-sm">{errors.newPassword}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Confirmar Nova Senha *
                            </label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="Confirme sua nova senha"
                                className="w-full bg-[#0A0A0A] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#00FF99] outline-none"
                            />
                            {errors.confirmPassword && <p className="mt-1 text-red-400 text-sm">{errors.confirmPassword}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black py-4 px-4 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] disabled:opacity-50 flex items-center justify-center"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2" />
                                    Redefinindo...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Redefinir Senha
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-gray-500 text-sm mt-6">
                    © 2025 SwiftBot. Todos os direitos reservados.
                </p>
            </div>

            {/* Result Modal */}
            {resultModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
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

                        {resultModal.type === 'error' && (
                            <button
                                onClick={() => setResultModal(prev => ({ ...prev, show: false }))}
                                className="w-full py-4 font-bold rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-all"
                            >
                                Tentar Novamente
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
