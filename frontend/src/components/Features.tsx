import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const Features: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.bento-card',
        { y: 40, opacity: 0 },
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
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="py-16 sm:py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
      
      {/* 2x2 Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-auto">

        {/* Card 1: Attention Heatmap (Dark, top-left) */}
        <div className="bento-card lg:col-span-7 relative bg-[#0D0D12] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row group">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="relative z-10 p-10 flex flex-col justify-center max-w-sm">
            <div className="w-12 h-12 rounded-2xl border border-white/20 flex items-center justify-center mb-6 text-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Attention Heatmap</h3>
            <p className="text-gray-400 text-[15px] leading-relaxed mb-8">
              See exactly where viewers look first, how long they focus, and which elements work best.
            </p>
            <a href="#" className="inline-flex items-center text-white font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
              Explore <span>→</span>
            </a>
          </div>

          <div className="relative z-0 w-full h-64 md:h-auto overflow-hidden perspective-[1000px] flex items-center justify-center -mr-10 -mb-10 md:mb-0 md:mr-0">
            <div className="relative w-[120%] transform rotate-y-[-15deg] rotate-x-[5deg] group-hover:rotate-y-[-10deg] transition-transform duration-700 origin-right translate-x-12">
              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                <img src="https://i.pinimg.com/736x/52/4f/c2/524fc2bb211104012b3779be34c25036.jpg" alt="Thumbnail" className="w-full h-full object-cover grayscale brightness-75" />
                {/* CSS Heatmaps */}
                <div className="absolute top-[20%] right-[30%] w-24 h-24 bg-red-500 rounded-full blur-[25px] mix-blend-screen opacity-90" />
                <div className="absolute top-[30%] right-[10%] w-16 h-16 bg-yellow-400 rounded-full blur-[15px] mix-blend-screen opacity-90" />
              </div>
              {/* Floating Stat Card */}
              <div className="absolute -bottom-6 left-12 bg-[#1A1A24]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl flex items-center gap-4 transform translate-z-[50px]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">82%</span>
                    <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l7-7 7 7M12 19V5"/></svg>
                  </div>
                </div>
              </div>

              {/* Feed Item 2: Iris Target (Highlighted with subtle indicator) */}
              <div className="feed-item feed-target space-y-2 relative rounded-xl p-1 bg-white/5 border border-[#8B5CF6]">
                <div className="feed-thumbnail aspect-video w-full rounded-lg overflow-hidden relative">
                  <div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center text-white text-xs">Your Thumbnail</div>
                  <div className="feed-metric absolute top-2 right-2 px-2 py-0.5 bg-[#8B5CF6] text-white text-[10px] font-mono font-bold rounded shadow-md">
                    Iris · #1 Focal Pick
                  </div>
                </div>
                <div className="flex gap-2 px-1">
                  <div className="w-7 h-7 rounded-full bg-[#8B5CF6] shrink-0 flex items-center justify-center text-[10px] font-bold">A</div>
                  <div className="text-xs">
                    <p className="font-bold text-white line-clamp-1">THE 48-HOUR EXPERIMENT</p>
                    <p className="text-[10px] text-violet-300">Your Channel · 14:22</p>
                  </div>
                </div>
              </div>

              {/* Feed Item 3: Competitor 2 */}
              <div className="feed-item space-y-2 opacity-60">
                <div className="feed-thumbnail aspect-video w-full rounded-xl overflow-hidden">
                  <div className="w-full h-full bg-[#222] flex items-center justify-center text-gray-400 text-[10px]">Focus on subject</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: A/B Thumbnail Battle (Light, top-right) */}
        <div className="bento-card lg:col-span-5 relative bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 flex flex-row group min-h-[280px]">

          {/* Left: Text content */}
          <div className="flex flex-col justify-between p-10 w-[52%] shrink-0 relative z-10">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-6 text-black group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="12" y1="3" x2="12" y2="21" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">A/B Thumbnail Battle</h3>
              <p className="text-gray-500 text-[15px] leading-relaxed mb-6">
                Compare multiple thumbnail variations side by side and see which one is predicted to perform better.
              </p>
            </div>
            <a href="#" className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-[#121214] hover:bg-black rounded-full transition-colors w-max gap-2 group-hover:gap-3">
              Explore <span>→</span>
            </a>
          </div>

          {/* Right: Stacked images centered */}
          <div className="flex-1 relative">
            {/* Variant A (Back) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-[60%] -translate-y-[65%] w-40 aspect-video bg-white p-1 rounded-xl shadow-lg border border-gray-200 rotate-[-5deg] opacity-60 group-hover:rotate-[-8deg] transition-transform duration-500">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKsh9cdVg7XQWx1jYcYCMJB6OFJmKSTP0NsoaDNmUFJH0xlH72bkl4DMbO&s=10" className="w-full h-full object-cover rounded-lg" />
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-black text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">A</div>
            </div>
            {/* Variant B (Front) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-[40%] -translate-y-[35%] w-40 aspect-video bg-white p-1 rounded-xl shadow-2xl border border-gray-200 rotate-[4deg] group-hover:rotate-[6deg] group-hover:-translate-y-[40%] transition-transform duration-500 z-10">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKsh9cdVg7XQWx1jYcYCMJB6OFJmKSTP0NsoaDNmUFJH0xlH72bkl4DMbO&s=10" className="w-full h-full object-cover rounded-lg" />
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-black text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">B</div>
              {/* Floating Stat Card */}
              <div className="absolute -bottom-3 -right-3 bg-white border border-gray-100 rounded-xl p-2.5 shadow-xl flex flex-col items-center z-20">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-black">+24%</span>
                  <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l7-7 7 7M12 19V5"/></svg>
                </div>
                <div className="text-[9px] text-gray-500">Predicted CTR</div>
              </div>
            </div>
          </div>

        </div>


        {/* Card 3: Attention Budget (Light, bottom-left) */}
        <div className="bento-card lg:col-span-4 relative bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 flex flex-col group p-10">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-6 text-black group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-black mb-3 max-w-[50%]">Attention Budget</h3>
          <p className="text-gray-500 text-[15px] leading-relaxed mb-8 max-w-[50%] xl:max-w-[55%] relative z-10">
            Break down how attention is distributed across faces, text, objects and background noise.
          </p>
          <div className="mt-auto relative z-10">
            <a href="#" className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-black bg-white hover:bg-gray-50 border border-gray-200 rounded-full transition-colors w-max gap-2 group-hover:gap-3">
              Explore <span>→</span>
            </a>
          </div>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[45%] flex flex-col items-center justify-center pointer-events-none">
            {/* Donut Chart */}
            <div className="relative w-28 h-28 mb-6 group-hover:scale-105 transition-transform duration-500">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                <path strokeDasharray="82, 100" d="M18 4 a 14 14 0 0 1 0 28 a 14 14 0 0 1 0 -28" fill="none" stroke="#27272A" strokeWidth="8" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-black leading-none">82</span>
                <span className="text-[9px] text-gray-500 font-medium">/100</span>
              </div>
            </div>
            
            {/* Stats List */}
            <div className="space-y-3 w-full">
              <div className="flex justify-between items-center text-[11px]"><div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-black"/> <span className="font-semibold text-gray-700">Face</span></div><span className="text-gray-500 font-medium">42%</span></div>
              <div className="flex justify-between items-center text-[11px]"><div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-500"/> <span className="font-semibold text-gray-700">Text</span></div><span className="text-gray-500 font-medium">28%</span></div>
              <div className="flex justify-between items-center text-[11px]"><div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300"/> <span className="font-semibold text-gray-700">Object</span></div><span className="text-gray-500 font-medium">18%</span></div>
              <div className="flex justify-between items-center text-[11px]"><div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-200"/> <span className="font-semibold text-gray-700">Background</span></div><span className="text-gray-500 font-medium">12%</span></div>
            </div>
          </div>
        </div>

        {/* Card 4: YouTube Feed Simulator (Dark, bottom-right) */}
        <div className="bento-card lg:col-span-8 relative bg-[#0D0D12] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row group">
          {/* Abstract wave background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
             <div className="absolute -left-20 -top-20 w-[400px] h-[400px] border-[1px] border-white/20 rounded-full" />
             <div className="absolute left-10 top-10 w-[500px] h-[500px] border-[1px] border-white/10 rounded-full" />
          </div>

          <div className="relative z-10 p-10 flex flex-col justify-center max-w-sm">
            <div className="w-12 h-12 rounded-2xl border border-white/20 bg-white/5 flex items-center justify-center mb-6 text-white group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">YouTube Feed Simulator</h3>
            <p className="text-gray-400 text-[15px] leading-relaxed mb-8">
              Preview your thumbnail in a realistic YouTube feed. Test it against highly competitive videos to ensure your design cuts through the noise and commands attention.
            </p>
            <div className="mt-auto">
              <a href="#" className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-black bg-white hover:bg-gray-100 rounded-full transition-colors w-max gap-2 group-hover:gap-3">
                Explore <span>→</span>
              </a>
            </div>
          </div>

          <div className="relative z-0 flex-1 h-[320px] md:h-auto overflow-hidden perspective-[1000px] flex items-center justify-end -mr-12 -mb-12 md:mb-0">
            {/* Simulated YouTube Window */}
            <div className="w-[480px] bg-[#0F0F0F] rounded-xl border border-white/10 shadow-2xl transform rotate-y-[-10deg] rotate-x-[5deg] group-hover:rotate-y-[-5deg] transition-transform duration-700">
              
              {/* YouTube Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                  <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  YouTube
                </div>
                <div className="flex-1 max-w-[200px] mx-4 h-7 bg-[#222] rounded-full px-3 flex items-center text-[10px] text-gray-500 border border-white/10">
                  Search
                </div>
                <div className="w-6 h-6 rounded-full bg-[#222]" />
              </div>
              
              {/* Chips */}
              <div className="px-4 py-2 border-b border-white/10 flex gap-2 overflow-hidden">
                <div className="px-3 py-1 bg-white text-black rounded-lg text-[9px] font-bold">All</div>
                <div className="px-3 py-1 bg-[#222] text-white rounded-lg text-[9px]">Gaming</div>
                <div className="px-3 py-1 bg-[#222] text-white rounded-lg text-[9px]">Science</div>
                <div className="px-3 py-1 bg-[#222] text-white rounded-lg text-[9px]">Space</div>
                <div className="px-3 py-1 bg-[#222] text-white rounded-lg text-[9px]">Travel</div>
                <div className="px-3 py-1 bg-[#222] text-white rounded-lg text-[9px]">Live</div>
              </div>

              {/* Video List */}
              <div className="p-4 space-y-4">
                {/* Video 1 (User's Thumbnail) */}
                <div className="flex gap-3 items-start group/video">
                  <div className="relative w-40 shrink-0 aspect-video rounded-lg overflow-hidden border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpxJnVaCJFmqHw3K0EdbcN0z56iQ5s4NTCbRIRA59NNK79Nd0rZk2sIT8&s=10" className="w-full h-full object-cover group-hover/video:scale-105 transition-transform duration-500" />
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[8px] px-1 rounded">12:34</div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white text-xs font-bold leading-tight">Beyond The Limits</h4>
                    <p className="text-gray-400 text-[10px]">1.2M views • 2 weeks ago</p>
                  </div>
                </div>
                {/* Video 2 */}
                <div className="flex gap-3 items-start opacity-50">
                  <div className="relative w-40 shrink-0 aspect-video rounded-lg overflow-hidden bg-[#222]">
                    <img src="https://i.pinimg.com/736x/60/13/ff/6013ffc3177ea4ff1345df339a4b2f5c.jpg" className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[8px] px-1 rounded">10:21</div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white text-xs font-bold leading-tight">Japan's Secret City</h4>
                    <p className="text-gray-400 text-[10px]">842K views • 1 month ago</p>
                  </div>
                </div>
                {/* Video 3 */}
                <div className="flex gap-3 items-start opacity-30">
                  <div className="relative w-40 shrink-0 aspect-video rounded-lg overflow-hidden bg-[#222]">
                    <img src="https://i.pinimg.com/736x/99/d3/4f/99d34fc76703d81c867bb18a404846e4.jpg" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white text-xs font-bold leading-tight">The Future of Space</h4>
                    <p className="text-gray-400 text-[10px]">320K views • 3 weeks ago</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
