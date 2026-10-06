import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  HelpCircle,
  ChevronRight,
  ExternalLink,
  Search
} from 'lucide-react';
import { aiApi, knowledgeApi } from '../services/api';

export default function AiAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello, I am **MedOps AI Assistant**. I have real-time access to our hospital's inventory databases, FEFO batch queues, and clinical Standard Operating Procedures (SOPs).\n\nHow can I assist your clinical or procurement workflow today?",
      sources: [],
      suggestedFollowUps: [
        "Which medicines are at high expiry risk?",
        "Which medicines may run out soon?",
        "What are the Cold Chain storage guidelines?",
        "How does the FEFO dispensing protocol work?",
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('CHAT'); // CHAT or SOP_LIBRARY
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docSearch, setDocSearch] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadSopDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadSopDocuments = async () => {
    try {
      const res = await knowledgeApi.getAll();
      setDocuments(res.data || []);
      if (res.data?.length > 0) {
        setSelectedDoc(res.data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await aiApi.chat({
        message: text,
        includeRag: true,
      });

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: res.data.reply,
        sources: res.data.sources || [],
        suggestedFollowUps: res.data.suggestedFollowUps || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: "I encountered an error connecting to the intelligence engine. Please try asking again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
    d.category.toLowerCase().includes(docSearch.toLowerCase()) ||
    d.tags?.toLowerCase().includes(docSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                AI Knowledge Assistant
              </h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                RAG-powered
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ask questions about medicines, inventory levels, and hospital SOP documentation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('CHAT')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeView === 'CHAT' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Assistant</span>
          </button>
          <button
            onClick={() => setActiveView('SOP_LIBRARY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeView === 'SOP_LIBRARY' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>SOP Library ({documents.length})</span>
          </button>
        </div>
      </div>

      {/* CHAT VIEW */}
      {activeView === 'CHAT' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-[calc(100vh-230px)] min-h-[500px]">
          
          {/* Chat Messages Feed */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white'
                  }`}
                >
                  {msg.sender === 'user' ? 'You' : <Sparkles className="w-4 h-4" />}
                </div>

                <div className={`space-y-2 text-xs leading-relaxed ${msg.sender === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block p-4 rounded-2xl text-left whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Grounded RAG Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-left space-y-1.5">
                      <span className="font-bold text-emerald-950 flex items-center gap-1 text-[11px]">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        Referenced Hospital Guidelines (RAG):
                      </span>
                      {msg.sources.map((src, i) => (
                        <div key={i} className="text-[11px] text-slate-700 bg-white/90 p-2 rounded-xl border border-emerald-100">
                          <span className="font-bold text-emerald-800 block">{src.title} ({src.category})</span>
                          <span className="text-slate-600 italic">"{src.snippet}"</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested Follow Up Questions */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 text-left">
                      {msg.suggestedFollowUps.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200/80 text-[11px] text-slate-600 transition font-medium"
                        >
                          💬 {item}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 block px-1">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-md">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-100 rounded-tl-none text-xs text-slate-500 font-medium flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse delay-200"></span>
                  </div>
                  <span>Analyzing inventory state & retrieving SOP protocols...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask anything about medicines, batches, stockout predictions, FEFO, or SOPs..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-700/30 transition disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* SOP LIBRARY VIEW */}
      {activeView === 'SOP_LIBRARY' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Docs List Sidebar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search hospital policies..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {filteredDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-3 rounded-2xl transition border ${
                    selectedDoc?.id === doc.id
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold shadow-sm'
                      : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">{doc.category}</div>
                  <div className="text-xs font-extrabold text-slate-900 mt-0.5 line-clamp-1">{doc.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">Ver {doc.version}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Doc Content Viewer */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
            {selectedDoc ? (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                    {selectedDoc.category} • v{selectedDoc.version}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-2">{selectedDoc.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Tags: {selectedDoc.tags}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-mono">
                  {selectedDoc.content}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Authorized Clinical Standard Document</span>
                  <button
                    onClick={() => {
                      setActiveView('CHAT');
                      handleSendMessage(`Explain policy: ${selectedDoc.title}`);
                    }}
                    className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Ask AI about this SOP</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 text-xs">
                Select an SOP document from the list to view specifications.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
