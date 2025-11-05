'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Save, 
  ArrowLeft, 
  Loader2, 
  Sparkles,
  MessageSquare,
  Zap,
  Settings,
  AlertCircle,
  Check,
  X,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

// Separar o componente que usa useSearchParams
function AgentConfigContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testing, setTesting] = useState(false);

  const [config, setConfig] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 2000,
    model: 'gpt-4',
    welcomeMessage: '',
    fallbackMessage: '',
    apiKey: '',
    knowledgeBase: [],
    customInstructions: [],
    conversationStarters: [],
    behaviorSettings: {
      personality: 'professional',
      responseStyle: 'concise',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      enableEmojis: false,
      enableMarkdown: true,
      maxConversationLength: 50,
      contextWindow: 10
    },
    integrations: {
      whatsapp: false,
      telegram: false,
      slack: false,
      discord: false,
      webhook: ''
    },
    analytics: {
      trackConversations: true,
      trackSentiment: true,
      trackTopics: true,
      generateReports: true
    }
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [newKnowledge, setNewKnowledge] = useState({ title: '', content: '' });
  const [newInstruction, setNewInstruction] = useState('');
  const [newStarter, setNewStarter] = useState('');

  useEffect(() => {
    if (agentId) {
      loadAgent();
    } else {
      setLoading(false);
    }
  }, [agentId]);

  const loadAgent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/agents/${agentId}`);
      const data = await response.json();
      
      if (data.success && data.agent) {
        setAgent(data.agent);
        setConfig({
          name: data.agent.name || '',
          description: data.agent.description || '',
          systemPrompt: data.agent.system_prompt || '',
          temperature: data.agent.temperature || 0.7,
          maxTokens: data.agent.max_tokens || 2000,
          model: data.agent.model || 'gpt-4',
          welcomeMessage: data.agent.welcome_message || '',
          fallbackMessage: data.agent.fallback_message || '',
          apiKey: data.agent.api_key || '',
          knowledgeBase: data.agent.knowledge_base || [],
          customInstructions: data.agent.custom_instructions || [],
          conversationStarters: data.agent.conversation_starters || [],
          behaviorSettings: data.agent.behavior_settings || config.behaviorSettings,
          integrations: data.agent.integrations || config.integrations,
          analytics: data.agent.analytics || config.analytics
        });
      }
    } catch (error) {
      console.error('Erro ao carregar agente:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.name.trim()) {
      alert('Por favor, preencha o nome do agente');
      return;
    }

    setSaving(true);
    try {
      const url = agentId ? `/api/agents/${agentId}` : '/api/agents';
      const method = agentId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(agentId ? 'Configurações salvas com sucesso!' : 'Agente criado com sucesso!');
        router.push('/dashboard');
      } else {
        alert(data.message || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testMessage.trim()) return;

    setTesting(true);
    setTestResponse('');

    try {
      const response = await fetch('/api/agents/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          message: testMessage
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTestResponse(data.response);
      } else {
        setTestResponse('Erro ao testar agente: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao testar:', error);
      setTestResponse('Erro ao testar agente');
    } finally {
      setTesting(false);
    }
  };

  const addKnowledge = () => {
    if (newKnowledge.title && newKnowledge.content) {
      setConfig({
        ...config,
        knowledgeBase: [...config.knowledgeBase, { ...newKnowledge, id: Date.now() }]
      });
      setNewKnowledge({ title: '', content: '' });
    }
  };

  const removeKnowledge = (id) => {
    setConfig({
      ...config,
      knowledgeBase: config.knowledgeBase.filter(k => k.id !== id)
    });
  };

  const addInstruction = () => {
    if (newInstruction.trim()) {
      setConfig({
        ...config,
        customInstructions: [...config.customInstructions, newInstruction]
      });
      setNewInstruction('');
    }
  };

  const removeInstruction = (index) => {
    setConfig({
      ...config,
      customInstructions: config.customInstructions.filter((_, i) => i !== index)
    });
  };

  const addStarter = () => {
    if (newStarter.trim()) {
      setConfig({
        ...config,
        conversationStarters: [...config.conversationStarters, newStarter]
      });
      setNewStarter('');
    }
  };

  const removeStarter = (index) => {
    setConfig({
      ...config,
      conversationStarters: config.conversationStarters.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#04F5A0] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header Fixo */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Voltar</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[#04F5A0]" />
                  {agentId ? 'Configurar Agente' : 'Novo Agente'}
                </h1>
                {agent && (
                  <p className="text-sm text-gray-400 mt-1">ID: {agent.id}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setTestMode(!testMode)}
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#2A2A2A] rounded-lg transition-all flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Testar</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-[#04F5A0] text-black font-semibold rounded-lg hover:bg-[#03E691] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] p-4 sticky top-24">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                    activeTab === 'basic'
                      ? 'bg-[#04F5A0]/10 text-[#04F5A0] border border-[#04F5A0]/20'
                      : 'hover:bg-[#1A1A1A] text-gray-400'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Básico</span>
                </button>

                <button
                  onClick={() => setActiveTab('prompt')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                    activeTab === 'prompt'
                      ? 'bg-[#04F5A0]/10 text-[#04F5A0] border border-[#04F5A0]/20'
                      : 'hover:bg-[#1A1A1A] text-gray-400'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">Prompt</span>
                </button>

                <button
                  onClick={() => setActiveTab('knowledge')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                    activeTab === 'knowledge'
                      ? 'bg-[#04F5A0]/10 text-[#04F5A0] border border-[#04F5A0]/20'
                      : 'hover:bg-[#1A1A1A] text-gray-400'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium">Base de Conhecimento</span>
                </button>

                <button
                  onClick={() => setActiveTab('behavior')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                    activeTab === 'behavior'
                      ? 'bg-[#04F5A0]/10 text-[#04F5A0] border border-[#04F5A0]/20'
                      : 'hover:bg-[#1A1A1A] text-gray-400'
                  }`}
                >
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">Comportamento</span>
                </button>

                <button
                  onClick={() => setActiveTab('integrations')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                    activeTab === 'integrations'
                      ? 'bg-[#04F5A0]/10 text-[#04F5A0] border border-[#04F5A0]/20'
                      : 'hover:bg-[#1A1A1A] text-gray-400'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Integrações</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3">
            {/* Tab: Básico */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] p-6">
                  <h2 className="text-xl font-bold mb-6">Informações Básicas</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Nome do Agente *
                      </label>
                      <input
                        type="text"
                        value={config.name}
                        onChange={(e) => setConfig({ ...config, name: e.target.value })}
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors"
                        placeholder="Ex: Assistente de Vendas SwiftBot"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Descrição
                      </label>
                      <textarea
                        value={config.description}
                        onChange={(e) => setConfig({ ...config, description: e.target.value })}
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors h-24 resize-none"
                        placeholder="Descreva o propósito e as responsabilidades do agente..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                          Modelo de IA
                        </label>
                        <select
                          value={config.model}
                          onChange={(e) => setConfig({ ...config, model: e.target.value })}
                          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors"
                        >
                          <option value="gpt-4">GPT-4 (Mais preciso)</option>
                          <option value="gpt-4-turbo">GPT-4 Turbo (Rápido)</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Econômico)</option>
                          <option value="claude-3-opus">Claude 3 Opus</option>
                          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                          Temperatura: {config.temperature}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={config.temperature}
                          onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Preciso</span>
                          <span>Criativo</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        value={config.maxTokens}
                        onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors"
                        min="100"
                        max="4000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Limite de tokens por resposta (100-4000)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                        API Key
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-gray-400 hover:text-white"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </label>
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={config.apiKey}
                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors font-mono text-sm"
                        placeholder="sk-..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Sua chave API OpenAI ou provedor de IA
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mensagens */}
                <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] p-6">
                  <h2 className="text-xl font-bold mb-6">Mensagens do Sistema</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Mensagem de Boas-vindas
                      </label>
                      <textarea
                        value={config.welcomeMessage}
                        onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors h-24 resize-none"
                        placeholder="Olá! Como posso ajudar você hoje?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Mensagem de Fallback
                      </label>
                      <textarea
                        value={config.fallbackMessage}
                        onChange={(e) => setConfig({ ...config, fallbackMessage: e.target.value })}
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors h-24 resize-none"
                        placeholder="Desculpe, não entendi. Pode reformular sua pergunta?"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enviada quando o agente não consegue responder
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Prompt */}
            {activeTab === 'prompt' && (
              <div className="space-y-6">
                <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold">System Prompt</h2>
                      <p className="text-sm text-gray-400 mt-1">
                        Define o comportamento e personalidade do agente
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const template = `Você é um assistente virtual profissional chamado ${config.name || '[Nome]'}. 

Suas responsabilidades incluem:
- Responder perguntas de forma clara e objetiva
- Manter um tom profissional e amigável
- Solicitar esclarecimentos quando necessário
- Não inventar informações

Diretrizes:
- Seja sempre educado e prestativo
- Use linguagem clara e acessível
- Mantenha respostas concisas quando possível
- Peça permissão antes de realizar ações`;
                        setConfig({ ...config, systemPrompt: template });
                      }}
                      className="px-3 py-1.5 text-sm bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#2A2A2A] rounded-lg transition-colors"
                    >
                      Usar Template
                    </button>
                  </div>
                  
                  <textarea
                    value={config.systemPrompt}
                    onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors h-96 resize-none font-mono text-sm"
                    placeholder="Você é um assistente especializado em..."
                  />

                  <div className="mt-4 p-4 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#04F5A0] flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-400">
                        <p className="font-medium text-white mb-1">Dicas para um bom prompt:</p>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>Seja específico sobre a função e objetivos</li>
                          <li>Defina o tom e estilo de comunicação</li>
                          <li>Liste restrições e limitações importantes</li>
                          <li>Inclua exemplos se necessário</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instruções Personalizadas */}
                <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] p-6">
                  <h2 className="text-xl font-bold mb-6">Instruções Personalizadas</h2>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newInstruction}
                        onChange={(e) => setNewInstruction(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addInstruction()}
                        className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2 focus:outline-none focus:border-[#04F5A0] transition-colors"
                        placeholder="Ex: Sempre pergunte o nome do cliente antes de continuar"
                      />
                      <button
                        onClick={addInstruction}
                        className="px-4 py-2 bg-[#04F5A0] text-black rounded-lg hover:bg-[#03E691] transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {config.customInstructions.length > 0 && (
                      <div className="space-y-2">
                        {config.customInstructions.map((instruction, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg"
                          >
                            <Check className="w-5 h-5 text-[#04F5A0] flex-shrink-0" />
                            <span className="flex-1 text-sm">{instruction}</span>
                            <button
                              onClick={() => removeInstruction(index)}
                              className="text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Conversation Starters */}
                <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] p-6">
                  <h2 className="text-xl font-bold mb-6">Sugestões de Conversa</h2>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newStarter}
                        onChange={(e) => setNewStarter(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addStarter()}
                        className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2 focus:outline-none focus:border-[#04F5A0] transition-colors"
                        placeholder="Ex: Como posso criar minha primeira automação?"
                      />
                      <button
                        onClick={addStarter}
                        className="px-4 py-2 bg-[#04F5A0] text-black rounded-lg hover:bg-[#03E691] transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {config.conversationStarters.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {config.conversationStarters.map((starter, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg group"
                          >
                            <MessageSquare className="w-5 h-5 text-[#04F5A0] flex-shrink-0 mt-0.5" />
                            <span className="flex-1 text-sm">{starter}</span>
                            <button
                              onClick={() => removeStarter(index)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Knowledge Base */}
            {activeTab === 'knowledge' && (
              <div className="space-y-6">
                <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] p-6">
                  <h2 className="text-xl font-bold mb-6">Base de Conhecimento</h2>
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={newKnowledge.title}
                        onChange={(e) => setNewKnowledge({ ...newKnowledge, title: e.target.value })}
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2 focus:outline-none focus:border-[#04F5A0] transition-colors"
                        placeholder="Título do conhecimento"
                      />
                      <textarea
                        value={newKnowledge.content}
                        onChange={(e) => setNewKnowledge({ ...newKnowledge, content: e.target.value })}
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors h-32 resize-none"
                        placeholder="Conteúdo do conhecimento..."
                      />
                      <button
                        onClick={addKnowledge}
                        className="w-full px-4 py-2 bg-[#04F5A0] text-black rounded-lg hover:bg-[#03E691] transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Adicionar Conhecimento
                      </button>
                    </div>

                    {config.knowledgeBase.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-medium text-gray-300">Conhecimentos Salvos</h3>
                        {config.knowledgeBase.map((knowledge) => (
                          <div
                            key={knowledge.id}
                            className="p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{knowledge.title}</h4>
                              <button
                                onClick={() => removeKnowledge(knowledge.id)}
                                className="text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-400">{knowledge.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Behavior */}
            {activeTab === 'behavior' && (
              <div className="space-y-6">
                <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] p-6">
                  <h2 className="text-xl font-bold mb-6">Configurações de Comportamento</h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                          Personalidade
                        </label>
                        <select
                          value={config.behaviorSettings.personality}
                          onChange={(e) => setConfig({
                            ...config,
                            behaviorSettings: { ...config.behaviorSettings, personality: e.target.value }
                          })}
                          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors"
                        >
                          <option value="professional">Profissional</option>
                          <option value="friendly">Amigável</option>
                          <option value="casual">Casual</option>
                          <option value="formal">Formal</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                          Estilo de Resposta
                        </label>
                        <select
                          value={config.behaviorSettings.responseStyle}
                          onChange={(e) => setConfig({
                            ...config,
                            behaviorSettings: { ...config.behaviorSettings, responseStyle: e.target.value }
                          })}
                          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors"
                        >
                          <option value="concise">Conciso</option>
                          <option value="detailed">Detalhado</option>
                          <option value="balanced">Balanceado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                          Idioma
                        </label>
                        <select
                          value={config.behaviorSettings.language}
                          onChange={(e) => setConfig({
                            ...config,
                            behaviorSettings: { ...config.behaviorSettings, language: e.target.value }
                          })}
                          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors"
                        >
                          <option value="pt-BR">Português (Brasil)</option>
                          <option value="en-US">Inglês (EUA)</option>
                          <option value="es-ES">Espanhol</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                          Fuso Horário
                        </label>
                        <select
                          value={config.behaviorSettings.timezone}
                          onChange={(e) => setConfig({
                            ...config,
                            behaviorSettings: { ...config.behaviorSettings, timezone: e.target.value }
                          })}
                          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors"
                        >
                          <option value="America/Sao_Paulo">São Paulo (BRT)</option>
                          <option value="America/New_York">Nova York (EST)</option>
                          <option value="Europe/London">Londres (GMT)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
                        <div>
                          <p className="font-medium">Habilitar Emojis</p>
                          <p className="text-sm text-gray-400">Usar emojis nas respostas</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.behaviorSettings.enableEmojis}
                            onChange={(e) => setConfig({
                              ...config,
                              behaviorSettings: { ...config.behaviorSettings, enableEmojis: e.target.checked }
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#04F5A0]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
                        <div>
                          <p className="font-medium">Habilitar Markdown</p>
                          <p className="text-sm text-gray-400">Formatar texto com markdown</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.behaviorSettings.enableMarkdown}
                            onChange={(e) => setConfig({
                              ...config,
                              behaviorSettings: { ...config.behaviorSettings, enableMarkdown: e.target.checked }
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#04F5A0]"></div>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                          Limite de Conversa
                        </label>
                        <input
                          type="number"
                          value={config.behaviorSettings.maxConversationLength}
                          onChange={(e) => setConfig({
                            ...config,
                            behaviorSettings: { ...config.behaviorSettings, maxConversationLength: parseInt(e.target.value) }
                          })}
                          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors"
                          min="10"
                          max="100"
                        />
                        <p className="text-xs text-gray-500 mt-1">Máximo de mensagens na conversa</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                          Janela de Contexto
                        </label>
                        <input
                          type="number"
                          value={config.behaviorSettings.contextWindow}
                          onChange={(e) => setConfig({
                            ...config,
                            behaviorSettings: { ...config.behaviorSettings, contextWindow: parseInt(e.target.value) }
                          })}
                          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors"
                          min="5"
                          max="50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Mensagens anteriores consideradas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Integrations */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] p-6">
                  <h2 className="text-xl font-bold mb-6">Integrações</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
                      <div>
                        <p className="font-medium">WhatsApp</p>
                        <p className="text-sm text-gray-400">Conectar com WhatsApp Business</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.integrations.whatsapp}
                          onChange={(e) => setConfig({
                            ...config,
                            integrations: { ...config.integrations, whatsapp: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#04F5A0]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
                      <div>
                        <p className="font-medium">Telegram</p>
                        <p className="text-sm text-gray-400">Conectar com Telegram Bot</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.integrations.telegram}
                          onChange={(e) => setConfig({
                            ...config,
                            integrations: { ...config.integrations, telegram: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#04F5A0]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
                      <div>
                        <p className="font-medium">Slack</p>
                        <p className="text-sm text-gray-400">Integrar com Slack Workspace</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.integrations.slack}
                          onChange={(e) => setConfig({
                            ...config,
                            integrations: { ...config.integrations, slack: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#04F5A0]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
                      <div>
                        <p className="font-medium">Discord</p>
                        <p className="text-sm text-gray-400">Adicionar bot ao Discord</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.integrations.discord}
                          onChange={(e) => setConfig({
                            ...config,
                            integrations: { ...config.integrations, discord: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#04F5A0]"></div>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={config.integrations.webhook}
                      onChange={(e) => setConfig({
                        ...config,
                        integrations: { ...config.integrations, webhook: e.target.value }
                      })}
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors font-mono text-sm"
                      placeholder="https://seu-webhook.com/endpoint"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Receba notificações de eventos via webhook
                    </p>
                  </div>
                </div>

                {/* Analytics */}
                <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] p-6">
                  <h2 className="text-xl font-bold mb-6">Analytics</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
                      <div>
                        <p className="font-medium">Rastrear Conversas</p>
                        <p className="text-sm text-gray-400">Salvar histórico de conversas</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.analytics.trackConversations}
                          onChange={(e) => setConfig({
                            ...config,
                            analytics: { ...config.analytics, trackConversations: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#04F5A0]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
                      <div>
                        <p className="font-medium">Análise de Sentimento</p>
                        <p className="text-sm text-gray-400">Detectar sentimento dos usuários</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.analytics.trackSentiment}
                          onChange={(e) => setConfig({
                            ...config,
                            analytics: { ...config.analytics, trackSentiment: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#04F5A0]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
                      <div>
                        <p className="font-medium">Rastrear Tópicos</p>
                        <p className="text-sm text-gray-400">Identificar tópicos principais</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.analytics.trackTopics}
                          onChange={(e) => setConfig({
                            ...config,
                            analytics: { ...config.analytics, trackTopics: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#04F5A0]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
                      <div>
                        <p className="font-medium">Gerar Relatórios</p>
                        <p className="text-sm text-gray-400">Relatórios automáticos semanais</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.analytics.generateReports}
                          onChange={(e) => setConfig({
                            ...config,
                            analytics: { ...config.analytics, generateReports: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#04F5A0]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Panel */}
      {testMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#121212] border-b border-[#2A2A2A] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Zap className="w-6 h-6 text-[#04F5A0]" />
                  Testar Agente
                </h2>
                <button
                  onClick={() => setTestMode(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Mensagem de Teste
                </label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus:outline-none focus:border-[#04F5A0] transition-colors h-24 resize-none"
                  placeholder="Digite sua mensagem de teste..."
                />
              </div>

              <button
                onClick={handleTest}
                disabled={testing || !testMessage.trim()}
                className="w-full px-4 py-3 bg-[#04F5A0] text-black font-semibold rounded-lg hover:bg-[#03E691] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Enviar Teste
                  </>
                )}
              </button>

              {testResponse && (
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Resposta do Agente
                  </label>
                  <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{testResponse}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente principal exportado com Suspense
export default function AgentConfigPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#04F5A0] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando configurações...</p>
        </div>
      </div>
    }>
      <AgentConfigContent />
    </Suspense>
  );
}
