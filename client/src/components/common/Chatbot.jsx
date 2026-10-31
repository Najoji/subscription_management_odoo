import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  ExternalLink, 
  RotateCcw, 
  HelpCircle,
  Zap,
  FileText,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Tag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

// Pre-defined knowledge base topics & smart responses
const KNOWLEDGE_BASE = [
  {
    keywords: ['billing', 'recurring', 'cycle', 'automate', 'run billing', 'renew', 'how does billing work'],
    title: 'Automated Recurring Billing Engine',
    answer: `Brightloop's recurring engine automates periodic invoicing across **weekly, monthly, quarterly, and annual** cadences:\n\n1. **Due Detection**: The engine scans active subscriptions where \`next_billing_date <= today\`.\n2. **Proration & Math**: It calculates exact line totals including variants, applies discount codes, and computes taxes (e.g., GST 18%).\n3. **Duplicate Protection**: Strict database constraint \`UNIQUE(subscription_id, period_start)\` guarantees zero duplicate invoices.\n4. **Status Advance**: The subscription advances to the next period automatically.`,
    actions: [
      { label: 'View Invoices', path: '/admin/invoices' },
      { label: 'Check Subscriptions', path: '/admin/subscriptions' },
    ],
  },
  {
    keywords: ['pdf', 'invoice pdf', 'download invoice', 'download', 'print', 'tax invoice', 'receipt'],
    title: 'Professional Invoice Generator & PDF Engine',
    answer: `You can preview and download official, branded A4 Tax Invoices:\n\n• **Branded Header**: Brightloop Technologies Pvt. Ltd. with GSTIN (\`29AABCB1234F1Z5\`).\n• **Bank Wire Instructions**: HDFC Bank NEFT/RTGS details embedded.\n• **Status Stamp**: Diagonal visual indicators (\`PAID\`, \`OVERDUE\`, \`CONFIRMED\`).\n• **Direct Stream**: Generated on-the-fly via PDFKit with zero server disk clutter.`,
    actions: [
      { label: 'Go to Invoices', path: '/admin/invoices' },
    ],
  },
  {
    keywords: ['quote', 'quotation', 'convert', 'estimate', 'proposal', 'template'],
    title: 'Quotation-to-Subscription Workflow',
    answer: `Here is the seamless 3-step sales journey:\n\n1. **Create Draft**: Staff builds a quotation with products, variants, and optional discounts.\n2. **Send & Negotiate**: Status moves from \`Draft\` ➔ \`Sent\`. Client approves ➔ \`Accepted\`.\n3. **1-Click Convert**: Clicking **"Convert to Subscription"** provisions an active subscription and locks in the agreed snapshot pricing.`,
    actions: [
      { label: 'View Quotations', path: '/admin/quotations' },
    ],
  },
  {
    keywords: ['discount', 'promo', 'coupon', 'code', 'offer', 'voucher'],
    title: 'Active Promotional Codes',
    answer: `Here are the active coupon codes currently seeded in the system:\n\n• \`WELCOME10\` — 10% Off for new client onboarding (Min: ₹500)\n• \`HACKATHON20\` — 20% Special hackathon evaluation discount (Min: ₹1,000)\n• \`FLAT500\` — Flat ₹500 deduction on team plans (Min: ₹2,500)\n• \`ENTERPRISE15\` — 15% VIP enterprise contract credit (Min: ₹5,000)\n• \`STARTUP1000\` — Flat ₹1,000 startup grant voucher (Min: ₹4,000)`,
    actions: [
      { label: 'Manage Discounts', path: '/admin/discounts' },
    ],
  },
  {
    keywords: ['product', 'variant', 'plan', 'catalog', 'pricing', 'tiers'],
    title: 'Products & Subscription Plans',
    answer: `We offer 8 modular SaaS products with dynamic add-on variants:\n\n• **Core Plans**: Starter SaaS (₹999/mo), Professional (₹2,499/mo), Enterprise (₹6,999/mo).\n• **Infrastructure**: Cloud Storage (100GB to 2TB NVMe), Dedicated IP, HA Clusters.\n• **Add-ons**: Analytics Suite (₹1,299/mo), 24/7 Support (₹1,999/mo), API Access (₹1,499/mo), SOC-2 Security (₹2,999/mo).\n• **Cadences**: Weekly Sprint, Monthly Standard, Quarterly Growth, Annual Value, Biennial.`,
    actions: [
      { label: 'Explore Products', path: '/admin/products' },
      { label: 'View Plans', path: '/admin/plans' },
    ],
  },
  {
    keywords: ['mrr', 'arr', 'metric', 'dashboard', 'analytics', 'revenue', 'overdue'],
    title: 'Executive Financial KPIs',
    answer: `The executive dashboard displays real-time live metrics calculated from Supabase PostgreSQL:\n\n• **MRR (Monthly Recurring Revenue)**: Normalized active recurring subscriptions.\n• **ARR (Annual Recurring Revenue)**: Projected 12-month contract value.\n• **Revenue Collected**: Live sum of verified payments (Cash, UPI, Card, Bank Transfer).\n• **Overdue Receivables**: Balance on confirmed invoices where \`due_date < today\`.`,
    actions: [
      { label: 'Open Dashboard', path: '/admin/dashboard' },
    ],
  },
  {
    keywords: ['role', 'permission', 'admin', 'staff', 'customer', 'portal', 'security'],
    title: 'Role-Based Access Control (RBAC)',
    answer: `Brightloop enforces strict 3-tier authorization:\n\n• 👑 **Admin**: Full master control (User management, system config, taxes, plans, financials).\n• 💼 **Staff**: Sales & operations (Create quotes, manage subscriptions, record payments).\n• 👤 **Customer**: Self-service portal (View only their company's subscriptions, invoices, and download tax receipts).`,
    actions: [
      { label: 'User Directory', path: '/admin/users' },
    ],
  },
  {
    keywords: ['hello', 'hi', 'hey', 'help', 'who are you', 'loopie'],
    title: 'Welcome to Brightloop Copilot!',
    answer: `Hello! I'm **Loopie**, your interactive AI assistant. I can guide you through the entire Brightloop platform:\n\n• Explaining the **6-step recurring billing engine**\n• Demonstrating how to **download official tax PDFs**\n• Showing **quotation-to-subscription conversions**\n• Exploring **products, plans, and active discounts**\n\nWhat would you like to explore?`,
  },
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();

  // Initialize greeting on mount or role change
  useEffect(() => {
    const userName = profile?.fullName || user?.email?.split('@')[0] || 'there';
    let welcomeText = `👋 Hi **${userName}**! Welcome to **Brightloop**.\n\nI'm your AI Copilot. Ask me anything about our recurring billing engine, quotation conversion, or PDF invoices!`;

    if (role === 'customer') {
      welcomeText = `👋 Welcome **${userName}** to your customer billing portal!\n\nI can help you view your active subscriptions, check upcoming renewal dates, or download your official tax invoice receipts.`;
    } else if (role === 'staff') {
      welcomeText = `👋 Hi **${userName}**! Ready for operations?\n\nI can guide you through drafting quotations, converting approved proposals into active subscriptions, or recording payments.`;
    }

    setMessages([
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          '⚡ How does billing work?',
          '📄 Download PDF Invoice',
          '🔄 Quote to Subscription',
          '🏷️ Active discount codes',
        ],
      },
    ]);
  }, [profile, role, user]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Smart natural language matching function
  const findAnswer = (query) => {
    const cleanQuery = query.toLowerCase().trim();

    // Direct match score
    let bestMatch = null;
    let highestScore = 0;

    for (const item of KNOWLEDGE_BASE) {
      let score = 0;
      for (const kw of item.keywords) {
        if (cleanQuery.includes(kw)) {
          score += kw.length; // weight longer keyword matches higher
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && highestScore > 0) {
      return {
        text: bestMatch.answer,
        actions: bestMatch.actions || [],
      };
    }

    // Fallback response with helpful guide
    return {
      text: `I'm not completely certain about "${query}", but here are the key areas I can guide you through:\n\n• **Recurring Billing Engine** (automations & duplicate protection)\n• **PDF Invoice Generator** (instant branded tax downloads)\n• **Quotation Conversion** (drafting & 1-click subscription creation)\n• **Active Discounts & Plans** (promos & catalog tiers)\n\nTry clicking one of the quick topics below!`,
      suggestions: [
        '⚡ How does billing work?',
        '📄 Download PDF Invoice',
        '🏷️ Active discount codes',
        '📊 Explain MRR / ARR',
      ],
    };
  };

  const handleSend = (textToSend) => {
    const text = textToSend || inputValue;
    if (!text || !text.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate smart thinking delay
    setTimeout(() => {
      const match = findAnswer(text);
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: match.text,
        actions: match.actions || [],
        suggestions: match.suggestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, botResponse]);
    }, 450);
  };

  const handleActionClick = (path) => {
    // If customer role, map admin paths to customer portal
    let targetPath = path;
    if (role === 'customer') {
      if (path.includes('invoices')) targetPath = '/portal/invoices';
      else if (path.includes('subscriptions')) targetPath = '/portal/subscriptions';
      else targetPath = '/portal/dashboard';
    } else if (role === 'staff') {
      if (path.includes('dashboard')) targetPath = '/staff/dashboard';
    }
    navigate(targetPath);
  };

  const resetChat = () => {
    const userName = profile?.fullName || 'there';
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: `Chat refreshed! What can I help you explore today, **${userName}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          '⚡ How does billing work?',
          '📄 Download PDF Invoice',
          '🔄 Quote to Subscription',
          '🏷️ Active discount codes',
        ],
      },
    ]);
  };

  return (
    <>
      {/* 1. Floating Toggle Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-amber-500/30 text-amber-300 text-xs shadow-lg backdrop-blur-md animate-fade-in pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-medium">Brightloop Copilot</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Brightloop Assistant"
          className="relative group p-4 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-zinc-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          {isOpen ? (
            <X className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <>
              <Sparkles className="w-6 h-6 stroke-[2.2] animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* 2. Chat Window Popup */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] h-[560px] max-h-[80vh] bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-fade-in"
          style={{ animationDuration: '200ms' }}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800/80 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-md shadow-amber-500/20">
                <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-amber-400">
                  <Bot className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-zinc-100">Brightloop Copilot</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    AI Online
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">Smart interactive onboarding guide</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                title="Restart conversation"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close assistant"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-zinc-950 font-medium rounded-tr-sm shadow-md shadow-orange-500/10'
                        : 'bg-zinc-900/90 border border-white/10 text-zinc-200 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {/* Render bold text simply */}
                    {msg.text.split('\n').map((line, i) => (
                      <p key={i} className={line.startsWith('•') ? 'ml-2 my-1' : 'my-0.5'}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Deep-link Action Buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.actions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          onClick={() => handleActionClick(act.path)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-[11px] transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span>{act.label}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Suggestions Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 block">
                        Quick questions:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSend(sug)}
                            className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-amber-500/40 text-zinc-300 hover:text-amber-300 text-[11px] transition-all"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-zinc-500 block px-1">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 text-zinc-400 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-zinc-900 border border-white/10 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-zinc-950/90 border-t border-white/10 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 bg-zinc-900/90 border border-white/10 focus-within:border-amber-500/50 rounded-xl px-3 py-1.5 transition-colors"
            >
              <input
                type="text"
                placeholder="Ask about billing, quotes, invoices..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1.5 px-1">
              <span>Powered by Brightloop Intelligence</span>
              <span>Press Enter ↵</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
