import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import { getThumbnails } from '../lib/api';

export const Hero: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const [savedThumbnail, setSavedThumbnail] = useState<{ token: string; url: string | null } | null>(null);
  const [thumbnailLoadFailed, setThumbnailLoadFailed] = useState(false);
  const { token } = useAuth();
  const thumbnailUrl = token && savedThumbnail?.token === token ? savedThumbnail.url : null;

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    getThumbnails(token).then(thumbnails => {
      if (cancelled) return;
      const savedThumbnail = thumbnails.find(thumbnail => {
        if (!thumbnail.url) return false;
        try {
          return new URL(thumbnail.url).protocol === 'https:';
        } catch {
          return false;
        }
      });
      setSavedThumbnail({ token, url: savedThumbnail?.url ?? null });
      setThumbnailLoadFailed(false);
    }).catch(() => {
      if (!cancelled) setSavedThumbnail({ token, url: null });
    });

    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate Left Column elements sequentially
      if (leftColRef.current) {
        gsap.fromTo(
          leftColRef.current.children,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            delay: 0.2
          }
        );
      }

      // Animate Right Column (Laptop)
      if (rightColRef.current) {
        gsap.fromTo(
          rightColRef.current,
          { opacity: 0, scale: 0.9, x: 50 },
          {
            opacity: 1,
            scale: 1,
            x: 0,
            duration: 1,
            ease: 'power3.out',
            delay: 0.4
          }
        );
      }
    }, containerRef);
    
    return () => ctx.revert();
  }, []);
  return (
    <section ref={containerRef} className="relative w-full pt-24 pb-16 lg:pt-32 lg:pb-24 px-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto overflow-hidden bg-white">
      
      {/* Bottom Rocky Background */}
      <div className="absolute bottom-0 right-[-10%] w-[80%] h-[40%] z-0 pointer-events-none opacity-90 hidden md:block">
        <div className="absolute inset-0 bg-[url('/images/mountain_bg.jpg')] bg-cover bg-top mix-blend-multiply opacity-80" style={{ filter: 'contrast(1.2)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent" />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column (Text & CTA) */}
        <div ref={leftColRef} className="lg:col-span-5 flex flex-col items-start text-left space-y-6 lg:ml-8">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 text-[10px] sm:text-[11px] font-bold tracking-widest text-gray-500 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            AI-POWERED YOUTUBE ANALYTICS
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-[#121214] tracking-tight leading-[1.05]">
            Know What <br className="hidden sm:block" />
            They See First.
          </h1>
          
          <p className="text-[17px] text-gray-500 leading-relaxed max-w-md font-medium">
            Turn curiosity into clicks. Analyze YouTube thumbnails with AI to see what grabs attention, test ideas, and create thumbnails that get more views.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a href="#" className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-white bg-[#121214] hover:bg-black rounded-[14px] transition-colors group shadow-md shadow-black/10">
              Get started free 
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </a>
            <a href="#" className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-[#121214] bg-white hover:bg-gray-50 border border-gray-200 rounded-[14px] transition-colors shadow-sm">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
              </svg>
              Watch demo
            </a>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-8 w-full">
            <div>
              <div className="text-2xl font-extrabold text-[#121214]">2M+</div>
              <div className="text-[11px] text-gray-400 mt-1 font-medium">Thumbnails analyzed</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#121214]">50K+</div>
              <div className="text-[11px] text-gray-400 mt-1 font-medium">Creators</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#121214]">4.8/5</div>
              <div className="text-[11px] text-gray-400 mt-1 font-medium">Creator rating</div>
            </div>
          </div>
        </div>

        {/* Right Column (Laptop Mockup) */}
        <div ref={rightColRef} className="lg:col-span-7 relative z-10 w-full lg:w-[125%] mt-16 lg:mt-0 perspective-[1500px]">
          
          {/* Laptop Container */}
          <div className="relative transform rotate-y-[-15deg] rotate-x-[5deg] rotate-z-[2deg] hover:rotate-y-[-10deg] transition-transform duration-700 ease-out preserve-3d">
            
            {/* Screen Bezel (Black) */}
            <div className="relative bg-[#111] p-3 rounded-[24px] shadow-2xl border-[3px] border-[#333] z-10">
              {/* Webcam */}
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#222] rounded-full" />
              
              {/* Screen Content (White Dashboard) */}
              <div className="bg-white rounded-lg overflow-hidden flex h-[460px] text-left">
                
                {/* Sidebar */}
                <div className="w-40 border-r border-gray-100 bg-[#FAFAFA] pt-6 flex flex-col shrink-0">
                  <div className="px-4 flex items-center gap-2 text-black font-extrabold text-sm mb-6">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="10" width="4" height="12" rx="1"/><rect x="10" y="4" width="4" height="18" rx="1"/><rect x="18" y="14" width="4" height="8" rx="1"/></svg>
                    ThumbHeat
                  </div>
                  <div className="px-2 space-y-1 text-[11px] font-medium text-gray-500">
                    <div className="px-3 py-2 bg-[#EFEFEF] text-black rounded-lg font-bold flex items-center gap-2">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                      Home
                    </div>
                    <div className="px-3 py-2 flex items-center gap-2"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Analyze</div>
                    <div className="px-3 py-2 flex items-center gap-2"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>A/B Test</div>
                    <div className="px-3 py-2 flex items-center gap-2"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><polygon points="10 8 16 12 10 16 10 8"/></svg>Feed Simulator</div>
                    <div className="px-3 py-2 flex items-center gap-2"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>Accessibility</div>
                    <div className="px-3 py-2 flex items-center gap-2"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>Analytics</div>
                    <div className="px-3 py-2 flex items-center gap-2"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>Library</div>
                  </div>
                </div>

                {/* Dashboard Main */}
                <div className="flex-1 p-8 flex flex-col relative">
                  
                  {/* Top Bar simulated */}
                  <div className="absolute top-4 left-6 right-6 flex justify-between items-center bg-gray-50/50 rounded border border-gray-100 p-1.5 px-3">
                    <div className="text-[9px] text-gray-400 flex items-center gap-2">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      Search thumbnail...
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between items-start gap-8">
                    
                    {/* Center Column: Heatmap */}
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-black mb-4">Attention Heatmap</h3>
                      
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black shadow-sm mb-4 border border-gray-200">
                        {thumbnailUrl && !thumbnailLoadFailed && (
                          <img
                            src={thumbnailUrl}
                            alt="Saved thumbnail"
                            onError={() => setThumbnailLoadFailed(true)}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )}
                        {/* CSS Heatmap Overlay for realism */}
                        <div className="absolute inset-0 mix-blend-screen opacity-90 pointer-events-none">
                          <div className="absolute top-1/3 left-1/3 w-32 h-32 bg-red-500 rounded-full blur-[40px]" />
                          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-yellow-400 rounded-full blur-[30px]" />
                          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-500 rounded-full blur-[50px] opacity-60" />
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <button className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          View original
                        </button>
                      </div>

                      <div className="mt-6">
                        <div className="h-1.5 w-full bg-gradient-to-r from-gray-200 via-gray-400 to-black rounded-full" />
                        <div className="flex justify-between text-[9px] text-gray-400 font-medium mt-2 uppercase tracking-wide">
                          <span>Low attention</span>
                          <span>High attention</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Stats */}
                    <div className="w-36 shrink-0 pt-8">
                      <div className="text-center mb-8">
                        <div className="text-[10px] font-bold text-gray-400 mb-2">Attention Score</div>
                        <div className="relative w-20 h-20 mx-auto">
                          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" stroke="#F3F4F6" strokeWidth="3" />
                            <path className="text-black" strokeDasharray="92, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-black leading-none">92</span>
                            <span className="text-[8px] text-gray-400 font-medium">/100</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="text-[10px] font-bold text-gray-500">Top Attention Areas</div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px]"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-black"/> <span className="font-semibold text-gray-700">Face</span></div><span className="font-mono text-black font-bold">42%</span></div>
                          <div className="flex justify-between items-center text-[10px]"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-600"/> <span className="font-semibold text-gray-700">Text</span></div><span className="font-mono text-black font-bold">28%</span></div>
                          <div className="flex justify-between items-center text-[10px]"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400"/> <span className="font-semibold text-gray-700">Object</span></div><span className="font-mono text-black font-bold">18%</span></div>
                          <div className="flex justify-between items-center text-[10px]"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300"/> <span className="font-semibold text-gray-700">Background</span></div><span className="font-mono text-black font-bold">12%</span></div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Laptop Base Lip */}
            <div className="relative h-4 bg-[#D1D5DB] rounded-b-xl border-t border-[#E5E7EB] shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#9CA3AF] rounded-b-md" />
            </div>
            
            {/* Laptop Chassis Bottom (Simulated depth) */}
            <div className="absolute top-full left-[2%] right-[2%] h-4 bg-[#9CA3AF] rounded-b-[30px] transform origin-top rotate-x-[-70deg] blur-[1px]" />
          </div>
        </div>
      </div>
    </section>
  );
};
