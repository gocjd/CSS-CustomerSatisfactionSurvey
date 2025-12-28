"use client";

import React, { useState, useEffect, useRef } from 'react';
import surveyDataRaw from '@/data/sample-survey.json';
import { Survey } from '@/types';
import { useSurveyRunnerStore } from '@/stores/useSurveyRunnerStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import Link from 'next/link';
import { ChevronLeft, Send, User, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

const surveyData = surveyDataRaw as unknown as Survey;

interface Message {
    id: string;
    role: 'bot' | 'user';
    content: string | number | boolean;
    questionType?: string; // To render specific UI in chat bubble if needed
}

export default function Type3Page() {
    const {
        survey,
        currentQuestionId,
        answers,
        setAnswer,
        initSurvey,
        next,
        isCompleted
    } = useSurveyRunnerStore();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState<any>('');
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize
    useEffect(() => {
        initSurvey(surveyData);
    }, [initSurvey]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // React to question changes (Bot speaks)
    useEffect(() => {
        if (!survey || isCompleted) {
            if (isCompleted) {
                setIsTyping(true);
                setTimeout(() => {
                    setMessages(prev => [...prev, { id: 'end', role: 'bot', content: "설문에 참여해 주셔서 감사합니다! 좋은 하루 되세요. 🎉" }]);
                    setIsTyping(false);
                }, 800);
            }
            return;
        }

        // If it's the very start or strictly a new question
        if (currentQuestionId) {
            const q = survey.questions.find(quest => quest.questionId === currentQuestionId);
            if (q) {
                // Avoid duplicate message if re-rendering
                const lastMsg = messages[messages.length - 1];
                if (lastMsg?.id === currentQuestionId) return;

                setIsTyping(true);
                setTimeout(() => {
                    setMessages(prev => [
                        ...prev,
                        { id: currentQuestionId, role: 'bot', content: q.prompt, questionType: q.questionType }
                    ]);
                    setIsTyping(false);
                }, 800);

                // Reset input default
                setInputValue('');
            }
        } else if (messages.length === 0 && survey) {
            // Initial greeting
            setMessages([
                { id: 'intro', role: 'bot', content: `안녕하세요! 👋 ${survey.description}` }
            ]);
        }
    }, [currentQuestionId, isCompleted, survey]);

    const handleSend = (value: any = inputValue) => {
        if (!currentQuestionId) return;

        // Add user message to log
        let displayContent = value;
        // Format display content if needed (e.g. searching label for value)
        // For simplicity, just showing value

        setMessages(prev => [...prev, { id: `ans-${currentQuestionId}`, role: 'user', content: displayContent }]);

        // Update store
        setAnswer(currentQuestionId, value);

        // Move next
        // Small delay to feel natural
        setTimeout(() => {
            next();
        }, 300);
    };

    if (!survey) return <div className="p-8 text-center bg-slate-100 h-screen">Loading...</div>;

    const currentQ = survey.questions.find(q => q.questionId === currentQuestionId);

    const renderInputArea = () => {
        if (isCompleted) {
            return (
                <div className="flex justify-center p-4">
                    <Link href="/surveys">
                        <Button variant="outline">데모 목록으로</Button>
                    </Link>
                </div>
            );
        }

        if (isTyping || !currentQ) return <div className="p-4 text-center text-sm text-muted-foreground">보트가 입력 중...</div>;

        // 1. Text Opinion
        if (currentQ.questionType === 'text_opinion') {
            return (
                <div className="flex w-full items-center space-x-2 p-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="답변을 입력하세요..."
                        onKeyDown={(e) => e.key === 'Enter' && inputValue && handleSend()}
                    />
                    <Button onClick={() => handleSend()} disabled={!inputValue && currentQ.required}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            );
        }

        // 2. Multiple Choice
        if (currentQ.questionType === 'multiple_choice') {
            return (
                <div className="flex flex-wrap gap-2 p-2 justify-center">
                    {currentQ.options?.map(opt => (
                        <Button key={opt.value} onClick={() => handleSend(opt.value)} variant="secondary" className="rounded-full">
                            {opt.label}
                        </Button>
                    ))}
                </div>
            );
        }

        // 3. Likert Scale (treated as rating/choice)
        if (currentQ.displayType === 'likert_scale') {
            return (
                <div className="flex flex-wrap gap-2 p-2 justify-center w-full">
                    {currentQ.options?.map(opt => (
                        <Button key={opt.value} onClick={() => handleSend(opt.value)} variant="outline" className="flex-1 min-w-[60px]">
                            {opt.label}
                        </Button>
                    ))}
                </div>
            );
        }

        // 4. Voice (Placeholder)
        if (currentQ.questionType === 'voice_opinion') {
            return (
                <div className="p-4 w-full">
                    <Button className="w-full" onClick={() => handleSend("(음성 녹음 제출됨)")} variant="secondary">
                        🎤 녹음 시작 (시뮬레이션)
                    </Button>
                </div>
            );
        }

        return (
            <div className="p-4">
                <Button onClick={() => handleSend("Next")} className="w-full">Next</Button>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900 mx-auto max-w-md shadow-2xl overflow-hidden border-x">

            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-4 shadow-sm z-10 flex items-center">
                <Link href="/surveys" className="mr-4">
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </Link>
                <div>
                    <h1 className="font-semibold">{survey.title}</h1>
                    <p className="text-xs text-muted-foreground">Chat Survey</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex items-end max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <Avatar className="w-8 h-8 mx-2">
                                {msg.role === 'bot' ? (
                                    <AvatarFallback className="bg-blue-500 text-white"><Bot size={16} /></AvatarFallback>
                                ) : (
                                    <AvatarFallback className="bg-slate-500 text-white"><User size={16} /></AvatarFallback>
                                )}
                            </Avatar>

                            <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm rounded-bl-none border border-slate-100 dark:border-slate-700'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    </motion.div>
                ))}
                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="flex items-end">
                            <Avatar className="w-8 h-8 mx-2">
                                <AvatarFallback className="bg-blue-500 text-white"><Bot size={16} /></AvatarFallback>
                            </Avatar>
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm flex space-x-1 items-center h-10">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-0"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300"></div>
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-slate-800 p-2 border-t safe-area-inset-bottom">
                {renderInputArea()}
            </div>
        </div>
    );
}
