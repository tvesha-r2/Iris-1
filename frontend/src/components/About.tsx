import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const pipelineStages = [
  {
    step: '01',
    title: 'Thumbnail Input',
    description: 'Upload any thumbnail or URL. Our system ingests and prepares the image for multi-layer analysis.',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    step: '02',
    title: 'AI Analysis',
    description: 'Deep neural networks scan for faces, text regions, objects, contrast gradients, and color salience.',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    step: '03',
    title: 'Attention Map',
    description: 'A probabilistic gaze-density heatmap is generated, showing where 94% of viewers will fixate first.',
    icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
  },
  {
    step: '04',
    title: 'Insight Engine',
    description: 'Scores are benchmarked against 2M+ high-CTR thumbnails to surface actionable improvement suggestions.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    step: '05',
    title: 'Better Thumbnail',
    description: 'You receive a revised composition guide and ranked variants — ready to publish with confidence.',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

export const About: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate Left Column
      if (leftColRef.current) {
        gsap.fromTo(
          leftColRef.current.children,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 75%',
            }
          }
        );
      }

      // Animate Right Column Graphics
      if (rightColRef.current) {
        gsap.fromTo(
          rightColRef.current.children,
          { opacity: 0, scale: 0.8, x: 50 },
          {
            opacity: 1,
            scale: 1,
            x: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: 'back.out(1.2)',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
            }
          }
        );
      }
    }, sectionRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about"
      className="about relative py-24 sm:py-32 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-[#E6E4DE]"
    >
      {/* Editorial Header */}
      <div className="max-w-4xl mb-20 lg:mb-24">
        <div
          data-animate="fade"
          className="about-kicker inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-[#7C3AED] mb-3"
        >
          <span>The Methodology</span>
          <span aria-hidden="true" className="text-[#D5D3CC]">·</span>
          <span>Scientific Grounding</span>
        </div>
        <h2
          data-animate="reveal"
          className="about-title text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#121214] leading-[1.08] text-balance"
        >
          Built for creators who want to understand attention, not guess it.
        </h2>
        <p
          data-animate="fade"
          className="about-description mt-6 text-lg sm:text-xl text-[#52525B] leading-relaxed max-w-3xl font-normal"
        >
          Iris replaces guesswork with neuro-computational vision science.
          By combining biological gaze models, cognitive text parsing, and creator performance correlations,
          we help you engineer thumbnail compositions that demand visual priority.
        </p>
      </div>

      {/* Large Visual Pipeline: THUMBNAIL → AI ANALYSIS → ATTENTION MAP → INSIGHTS → BETTER THUMBNAIL */}
      <div className="mb-24">
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#E6E4DE]">
          <span className="text-xs uppercase tracking-widest font-mono font-bold text-[#71717A]">
            Attention Intelligence Pipeline
          </span>
          <span className="text-xs font-mono text-[#7C3AED] font-semibold">
            5 Sequential Stages
          </span>
        </div>

        {/* Pipeline Container (Responsive: horizontal on desktop, vertical on mobile) */}
        <div className="about-flow grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-2 items-stretch">
          {pipelineStages.map((stage, idx) => (
            <React.Fragment key={stage.step}>
              {/* Individual Stage Component */}
              <div
                data-animate="stagger"
                className="about-flow-item p-6 rounded-2xl bg-white border border-[#E6E4DE] shadow-xs flex flex-col justify-between hover:border-[#8B5CF6]/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-[#7C3AED] font-bold">
                      {stage.step}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#FAF9F5] border border-[#E6E4DE] flex items-center justify-center text-[#121214]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d={stage.icon} />
                      </svg>
                    </div>
                  </div>
                  <h3 className="about-flow-title text-lg font-bold text-[#121214]">
                    {stage.title}
                  </h3>
                  <p className="about-flow-description text-xs text-[#52525B] leading-relaxed mt-2">
                    {stage.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-[#F0EEE6] flex items-center justify-between text-[11px] font-mono text-[#71717A]">
                  <span>Stage {idx + 1}</span>
                  <span className="text-emerald-600 font-semibold">Ready</span>
                </div>
              </div>

              {/* Arrow connector between stages (desktop only) */}
              {idx < pipelineStages.length - 1 && (
                <div className="hidden md:flex items-center justify-center text-[#D5D3CC] -mx-3 z-10">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Two-column layout below */}
      <div ref={sectionRef as React.RefObject<HTMLDivElement>} className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

        {/* Left Content */}
        <div ref={leftColRef} className="flex flex-col items-start text-left">
          <ul className="space-y-5">
            <li className="flex items-center gap-4 text-gray-700 font-medium">
              <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              Backed by research
            </li>
            <li className="flex items-center gap-4 text-gray-700 font-medium">
              <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </div>
              Designed for creators
            </li>
            <li className="flex items-center gap-4 text-gray-700 font-medium">
              <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              Fast and easy to use
            </li>
            <li className="flex items-center gap-4 text-gray-700 font-medium">
              <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              </div>
              Works for all niches
            </li>
          </ul>
        </div>

        {/* Right Visual composition */}
        <div ref={rightColRef} className="relative w-full h-[400px] flex items-center justify-center perspective-[1000px]">
          
          {/* Back Thumbnail */}
          <div className="absolute top-10 right-10 w-64 aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl opacity-60 transform scale-90 -rotate-3 z-0">
             <img src="https://i.pinimg.com/736x/d0/d7/d9/d0d7d91a4d433a48be7880aca5f3a85b.jpg" alt="Thumb Back" className="w-full h-full object-cover" />
          </div>
          
          {/* Middle Thumbnail */}
          <div className="absolute top-16 left-10 w-72 aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-2xl opacity-80 transform scale-95 rotate-2 z-10">
             <img src="https://i.pinimg.com/736x/e7/51/f9/e751f9acde6f6de5de6b5784e3d132dc.jpg" alt="Thumb Mid" className="w-full h-full object-cover" />
          </div>
          
          {/* Front Thumbnail */}
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-80 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl z-20 border border-white/10 transform rotate-y-[-5deg]">
             <img src="https://i.pinimg.com/736x/1d/1f/cc/1d1fccc821ba9b38584b5ef421980645.jpg" alt="Thumb Front" className="w-full h-full object-cover" />
          </div>

          {/* Glassmorphism Attention Score Card */}
          <div className="absolute -bottom-4 right-0 w-80 bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-5 z-30">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-gray-400 uppercase">Attention Score</span>
              <span className="text-xs text-gray-300 font-mono">Updated</span>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Circular Dial */}
              <div className="relative w-16 h-16 rounded-full border-4 border-gray-100 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-black" strokeDasharray="88, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                </svg>
                <div className="text-center flex flex-col">
                  <span className="text-lg font-black leading-none text-black">88</span>
                  <span className="text-[8px] text-gray-400 font-medium">/100</span>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-20 text-[10px] font-bold text-black flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-black"/> Face
                  </div>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-black w-[38%]"/></div>
                  <div className="w-6 text-right text-[10px] text-gray-500 font-mono">38%</div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="w-20 text-[10px] font-bold text-black flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-600"/> Hook
                  </div>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gray-600 w-[32%]"/></div>
                  <div className="w-6 text-right text-[10px] text-gray-500 font-mono">32%</div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="w-20 text-[10px] font-bold text-black flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400"/> Object
                  </div>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gray-400 w-[20%]"/></div>
                  <div className="w-6 text-right text-[10px] text-gray-500 font-mono">20%</div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="w-20 text-[10px] font-bold text-black flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-300"/> Background
                  </div>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gray-300 w-[10%]"/></div>
                  <div className="w-6 text-right text-[10px] text-gray-500 font-mono">10%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
