import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Copy,
  Check,
  Bot,
  User,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  draftWhatsApp?: {
    phone: string;
    text: string;
  };
}

interface AIAssistantModalProps {
  initialPrompt?: string;
  onClose: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  initialPrompt,
  onClose,
}) => {
  const { students, batches, attendance, feePayments, tests, testResults, getStudentStats } = useApp();

  const [inputQuery, setInputQuery] = useState(initialPrompt || '');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: `Hello! I am your **EduTrack AI Administrative Assistant** powered by Gemini.

I have direct access to your students, batch schedules, attendance records, and fee ledgers.
You can ask me questions or ask me to draft communications:
• *"Which students have pending fees?"*
• *"Show students with attendance below 75%"*
• *"Draft a polite WhatsApp fee reminder for Rahul Verma"*
• *"Who are the top performers in JEE Mock Test?"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Execute initial prompt if passed
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      handleSend(initialPrompt);
    }
  }, []);

  // Prepare full data context for Gemini
  const prepareContext = () => {
    const studentSummaries = students.map((s) => {
      const stats = getStudentStats(s.id);
      const batch = batches.find((b) => b.id === s.batchId);
      return {
        id: s.id,
        name: s.name,
        phone: s.phone,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        batchName: batch?.name || s.batchId,
        agreedFee: stats.totalFee,
        paidFee: stats.paidFee,
        pendingDue: stats.pendingDue,
        attendancePercentage: stats.attendancePercentage,
        attendedDays: stats.attendedClasses,
        totalClasses: stats.totalClasses,
        testAverage: stats.averageScorePercentage,
        recentRank: stats.recentRank,
      };
    });

    const batchSummaries = batches.map((b) => ({
      id: b.id,
      name: b.name,
      subject: b.subject,
      teacher: b.teacher,
      capacity: b.capacity,
      enrolled: students.filter((s) => s.batchId === b.id).length,
    }));

    return {
      totalStudentsCount: students.length,
      batches: batchSummaries,
      students: studentSummaries,
      tests: tests.map((t) => ({
        id: t.id,
        title: t.title,
        batchId: t.batchId,
        date: t.date,
        totalMarks: t.totalMarks,
      })),
    };
  };

  // Local fallback smart response if Gemini API key isn't provided or offline
  const generateLocalResponse = (prompt: string): string => {
    const q = prompt.toLowerCase();

    // Query 1: Pending fees
    if (q.includes('pending') || q.includes('due') || q.includes('fee')) {
      if (q.includes('draft') || q.includes('remind') || q.includes('whatsapp')) {
        // Draft reminder
        const matched = students.find((s) => q.includes(s.name.toLowerCase()));
        const target = matched || students.find((s) => getStudentStats(s.id).pendingDue > 0) || students[0];
        const stats = getStudentStats(target.id);

        return `Here is a drafted polite WhatsApp fee reminder for **${target.name}'s** parents:

---
**Recipient:** ${target.guardianName} (+91 ${target.guardianPhone || target.phone})
**Subject:** Fee Balance Reminder - EduTrack Academy

Dear ${target.guardianName},
Greetings from EduTrack Learning Academy.
This is a gentle reminder that an outstanding tuition fee balance of **${formatCurrency(stats.pendingDue)}** is due for **${target.name}** (${target.batchId}).
Kindly arrange for the installment payment via UPI or Bank Transfer at your earliest convenience to ensure uninterrupted class resources.
UPI ID: \`edutrack@upi\` | Helpdesk: +91 98200 12345.
Thank you for your cooperation!
---`;
      }

      const pendingStudents = students
        .map((s) => ({ student: s, stats: getStudentStats(s.id) }))
        .filter((item) => item.stats.pendingDue > 0)
        .sort((a, b) => b.stats.pendingDue - a.stats.pendingDue);

      if (pendingStudents.length === 0) {
        return `✅ **All students have cleared their fees in full!** There are currently zero outstanding dues across all batches.`;
      }

      let resp = `Found **${pendingStudents.length} student(s)** with pending fee balances:\n\n`;
      pendingStudents.forEach(({ student, stats }, idx) => {
        resp += `${idx + 1}. **${student.name}** (${student.batchId})\n   • Pending Due: **${formatCurrency(stats.pendingDue)}** (Paid: ${formatCurrency(stats.paidFee)} / ${formatCurrency(stats.totalFee)})\n   • Guardian: ${student.guardianName} (${student.guardianPhone})\n`;
      });
      return resp;
    }

    // Query 2: Attendance below 75%
    if (q.includes('75') || (q.includes('attendance') && (q.includes('below') || q.includes('low') || q.includes('poor')))) {
      const lowAttStudents = students
        .map((s) => ({ student: s, stats: getStudentStats(s.id) }))
        .filter((item) => item.stats.attendancePercentage < 75);

      if (lowAttStudents.length === 0) {
        return `✅ **All students currently meet the minimum 75% attendance criteria!** No attendance warnings required.`;
      }

      let resp = `⚠️ **${lowAttStudents.length} student(s) currently below the 75% attendance threshold:**\n\n`;
      lowAttStudents.forEach(({ student, stats }, idx) => {
        resp += `${idx + 1}. **${student.name}** (${student.batchId})\n   • Current Attendance: **${stats.attendancePercentage}%** (${stats.attendedClasses}/${stats.totalClasses} classes attended)\n   • Guardian: ${student.guardianName} (${student.guardianPhone || student.phone})\n`;
      });

      resp += `\n*Would you like me to draft a WhatsApp alert for their guardians?*`;
      return resp;
    }

    // Query 3: Top performers / Rankers
    if (q.includes('top') || q.includes('rank') || q.includes('performer') || q.includes('best')) {
      const ranked = [...students]
        .map((s) => ({ student: s, stats: getStudentStats(s.id) }))
        .sort((a, b) => b.stats.averageScorePercentage - a.stats.averageScorePercentage)
        .slice(0, 3);

      let resp = `🏆 **Top Academic Performers Across Evaluations:**\n\n`;
      ranked.forEach(({ student, stats }, idx) => {
        const medals = ['🥇 1st', '🥈 2nd', '🥉 3rd'];
        resp += `${medals[idx]} **${student.name}** (${student.batchId})\n   • Assessment Average: **${stats.averageScorePercentage}%**\n   • Attendance: ${stats.attendancePercentage}%\n`;
      });
      return resp;
    }

    // Default general answer
    return `Here is a summary of EduTrack Institute status:
• Total Students: **${students.length}**
• Active Batches: **${batches.length}** (${batches.map((b) => b.name).join(', ')})
• Need fee reminders or attendance follow-ups? Feel free to ask:
  *"Which students have pending fees?"* or *"Show students with attendance below 75%"*.`;
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          context: prepareContext(),
        }),
      });

      const data = await response.json();

      let replyText = '';
      if (response.ok && data.reply) {
        replyText = data.reply;
      } else {
        // Fallback to local intelligent assistant engine
        replyText = generateLocalResponse(textToSend);
      }

      // Check if text has a drafted message for WhatsApp
      let draftWhatsApp: { phone: string; text: string } | undefined = undefined;
      const matchedStudent = students.find((s) => textToSend.toLowerCase().includes(s.name.toLowerCase()));
      if (textToSend.toLowerCase().includes('whatsapp') || textToSend.toLowerCase().includes('reminder')) {
        const targetStudent = matchedStudent || students[0];
        const cleanPhone = (targetStudent?.guardianPhone || targetStudent?.phone || '').replace(/[^0-9]/g, '');
        draftWhatsApp = {
          phone: cleanPhone,
          text: replyText.replace(/[*#]/g, ''),
        };
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        draftWhatsApp,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('AI call failed, using local smart assistant:', err);
      const fallbackReply = generateLocalResponse(textToSend);
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const PROMPT_CHIPS = [
    'Which students have pending fees?',
    'Show students with attendance below 75%',
    'Draft WhatsApp fee reminder for Amit Patel',
    'Who are the top performers in JEE batch?',
    'Draft attendance alert for absent students today',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight flex items-center">
                EduTrack AI Assistant
                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/20 text-white">
                  Gemini 3.8
                </span>
              </h3>
              <p className="text-xs text-indigo-100">
                Administrative intelligence, queries & parent WhatsApp drafter
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line prose prose-xs dark:prose-invert">
                  {msg.text}
                </div>

                {/* Footer bar with timestamp & action buttons */}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
                  <span>{msg.timestamp}</span>

                  {msg.sender === 'assistant' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="inline-flex items-center hover:text-indigo-600 transition-colors"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 mr-1 text-emerald-500" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" /> Copy
                          </>
                        )}
                      </button>

                      {msg.draftWhatsApp?.phone && (
                        <a
                          href={`https://wa.me/91${msg.draftWhatsApp.phone}?text=${encodeURIComponent(
                            msg.text.replace(/[*#]/g, '')
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-emerald-600 font-semibold hover:underline"
                        >
                          <Send className="w-3 h-3 mr-1" /> Open WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>Analyzing institute database with Gemini...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Prompt Suggestions */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-x-auto flex items-center space-x-2 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">
            Suggested:
          </span>
          {PROMPT_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 whitespace-nowrap text-[11px] transition-colors shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask anything about fees, students, attendance, or draft messages..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors flex items-center shrink-0"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Ask
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
