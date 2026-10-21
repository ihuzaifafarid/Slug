import React, { useRef, useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BestPractices } from './components/BestPractices';
import { ExamplesSection } from './components/ExamplesSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { InfoModal, ModalType } from './components/InfoModal';

export default function App() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedExample, setSelectedExample] = useState<string | undefined>(undefined);

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
    <div className="min-h-screen flex flex-col bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Top Navigation */}
      <Header onFocusGenerator={handleFocusGenerator} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section with main tool directly below description */}
        <Hero inputRef={inputRef} externalInput={selectedExample} />

        {/* What is a slug & Best Practices */}
        <BestPractices />

        {/* Real-World Examples */}
        <ExamplesSection onSelectExample={handleSelectExample} />

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
    </div>
  );
}
