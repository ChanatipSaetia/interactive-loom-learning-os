import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { WordTerm } from '../../types';
import { ChevronLeft, ChevronRight, RotateCw, Volume2, Terminal, HelpCircle, MessageSquare, BookOpen } from 'lucide-react';
import { Button } from '../../components/motion/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/motion/tabs';



type BackTabId = 'guidelines' | 'dialogue';

export interface FlashcardDeckProps {
  title?: string;
  terms?: WordTerm[];
}

export default function FlashcardDeck({ title, terms = [] }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [activeBackTab, setActiveBackTab] = useState<BackTabId>('guidelines');

  // Reset back tabs when switching cards
  useEffect(() => {
    setActiveBackTab('guidelines');
  }, [currentIndex]);

  if (!terms || terms.length === 0) {
    return <div className="p-8 text-center text-muted-foreground font-mono text-sm">No vocabulary terms provided.</div>;
  }

  const currentTerm = terms[currentIndex];
  const simulatedChat = currentTerm.dialogue;

  const handleNext = () => {
    setDirection(1);
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % terms.length);
    }, 100);
  };

  const handlePrev = () => {
    setDirection(-1);
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + terms.length) % terms.length);
    }, 100);
  };

  const speakWord = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = currentTerm.word.split('(')[0].trim();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Auto-detect language code based on characters
      let lang = 'en-US';
      if (/[\u4e00-\u9fa5]/.test(textToSpeak)) {
        lang = 'zh-CN';
      } else if (/[\u0e00-\u0e7f]/.test(textToSpeak)) {
        lang = 'th-TH';
      } else if (/[\u3040-\u30ff\u31f0-\u31ff\u4e00-\u9faf]/.test(textToSpeak)) {
        lang = 'ja-JP';
      } else if (/[\uac00-\ud7af]/.test(textToSpeak)) {
        lang = 'ko-KR';
      }
      
      utterance.lang = lang;

      // Attempt to set a matching voice for the target language if voices are loaded
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const matchingVoice = voices.find(v => 
          v.lang.toLowerCase() === lang.toLowerCase() || 
          v.lang.toLowerCase().replace('_', '-').startsWith(lang.toLowerCase())
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getCategoryBadge = (category: string) => {
    const labels: Record<string, string> = {
      hierarchy: 'Hierarchy',
      layout: 'Space & Margins',
      typography: 'Typography',
      interaction: 'Tactile States',
      accessibility: 'Accessibility'
    };
    return (
      <span className="px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-widest bg-muted/30 text-muted-foreground border border-border/50 rounded-full">
        {labels[category] || category}
      </span>
    );
  };

  // Card slide transition variants
  const slideVariants: Variants = {
    initial: (dir: number) => ({
      x: dir > 0 ? 120 : -120,
      opacity: 0,
      scale: 0.96
    }),
    active: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { type: 'spring' as const, damping: 24, stiffness: 180 }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -120 : 120,
      opacity: 0,
      scale: 0.96,
      transition: { ease: 'easeInOut', duration: 0.18 }
    })
  };

  // tabs list config
  const tabsList: { id: BackTabId; label: string; icon: JSX.Element }[] = [
    { id: 'guidelines', label: 'Guidelines', icon: <BookOpen className="w-4 h-4" /> }
  ];
  if (simulatedChat) {
    tabsList.push({ id: 'dialogue', label: 'AI Dialogue', icon: <MessageSquare className="w-4 h-4" /> });
  }

  return (
    <div className="flex flex-col w-full h-full max-w-5xl mx-auto" id="flashcard-deck">
      
      {/* Top Deck Info with Standard Heading */}
      <div className="flashcards-header flex items-center w-full">
        <h3 className="flashcard-title flex-1 !m-0 !p-0" data-testid="flashcard-title">
          {title || "Aesthetics Glossary"}
        </h3>
        
        {/* Polished Item Counter */}
        <div className="flex-shrink-0 flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-muted/10 border border-border shadow-sm font-mono text-xs font-bold tracking-widest ml-4">
          <span className="text-primary text-sm">{String(currentIndex + 1).padStart(2, '0')}</span>
          <span className="text-muted-foreground/30">/</span>
          <span className="text-muted-foreground">{String(terms.length).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Main Flashcard Row layout with Side Navigation */}
      <div className="flex items-center justify-center w-full gap-4 md:gap-8 mt-4">
        
        {/* Desktop Left Arrow Button */}
        <Button
          id="prev-term-btn-desktop"
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          className="hidden md:flex flex-shrink-0 rounded-full w-16 h-16 border border-border/50 bg-muted/10 hover:bg-card hover:border-primary/50 hover:shadow-md transition-all text-muted-foreground hover:text-primary z-20"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>

        {/* Outer 3D Perspective Canvas */}
        <div className="relative w-full max-w-full sm:max-w-md md:max-w-3xl h-[480px] md:h-[540px] perspective-1000 flex-1">
          
          {/* Layered Deck Stack Background Cards */}
          <div className="absolute inset-0 bg-card border border-border translate-x-3 translate-y-3 rounded-lg opacity-30 -z-20 pointer-events-none transition-all duration-300"></div>
          <div className="absolute inset-0 bg-card border border-border translate-x-1.5 translate-y-1.5 rounded-lg opacity-60 -z-10 pointer-events-none transition-all duration-300"></div>

          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="active"
              exit="exit"
              className="absolute w-full h-full"
            >
              {/* 3D Rotator Box */}
              <motion.div
                animate={{
                  rotateY: isFlipped ? 180 : 0,
                  z: isFlipped ? 0 : 8
                }}
                transition={{
                  type: 'spring',
                  stiffness: isFlipped ? 90 : 220,
                  damping: isFlipped ? 18 : 24
                }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative w-full h-full shadow-md hover:shadow-xl transition-shadow duration-300 preserve-3d"
              >
                
                {/* CARD FRONT: Clean Editorial Grid Design */}
                <div
                  id="flashcard-front"
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                  className={`absolute inset-0 p-6 md:p-10 bg-card border border-border shadow-sm flex flex-col justify-between backface-hidden select-none transition-opacity duration-300 ${isFlipped ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'} rounded-lg`}
                >
                  {/* Visual Draft Crosshairs */}
                  <div className="absolute top-3 left-3 text-muted-foreground/30 font-bold text-[10px] pointer-events-none">+</div>
                  <div className="absolute top-3 right-3 text-muted-foreground/30 font-bold text-[10px] pointer-events-none">+</div>
                  <div className="absolute bottom-3 left-3 text-muted-foreground/30 font-bold text-[10px] pointer-events-none">+</div>
                  <div className="absolute bottom-3 right-3 text-muted-foreground/30 font-bold text-[10px] pointer-events-none">+</div>

                  {/* Top Toolbar */}
                  <div className="flex items-center justify-between border-b border-border pb-4 mb-6 h-9 z-10">
                    {getCategoryBadge(currentTerm.category)}
                    
                    <div className="flex items-center space-x-3">
                      <Button 
                        id="speak-word-btn"
                        variant="ghost"
                        size="icon"
                        onClick={speakWord}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="hidden md:flex text-muted-foreground hover:text-foreground relative z-30 touch-manipulation after:absolute after:inset-[-12px] after:content-['']"
                        title="Speak word"
                      >
                        <Volume2 className="w-5 h-5" />
                      </Button>

                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsFlipped(true); }}
                        className="text-xs text-muted-foreground hover:text-foreground uppercase tracking-widest font-mono cursor-pointer transition-colors"
                      >
                        Flip card ↺
                      </button>
                    </div>
                  </div>

                  {/* Large Word Display */}
                  <div className="my-auto text-left">
                    <h2 className="text-3xl md:text-5xl font-light tracking-tight text-foreground font-display leading-[1.15] mb-3 md:mb-4">
                      {currentTerm.word}
                    </h2>
                    
                    {currentTerm.pronunciation && (
                      <div className="text-sm font-mono text-muted-foreground font-medium tracking-wider uppercase mb-6">
                        Phonetic: <span className="text-foreground italic">/{currentTerm.pronunciation}/</span>
                      </div>
                    )}
                    
                    <div className="relative">
                      <div className="absolute top-0 left-0 w-[3px] h-full bg-primary/50"></div>
                      <p className="text-muted-foreground italic font-serif text-lg md:text-xl leading-relaxed pl-6 py-1">
                        “{currentTerm.shortDefinition}”
                      </p>
                    </div>
                  </div>

                  {/* Guidelines Footer Overlay (Interactive Flip Button) */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsFlipped(true); }}
                    className="bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all duration-200 w-full rounded-md py-4 px-5 border border-border flex items-center justify-center space-x-3 text-xs font-mono tracking-wide z-10 cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4 animate-spin-slow flex-shrink-0" />
                    <span>Flip card to inspect AI dialogue and alignment specs</span>
                  </button>
                </div>

                {/* CARD BACK: Dark Mode Interactive Alignment Blueprints */}
                <div 
                  className={`absolute inset-0 p-6 md:p-10 bg-card text-foreground rounded-lg border border-border shadow-md flex flex-col justify-between backface-hidden rotateY-180 overflow-y-auto scrollbar-thin select-none transition-opacity duration-300 ${isFlipped ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  {/* Visual Draft Crosshairs */}
                  <div className="absolute top-3 left-3 text-muted-foreground/30 font-bold text-[10px] pointer-events-none">+</div>
                  <div className="absolute top-3 right-3 text-muted-foreground/30 font-bold text-[10px] pointer-events-none">+</div>
                  <div className="absolute bottom-3 left-3 text-muted-foreground/30 font-bold text-[10px] pointer-events-none">+</div>
                  <div className="absolute bottom-3 right-3 text-muted-foreground/30 font-bold text-[10px] pointer-events-none">+</div>

                  <div className="flex-1 flex flex-col h-full">
                    
                    {/* Card Back Header */}
                    <div className="flex items-center justify-between border-b border-border pb-4 mb-6 h-9">
                      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-bold flex items-center">
                        <Terminal className="w-4 h-4 mr-2 text-primary" /> AI ALIGNMENT SPEC
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                        className="text-xs text-muted-foreground hover:text-foreground uppercase tracking-widest font-mono cursor-pointer transition-colors"
                      >
                        Flip card ↺
                      </button>
                    </div>

                    {/* Interactive Tab bar with sliding active layout motion pill */}
                    <div onClick={(e) => e.stopPropagation()} className="mb-4 flex-1 flex flex-col">
                      <Tabs
                        value={activeBackTab}
                        onValueChange={(v) => setActiveBackTab(v as BackTabId)}
                        disableLayoutAnimation={true}
                        className="w-full flex-1 flex flex-col"
                        id="back-card-tabs"
                      >
                      <TabsList className="mb-6">
                        {tabsList.map((tab) => (
                          <TabsTrigger key={tab.id} value={tab.id} className="text-sm">
                            <span className="flex items-center gap-2">
                              {tab.icon}
                              {/* Responsiveness */}
                              <span className="hidden md:inline">{tab.label}</span>
                              <span className="inline md:hidden">{tab.label.split(' ')[0]}</span>
                            </span>
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {/* Tab Body Contents */}
                      <div className="flex-1 overflow-y-auto scrollbar-thin py-2" onClick={(e) => e.stopPropagation()}>
                        <TabsContent value="guidelines" className="space-y-6 text-left font-sans mt-0">
                          <div>
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-2">Standard Concept</span>
                            <h4 className="text-3xl font-light tracking-tight text-foreground font-display">
                              {currentTerm.word}
                            </h4>
                          </div>

                          <p className="text-base text-muted-foreground leading-relaxed font-normal">
                            {currentTerm.detailedDefinition}
                          </p>

                          <div className="border border-border/80 bg-muted/10 p-5 rounded-md relative mt-6">
                            <span className="text-xs font-mono text-primary uppercase tracking-widest font-bold block mb-2">
                              Why Alignment Matters:
                            </span>
                            <p className="text-base text-foreground/90 leading-relaxed">
                              {currentTerm.whyItMatters}
                            </p>
                          </div>
                        </TabsContent>

                        {simulatedChat && (
                          <TabsContent value="dialogue" className="space-y-6 text-left font-sans mt-0">
                            {/* Dialogue Simulation (User + AI Alignment) */}
                            <div className="border border-border bg-muted/10 p-5 rounded-md space-y-6 font-mono text-sm">
                              <div className="flex items-center space-x-3 border-b border-border pb-3 mb-2">
                                <MessageSquare className="w-5 h-5 text-primary" />
                                <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Interactive Dialogue Simulation</span>
                              </div>
                              
                              {/* User Prompts */}
                              <div className="space-y-2">
                                <span className="text-xs text-primary uppercase tracking-widest font-bold block">● User (General Concept directive):</span>
                                <div className="pl-4 border-l-2 border-primary/40 text-foreground leading-relaxed">
                                  "{simulatedChat.user}"
                                </div>
                              </div>

                              {/* AI Thinks */}
                              <div className="space-y-2">
                                <span className="text-xs text-accent-foreground uppercase tracking-widest font-bold block">● AI Reason (Evaluates parameters):</span>
                                <div className="pl-4 border-l-2 border-border text-muted-foreground italic leading-relaxed">
                                  {simulatedChat.aiThoughts}
                                </div>
                              </div>

                              {/* AI Asks Back to Align */}
                              <div className="bg-primary/5 border border-primary/20 p-4 rounded-md mt-4">
                                <span className="text-xs text-primary uppercase tracking-widest font-bold flex items-center mb-2">
                                  <HelpCircle className="w-4 h-4 mr-2 text-primary" />
                                  AI Alignment Inquiry (Asks back):
                                </span>
                                <p className="text-foreground leading-relaxed font-sans text-base font-medium">
                                  "{simulatedChat.aiQuestion}"
                                </p>
                              </div>
                            </div>
                          </TabsContent>
                        )}
                      </div>
                    </Tabs>
                  </div>
                  </div>
                </div>

              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop Right Arrow Button */}
        <Button
          id="next-term-btn-desktop"
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="hidden md:flex flex-shrink-0 rounded-full w-16 h-16 border border-border/50 bg-muted/10 hover:bg-card hover:border-primary/50 hover:shadow-md transition-all text-muted-foreground hover:text-primary z-20"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      </div>

      {/* Mobile Navigation Row (Hidden on Desktop) */}
      <div className="flex md:hidden items-center justify-center w-full gap-6 mt-6">
        <Button
          id="prev-term-btn-mobile"
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          className="flex-shrink-0 rounded-full w-14 h-14 border-border/50 bg-muted/10 hover:bg-card hover:border-primary/50 shadow-sm transition-all text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button
          id="speak-term-btn-mobile"
          variant="outline"
          size="icon"
          onClick={speakWord}
          className="flex-shrink-0 rounded-full w-14 h-14 border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary shadow-sm transition-all"
          title="Speak word"
        >
          <Volume2 className="w-6 h-6" />
        </Button>
        <Button
          id="next-term-btn-mobile"
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="flex-shrink-0 rounded-full w-14 h-14 border-border/50 bg-muted/10 hover:bg-card hover:border-primary/50 shadow-sm transition-all text-muted-foreground hover:text-primary"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
