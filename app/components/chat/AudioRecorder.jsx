'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Pause, Play, Send, Mic } from 'lucide-react';

export default function AudioRecorder({ onSend, onCancel }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animationFrameRef = useRef(null);
    const startTimeRef = useRef(null);
    const pausedDurationRef = useRef(0);

    useEffect(() => {
        startRecording();
        return () => {
            stopRecordingCleanup();
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup Audio Context for visualization
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);

            // Setup MediaRecorder
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.start(100); // Collect chunks every 100ms
            setIsRecording(true);
            startTimeRef.current = Date.now();

            // Start timer
            timerRef.current = setInterval(() => {
                if (!isPaused) {
                    setDuration(prev => prev + 1);
                }
            }, 1000);

            // Start visualization
            visualize();

        } catch (error) {
            console.error('Error accessing microphone:', error);
            onCancel();
        }
    };

    const visualize = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);

        animationFrameRef.current = requestAnimationFrame(visualize);
    };

    const stopRecordingCleanup = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        if (audioContextRef.current) {
            audioContextRef.current.close();
        }

        // Stop all tracks
        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handlePauseResume = () => {
        if (isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
        } else {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
        }
    };

    const handleSend = () => {
        if (!mediaRecorderRef.current) return;

        // Stop recording and create blob
        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const audioFile = new File([audioBlob], 'audio_message.webm', { type: 'audio/webm' });
            onSend(audioFile, duration);
        };

        stopRecordingCleanup();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Generate bars for visualization based on current audio level
    // We'll create a fake "history" effect by just animating random bars scaled by volume
    const renderVisualizer = () => {
        return (
            <div className="flex items-center space-x-[2px] h-8 mx-4">
                {[...Array(20)].map((_, i) => {
                    // Create a wave effect
                    const height = Math.max(4, Math.random() * audioLevel * 0.8);
                    return (
                        <div
                            key={i}
                            className="w-[3px] bg-gray-400 rounded-full transition-all duration-75"
                            style={{
                                height: `${isPaused ? 4 : height}px`,
                                opacity: isPaused ? 0.3 : 1
                            }}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex items-center w-full animate-in fade-in duration-200">
            {/* Delete button */}
            <button
                onClick={() => {
                    stopRecordingCleanup();
                    onCancel();
                }}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Cancelar"
            >
                <Trash2 size={20} />
            </button>

            {/* Timer */}
            <div className="flex items-center ml-2">
                <div className={`w-2 h-2 rounded-full mr-2 ${isPaused ? 'bg-gray-500' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-white font-mono min-w-[45px]">{formatTime(duration)}</span>
            </div>

            {/* Visualizer */}
            <div className="flex-1 flex justify-center items-center overflow-hidden">
                {renderVisualizer()}
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
                {/* Pause/Resume */}
                {/* <button
          onClick={handlePauseResume}
          className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
        >
          {isPaused ? <Mic size={24} /> : <Pause size={24} />}
        </button> */}

                {/* Send */}
                <button
                    onClick={handleSend}
                    className="p-3 bg-[#00FF99] text-black rounded-full hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all transform hover:scale-105"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
}
