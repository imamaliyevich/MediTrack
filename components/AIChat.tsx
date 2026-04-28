import { useState, useEffect, useRef } from 'react';
import { AIMessage } from '@/types';
import axios from 'axios';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  missedCount: number;
  patientName: string;
  patientData?: {
    medications: any[];
    logs: any[];
    adherenceRate: number;
    contract: any;
  };
}

export default function AIChat({ isOpen, onClose, missedCount, patientName, patientData }: AIChatProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      if (missedCount > 0) {
        loadInitialMessage();
      } else {
        // Agar missed doses bo'lmasa, oddiy greeting
        setMessages([{
          role: 'ai',
          content: `Salom ${patientName}! Men sizning shaxsiy sog'liq yordamchiingizman.

Sizning barcha ma'lumotlaringizni ko'ra olaman - qaysi dorini qachon ichganingiz, rioya holatingiz va boshqalar.

Bugun o'zingizni qanday his qilyapsiz? Yordam kerakmi?`,
          timestamp: new Date().toISOString()
        }]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadInitialMessage = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/ai-intervention', {
        type: 'initial',
        missedCount,
        patientContext: `Bemor: ${patientName}`,
        patientData: patientData
      });
      
      setMessages([{
        role: 'ai',
        content: response.data.message,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to load AI message:', error);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      }));

      const response = await axios.post('/api/ai-intervention', {
        type: 'response',
        userMessage: input,
        conversationHistory,
        patientContext: `Bemor: ${patientName}, O'tkazilgan: ${missedCount}`,
        patientData: patientData
      });

      setMessages(prev => [...prev, {
        role: 'ai',
        content: response.data.message,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md transition-smooth">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Sog'liq Yordamchisi</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="h-80 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Javobingizni yozing..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth text-sm font-medium"
            >
              Yuborish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
