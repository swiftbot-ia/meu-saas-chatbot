'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { StickyNote, Plus, Trash2, Loader2 } from 'lucide-react';

const NotesTab = ({ conversationId, instanceName }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        if (conversationId) {
            fetchNotes();
        }
    }, [conversationId]);

    const fetchNotes = async () => {
        try {
            const response = await axios.get('/api/crm/notes', {
                params: { conversation_id: conversationId, instance_name: instanceName }
            });
            setNotes(response.data.notes || []);
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setSaving(true);
        try {
            const response = await axios.post('/api/crm/notes', {
                conversation_id: conversationId,
                instance_name: instanceName,
                content: newNote.trim()
            });
            setNotes([response.data.note, ...notes]);
            setNewNote('');
        } catch (error) {
            console.error('Error creating note:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (noteId) => {
        try {
            await axios.delete(`/api/crm/notes/${noteId}`);
            setNotes(notes.filter(n => n.id !== noteId));
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#00FF99] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Add Note Form */}
            <form onSubmit={handleSubmit} className="bg-[#2A2A2A] rounded-xl p-4 space-y-3">
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Escreva uma nota sobre esta oportunidade..."
                    rows={3}
                    className="w-full px-4 py-3 bg-[#1E1E1E] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/50 placeholder-gray-500 resize-none"
                />
                <button
                    type="submit"
                    disabled={saving || !newNote.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Plus size={18} />
                            <span>Adicionar Nota</span>
                        </>
                    )}
                </button>
            </form>

            {/* Notes List */}
            <div className="space-y-2">
                {notes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <StickyNote className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma nota ainda</p>
                    </div>
                ) : (
                    notes.map((note) => (
                        <div
                            key={note.id}
                            className="bg-[#2A2A2A] rounded-xl p-4 group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-white whitespace-pre-wrap break-words">
                                        {note.content}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {formatDateTime(note.created_at)}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleDelete(note.id)}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotesTab;
