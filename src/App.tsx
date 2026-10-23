import React, { useRef, useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BestPractices } from './components/BestPractices';
import { ExamplesSection } from './components/ExamplesSection';
import { PricingSection } from './components/PricingSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { InfoModal, ModalType } from './components/InfoModal';
import { SeoChatbot } from './components/SeoChatbot';
import { AuthModal } from './components/AuthModal';
import { UserDashboardModal } from './components/UserDashboardModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { PaymentSetupModal } from './components/PaymentSetupModal';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedExample, setSelectedExample] = useState<string | undefined>(undefined);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const { paymentConfigModalState, closePaymentConfigModal, refreshUser } = useAuth();
  const { showToast } = useToast();

  // Handle Lemon Squeezy checkout redirect return URLs
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment') || params.get('checkout');

    if (paymentStatus === 'success') {
      refreshUser();
      showToast({
        title: 'Checkout Submitted',
        snippet: 'Lemon Squeezy is verifying your payment. Your subscription will activate automatically once webhook confirmation is received.',
        type: 'info',
        duration: 6000,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled' || paymentStatus === 'cancel') {
      showToast({
        title: 'Checkout Cancelled',
        snippet: 'No payment was processed. Your account remains on the Free plan.',
        type: 'info',
        duration: 4000,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // First-party Analytics Tracker
  useEffect(() => {
    const startTime = Date.now();
    let visitorId = localStorage.getItem('slugify_visitor_id');
    if (!visitorId) {
      visitorId = 'vis_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('slugify_visitor_id', visitorId);
    }

    // Log Pageview
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'pageview',
        path: window.location.pathname,
        visitorId,
      }),
    }).catch(() => {});

    // Log duration on page unload / leave
    const handleUnload = () => {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      if (durationSeconds > 1 && navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/analytics/track',
          JSON.stringify({
            eventType: 'pageview',
            path: window.location.pathname,
            visitorId,
            durationSeconds,
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const handleFocusGenerator = () => {
    const generatorElement = document.getElementById('generator');
    if (generatorElement) {
      generatorElement.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => {
      inputRef.current?.focus();
    }, 250);
  };

  const handleSelectExample = (title: string) => {
    setSelectedExample(title);
    handleFocusGenerator();
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 dark:selection:bg-white selection:text-white dark:selection:text-neutral-950 transition-colors">
      {/* Top Navigation */}
      <Header 
        onFocusGenerator={handleFocusGenerator} 
        onOpenContact={() => setActiveModal('contact')}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section with main tool directly below description */}
        <Hero inputRef={inputRef} externalInput={selectedExample} />

        {/* What is a slug & Best Practices */}
        <BestPractices />

        {/* Real-World Examples */}
        <ExamplesSection onSelectExample={handleSelectExample} />

        {/* SaaS Subscription Plans & Monetization */}
        <PricingSection />

        {/* Frequently Asked Questions */}
        <FaqSection />
      </main>

      {/* Minimal Footer */}
      <Footer 
        onOpenModal={(type) => setActiveModal(type)} 
        onScrollToTop={handleScrollToTop} 
      />

      {/* Information Modals (About, Privacy, Contact) */}
      <InfoModal 
        type={activeModal} 
        onClose={() => setActiveModal(null)} 
      />

      {/* Gemini SEO Assistant Chatbot */}
      <SeoChatbot
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        currentTitle={selectedExample}
      />

      {/* SaaS Auth Modal (Login / Register / Reset) */}
      <AuthModal />

      {/* User Dashboard Modal (Quotas, History, API Keys, Billing) */}
      <UserDashboardModal />

      {/* Admin Dashboard Modal (Visitor Analytics, MRR, Users, Logs) */}
      <AdminDashboardModal />

      {/* Lemon Squeezy Payment Gateway Configuration Modal */}
      <PaymentSetupModal
        isOpen={paymentConfigModalState.isOpen}
        onClose={closePaymentConfigModal}
        plan={paymentConfigModalState.plan}
        missingKeys={paymentConfigModalState.missingKeys}
        errorMessage={paymentConfigModalState.errorMessage}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
