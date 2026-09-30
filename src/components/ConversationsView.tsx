import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  UserCheck, 
  Clock, 
  Check, 
  CheckCheck, 
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Search,
  Instagram
} from 'lucide-react';
import { api } from '../services/api.ts';
import type { Message, Customer, Conversation } from '../types/index.ts';

interface ConversationsViewProps {
  onRefreshStats: () => void;
}

export const ConversationsView: React.FC<ConversationsViewProps> = ({ onRefreshStats }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  const loadConversations = async () => {
    try {
      setLoading(true);
      const list = await api.getConversations();
      setConversations(list);
      if (list.length > 0 && !selectedConvId) {
        setSelectedConvId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when selected conversation changes
  useEffect(() => {
    if (!selectedConvId) return;
    const fetchThread = async () => {
      try {
        const msgs = await api.getMessages(selectedConvId);
        setMessages(msgs);

        const currentConv = conversations.find(c => c.id === selectedConvId);
        if (currentConv) {
          const detail = await api.getCustomer(currentConv.customer_id);
          setCustomer(detail.customer);
        }
      } catch (err) {
        console.error('Failed to load thread messages:', err);
      }
    };
    fetchThread();
  }, [selectedConvId]);

  const handleSendManualReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !replyText.trim() || sending) return;

    setSending(true);
    try {
      const newMsg = await api.sendHumanReply(selectedConvId, replyText.trim());
      setMessages(prev => [...prev, newMsg]);
      setReplyText('');
      loadConversations();
      onRefreshStats();
    } catch (err) {
      console.error('Failed to send human reply:', err);
    } finally {
      setSending(false);
    }
  };

  const handleToggleHandoff = async () => {
    if (!selectedConvId) return;
    try {
      const res = await api.toggleHumanHandoff(selectedConvId);
      setCustomer(res.customer);
      setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, status: res.conversation.status, human_required: res.customer.human_required } : c));
      onRefreshStats();
    } catch (err) {
      console.error('Failed to toggle handoff:', err);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.customer_username.toLowerCase().includes(search.toLowerCase()) ||
    (c.last_message_preview && c.last_message_preview.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[calc(100vh-140px)]">
      {/* Top Bar */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">صندوق المحادثات والرسائل (Inbox)</h2>
        </div>
        <button
          onClick={loadConversations}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="تحديث المحادثات"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Right Pane (RTL): Conversations List */}
        <div className="w-80 sm:w-96 border-l border-slate-800 flex flex-col bg-slate-950/40">
          {/* Search */}
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث عن مستخدم أو رسالة..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                {search ? 'لا توجد نتائج بحث مطابقة' : 'لا توجد محادثات مسجلة حتى الآن'}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const isHumanRequired = conv.human_required || conv.status === 'human_handoff';

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full p-3.5 text-right transition-colors flex items-start gap-3 ${
                      isSelected
                        ? 'bg-indigo-600/10 border-r-4 border-indigo-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                      {conv.customer_username.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-white truncate">
                          @{conv.customer_username}
                        </span>
                        {conv.last_message_at && (
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(conv.last_message_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mb-1.5">
                        {conv.last_message_preview || 'محادثة جديدة'}
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isHumanRequired && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                            تدخل بشري
                          </span>
                        )}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {conv.lead_status}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                          Score: {conv.lead_score}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Left Pane (RTL): Active Thread */}
        <div className="flex-1 flex flex-col bg-slate-900/30">
          {selectedConvId && customer ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                    {customer.instagram_username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">@{customer.instagram_username}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {customer.lead_status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>الخدمة المطلوبة: {customer.requested_service || 'لم تحدد بعد'}</span>
                      <span>•</span>
                      <span>درجة الاهتمام: {customer.lead_score}%</span>
                    </div>
                  </div>
                </div>

                {/* Handoff Toggle Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleHandoff}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      customer.human_required
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30'
                    }`}
                  >
                    {customer.human_required ? (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>استئناف الرد الذكي للـ AI</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>تحويل لموظف وتجميد الـ AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Warning Banner if Human Required */}
              {customer.human_required && (
                <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    الرد التلقائي متوقف حالياً لهذا العميل لأن العميل طلب التحدث مع مسؤول أو تم تفعيل وضع التدخل البشري.
                  </span>
                </div>
              )}

              {/* Messages Bubble Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    لا توجد رسائل مسجلة في هذه المحادثة
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isCustomer = msg.sender === 'customer';
                    const isAI = msg.is_ai || msg.sender === 'ai';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500">
                          {isCustomer ? (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              العميل (@{customer.instagram_username})
                            </span>
                          ) : isAI ? (
                            <span className="flex items-center gap-1 text-indigo-400 font-medium">
                              <Bot className="w-3 h-3" />
                              رد ذكي (Vexora AI - لهجة مصرية)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                              <UserCheck className="w-3 h-3" />
                              موظف بشري (Admin)
                            </span>
                          )}
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div
                          className={`max-w-md sm:max-w-lg rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                            isCustomer
                              ? 'bg-slate-800 text-slate-100 rounded-tr-none border border-slate-700'
                              : isAI
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tl-none shadow-indigo-600/20'
                              : 'bg-emerald-600 text-white rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message}</p>

                          {/* Extra AI analysis metadata if available */}
                          {msg.metadata && msg.metadata.intent && (
                            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] opacity-80">
                              <span>النية: {msg.metadata.intent}</span>
                              {msg.metadata.response_time_ms && (
                                <span>الزمن: {msg.metadata.response_time_ms}ms</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Input Bar */}
              <form onSubmit={handleSendManualReply} className="p-3 border-t border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="اكتب رداً يدوياً للعميل كـ Human Agent..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || sending}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                    title="إرسال الرد"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
              <MessageSquare className="w-10 h-10 opacity-30 text-indigo-400" />
              <div className="text-sm font-semibold text-slate-300">اختر محادثة لعرض تفاصيلها</div>
              <div className="text-xs max-w-sm">
                يمكنك معاينة كل رسائل إنستغرام السابقة، ومتابعة الردود الذكية التي أرسلها الذكاء الاصطناعي باللهجة المصرية.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
