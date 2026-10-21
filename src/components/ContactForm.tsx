import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  MessageCircle, 
  ExternalLink, 
  Loader2,
  ShieldCheck,
  Settings2,
  Copy,
  Check
} from 'lucide-react';

interface ContactFormProps {
  onClose?: () => void;
}

type ForwardingProvider = 'formsubmit' | 'formspree';

export const ContactForm: React.FC<ContactFormProps> = ({ onClose }) => {
  // Target recipient email
  const TARGET_EMAIL = 'huzaifaahmedary@gmail.com';
  
  // WhatsApp Number configured by the user
  const DEFAULT_WHATSAPP_NUMBER = '923702301812';
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP_NUMBER);
  const [showNumberEdit, setShowNumberEdit] = useState(false);

  // Email Forwarding Provider Configuration
  const [provider, setProvider] = useState<ForwardingProvider>('formsubmit');
  const [formspreeId, setFormspreeId] = useState('');
  const [showProviderSettings, setShowProviderSettings] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Feedback regarding SlugGenerator',
    message: '',
    // Security: Honeypot field for bot trapping
    _gotcha: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // WhatsApp pre-filled options
  const [selectedTopic, setSelectedTopic] = useState<string>('General Inquiry');
  const [copiedLink, setCopiedLink] = useState(false);

  // Check rate limit cooldown from sessionStorage on mount
  useEffect(() => {
    const lastSub = sessionStorage.getItem('last_contact_submission');
    if (lastSub) {
      const elapsed = Date.now() - parseInt(lastSub, 10);
      const cooldownMs = 30000; // 30 seconds cooldown
      if (elapsed < cooldownMs) {
        setCooldownRemaining(Math.ceil((cooldownMs - elapsed) / 1000));
      }
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Secure client-side email format validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  };

  const triggerMailtoFallback = () => {
    const subject = encodeURIComponent(`[SlugGenerator] ${formData.subject}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );
    window.location.href = `mailto:${TARGET_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Anti-Bot Honeypot trap check:
    if (formData._gotcha) {
      console.warn('Bot detected via honeypot.');
      setStatus('success');
      return;
    }

    // 2. Client-side Rate Limiting Check:
    if (cooldownRemaining > 0) {
      setStatus('error');
      setErrorMessage(`Please wait ${cooldownRemaining}s before sending another message.`);
      return;
    }

    // 3. Sanitized field validation:
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedMessage = formData.message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setStatus('error');
      setErrorMessage('Please complete all required fields.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setStatus('error');
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    // Determine target endpoint
    let endpoint = '';
    let payload: Record<string, string> = {};

    if (provider === 'formspree') {
      const cleanId = formspreeId.trim() || 'my-formspree-id';
      endpoint = `https://formspree.io/f/${cleanId}`;
      payload = {
        name: trimmedName,
        email: trimmedEmail,
        _subject: `[SlugGenerator] ${formData.subject.trim() || 'New Contact Message'}`,
        message: trimmedMessage,
        _gotcha: '',
      };
    } else {
      // FormSubmit
      endpoint = `https://formsubmit.co/ajax/${TARGET_EMAIL}`;
      payload = {
        name: trimmedName,
        email: trimmedEmail,
        _subject: `[SlugGenerator] ${formData.subject.trim() || 'New Contact Message'}`,
        message: trimmedMessage,
        _template: 'table',
        _gotcha: '',
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus('success');
        sessionStorage.setItem('last_contact_submission', Date.now().toString());
        setCooldownRemaining(30);
      } else {
        const errorData = await response.json().catch(() => null);
        if (provider === 'formspree' && !formspreeId.trim()) {
          triggerMailtoFallback();
          setStatus('success');
        } else {
          setErrorMessage(errorData?.error || 'Submission failed. Opening email client fallback...');
          setTimeout(() => triggerMailtoFallback(), 1200);
          setStatus('success');
        }
      }
    } catch {
      triggerMailtoFallback();
      setStatus('success');
    }
  };

  // WhatsApp Pre-filled URL Generator
  const cleanNumber = whatsappNumber.replace(/[^\d]/g, '');
  
  // Construct dynamic message based on user input or selected topic
  const getDynamicWhatsappMessage = () => {
    const sender = formData.name.trim() ? ` from ${formData.name.trim()}` : '';
    
    if (formData.message.trim()) {
      return `Hi Huzaifa, I am contacting you${sender} regarding SlugGenerator:\n\n${formData.message.trim()}`;
    }

    if (selectedTopic === 'Feature Request') {
      return `Hi Huzaifa, I have a feature request or SEO slug suggestion for SlugGenerator${sender}.`;
    } else if (selectedTopic === 'Report a Bug') {
      return `Hi Huzaifa, I noticed an issue/bug on SlugGenerator and would like to report it${sender}.`;
    } else if (selectedTopic === 'Shopify / E-Commerce') {
      return `Hi Huzaifa, I need assistance with Shopify URL handle generation on SlugGenerator${sender}.`;
    } else {
      return `Hi Huzaifa, I am contacting you${sender} through the SlugGenerator tool.`;
    }
  };

  const whatsappMessage = getDynamicWhatsappMessage();
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopyWhatsappLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(whatsappUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = whatsappUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-neutral-950 dark:text-neutral-100">Get in Touch</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Direct inbox delivery to <span className="font-mono text-neutral-800 dark:text-neutral-200 font-semibold">{TARGET_EMAIL}</span>
            </p>
          </div>
        </div>

        {/* Provider Settings Toggle */}
        <button
          type="button"
          onClick={() => setShowProviderSettings(!showProviderSettings)}
          className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Endpoint & Security Settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Provider & Security Configuration Panel */}
      {showProviderSettings && (
        <div className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Forwarding Service Endpoint</span>
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">100% Serverless / Client-Side</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-700 dark:text-neutral-300">
              <input
                type="radio"
                name="forwardingProvider"
                checked={provider === 'formsubmit'}
                onChange={() => setProvider('formsubmit')}
                className="accent-neutral-900 dark:accent-white cursor-pointer"
              />
              <span>FormSubmit (Zero-config direct to Gmail)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-neutral-700 dark:text-neutral-300">
              <input
                type="radio"
                name="forwardingProvider"
                checked={provider === 'formspree'}
                onChange={() => setProvider('formspree')}
                className="accent-neutral-900 dark:accent-white cursor-pointer"
              />
              <span>Formspree</span>
            </label>
          </div>

          {provider === 'formspree' && (
            <div className="space-y-1.5 pt-1">
              <label htmlFor="formspree-id-input" className="block text-neutral-600 dark:text-neutral-300">
                Formspree Form ID (from formspree.io/f/<strong>your_id</strong>):
              </label>
              <input
                id="formspree-id-input"
                type="text"
                value={formspreeId}
                onChange={(e) => setFormspreeId(e.target.value)}
                placeholder="e.g. mqkjjwbe"
                className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
              />
            </div>
          )}

          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-neutral-200/60 dark:border-neutral-800 pt-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Spam bot protection enabled: Hidden honeypot field + 30s submission cooldown + email regex sanitization.</span>
          </div>
        </div>
      )}

      {/* WHATSAPP CONTACT CARD & DYNAMIC BUTTON */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/90 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
              <MessageCircle className="w-5 h-5 fill-white" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-neutral-950 dark:text-white">Chat on WhatsApp</h4>
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                  Instant Reply
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                Connect directly on WhatsApp: <strong className="text-neutral-900 dark:text-white font-mono">+92 370 2301812</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Message Topic Selector */}
        <div className="mt-3.5 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60">
          <span className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            Select a topic or type in the form below to customize your message:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {['General Inquiry', 'Feature Request', 'Report a Bug', 'Shopify / E-Commerce'].map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                  selectedTopic === topic
                    ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-xs'
                    : 'bg-white/80 dark:bg-neutral-900 hover:bg-white dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-emerald-200/60 dark:border-emerald-800/60'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Message Preview */}
          <div className="mt-3 p-2.5 bg-white/90 dark:bg-neutral-950/80 rounded-lg border border-emerald-200/70 dark:border-emerald-800/60 text-xs text-neutral-700 dark:text-neutral-300">
            <span className="text-neutral-400 dark:text-neutral-500 block text-[11px] mb-1">Pre-filled Message Preview:</span>
            <p className="font-sans italic text-neutral-800 dark:text-neutral-200 line-clamp-2">
              "{whatsappMessage}"
            </p>
          </div>

          {/* Action Buttons: Open WhatsApp & Copy Link */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Launch WhatsApp Chat</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={handleCopyWhatsappLink}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-neutral-900 hover:bg-emerald-50/80 dark:hover:bg-neutral-800 border border-emerald-200 dark:border-emerald-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
              title="Copy the direct wa.me link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                  <span>Copy wa.me Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowNumberEdit(!showNumberEdit)}
              className="text-[11px] text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 underline underline-offset-2 ml-auto cursor-pointer"
            >
              {showNumberEdit ? 'Close Editor' : 'Edit Number'}
            </button>
          </div>

          {showNumberEdit && (
            <div className="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/60">
              <label htmlFor="whatsapp-number-input" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Custom WhatsApp Phone Number:
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="whatsapp-number-input"
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. 923702301812"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Email Form Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
        <span className="bg-white dark:bg-neutral-900 px-3 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold shrink-0">
          Or send via Email Form
        </span>
      </div>

      {/* Contact Email Form */}
      {status === 'success' ? (
        <div className="p-6 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">Message Dispatched!</h4>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
            Your message has been submitted. Check your inbox at <strong>{TARGET_EMAIL}</strong>.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStatus('idle');
                setFormData({
                  name: '',
                  email: '',
                  subject: 'Feedback regarding SlugGenerator',
                  message: '',
                  _gotcha: '',
                });
              }}
              className="px-4 py-2 text-xs font-semibold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Send Another Message
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 rounded-lg transition-colors cursor-pointer"
              >
                Close Window
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot field (hidden from real users, filled by bots) */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="_gotcha">Do not fill this field</label>
            <input
              id="_gotcha"
              type="text"
              name="_gotcha"
              value={formData._gotcha}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="contact-name" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Your Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                maxLength={100}
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Your Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                maxLength={120}
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-subject" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Subject
            </label>
            <input
              id="contact-subject"
              name="subject"
              type="text"
              maxLength={150}
              value={formData.subject}
              onChange={handleChange}
              placeholder="Inquiry / Feature Request"
              className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
            />
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={3}
              maxLength={2000}
              value={formData.message}
              onChange={handleChange}
              placeholder="Write your message, feedback, or custom slug requirement..."
              className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white resize-y transition-colors"
            />
          </div>

          {status === 'error' && errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={triggerMailtoFallback}
              className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline underline-offset-2 cursor-pointer"
              title="Compose message directly in your default email client"
            >
              Open in default email client
            </button>

            <button
              type="submit"
              disabled={status === 'submitting' || cooldownRemaining > 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 disabled:bg-neutral-400 dark:disabled:bg-neutral-700 text-white dark:text-neutral-950 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : cooldownRemaining > 0 ? (
                <>
                  <span>Wait {cooldownRemaining}s</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
