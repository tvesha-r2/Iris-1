import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNavbar } from '../components/AppNavbar';
import { Upload, X, Activity, MousePointer2, Smartphone, Monitor, ChevronRight, Zap, Target } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { analyzeImage, uploadImage } from '../lib/api';
import type { AnalysisResult, StoredImage } from '../lib/api';
import { useAuth } from '../context/AuthContext';

gsap.registerPlugin(ScrollTrigger);

type ViewMode = 'original' | 'heatmap' | 'scan';
type FeedScale = 'desktop' | 'mobile';

interface Variant {
  id: 'A' | 'B';
  file: File;
  previewUrl: string;
  storedImage?: StoredImage;
  analysis?: AnalysisResult;
}

export const Compare: React.FC = () => {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const previewUrlsRef = useRef(new Set<string>());
  const { token } = useAuth();

  const [variants, setVariants] = useState<Partial<Record<'A' | 'B', Variant>>>({});
  const [isComparing, setIsComparing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('original');
  const [feedScale, setFeedScale] = useState<FeedScale>('desktop');
  const [activeFeedVariant, setActiveFeedVariant] = useState<'A' | 'B'>('A');
  const [showFeedHeatmap, setShowFeedHeatmap] = useState(false);

  const fileInputRefA = useRef<HTMLInputElement>(null);
  const fileInputRefB = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // PAGE LOAD
      gsap.fromTo('.compare-header', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
      gsap.fromTo('.compare-title', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.1, ease: 'power3.out' });
      gsap.fromTo('.compare-subtitle', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' });
      gsap.fromTo('.upload-grid', { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.8, delay: 0.3, ease: 'power3.out' });
      gsap.fromTo('.compare-button-container', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: 'power3.out' });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  // Set up ScrollTriggers for comparison results when they appear
  useEffect(() => {
    if (!isComparing) return;

    const ctx = gsap.context(() => {
      // BATTLE SECTION
      gsap.fromTo('.battle-card:nth-child(1)',
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 }
      );
      gsap.fromTo('.battle-card:nth-child(2)',
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', delay: 0.3 }
      );

      // CHARTS & BARS
      ScrollTrigger.create({
        trigger: '.comparison-chart',
        start: 'top 85%',
        onEnter: () => {
          gsap.fromTo('.comparison-bar',
            { width: '0%' },
            { width: (_, target) => target.dataset.width, duration: 1.2, ease: 'power3.out', stagger: 0.05 }
          );
        },
        once: true
      });

      // INSIGHTS
      ScrollTrigger.create({
        trigger: '.comparison-insights',
        start: 'top 80%',
        onEnter: () => {
          gsap.fromTo('.comparison-insight',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out' }
          );
        },
        once: true
      });

      // FEED
      ScrollTrigger.create({
        trigger: '.feed-section',
        start: 'top 75%',
        onEnter: () => {
          gsap.fromTo('.feed-frame', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
          gsap.fromTo('.feed-item',
            { opacity: 0, x: -20 },
            { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, delay: 0.4, ease: 'power2.out' }
          );
        },
        once: true
      });

      // FEED METRICS
      ScrollTrigger.create({
        trigger: '.feed-metrics',
        start: 'top 85%',
        onEnter: () => {
          gsap.fromTo('.feed-metric',
            { opacity: 0, scale: 0.95 },
            { opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.2)' }
          );
        },
        once: true
      });

    }, pageRef);

    return () => ctx.revert();
  }, [isComparing]);

  const handleUploadClick = (id: 'A' | 'B') => {
    if (id === 'A') fileInputRefA.current?.click();
    if (id === 'B') fileInputRefB.current?.click();
  };

  const handleFileChange = (id: 'A' | 'B', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        setAnalysisError('Please choose a PNG, JPG, or WEBP image.');
      } else if (file.size > 20 * 1024 * 1024) {
        setAnalysisError('Each image must be under 20 MB.');
      } else {
        const existing = variants[id];
        if (existing) {
          URL.revokeObjectURL(existing.previewUrl);
          previewUrlsRef.current.delete(existing.previewUrl);
        }
        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.add(previewUrl);
        setVariants(prev => ({
          ...prev,
          [id]: { id, file, previewUrl },
        }));
        setAnalysisError(null);
        setIsComparing(false);
      }
    }
    // reset input value so the same file can be selected again
    e.target.value = '';
  };

  const removeVariant = (id: 'A' | 'B', e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnalyzing) return;
    setVariants(prev => {
      const newVars = { ...prev };
      if (newVars[id]) {
        URL.revokeObjectURL(newVars[id]!.previewUrl);
        previewUrlsRef.current.delete(newVars[id]!.previewUrl);
      }
      delete newVars[id];
      return newVars;
    });
    setIsComparing(false);
    setAnalysisError(null);
  };

  const startComparison = async () => {
    const selectedVariants = variants;
    if (!selectedVariants.A || !selectedVariants.B) return;
    if (!token) {
      navigate('/login');
      return;
    }

    setAnalysisError(null);
    setIsAnalyzing(true);
    try {
      for (const id of ['A', 'B'] as const) {
        const variant = selectedVariants[id]!;
        const storedImage = variant.storedImage ?? await uploadImage(variant.file, token);
        if (!variant.storedImage) {
          setVariants(prev => ({
            ...prev,
            [id]: { ...prev[id]!, storedImage },
          }));
        }

        const analysis = variant.analysis ?? await analyzeImage(storedImage.id, token);
        setVariants(prev => ({
          ...prev,
          [id]: { ...prev[id]!, storedImage, analysis },
        }));
      }

      setIsComparing(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Thumbnail comparison failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canCompare = variants.A && variants.B;
  const activeKeys = Object.keys(variants).sort() as ('A' | 'B')[];
  const canShowHeatmaps = activeKeys.length === 2
    && activeKeys.every(id => Boolean(variants[id]?.analysis?.overlay_url));
  const countFor = (id: 'A' | 'B', category: keyof AnalysisResult['detections']) =>
    variants[id]?.analysis?.detections[category] ?? 0;
  const totalFor = (id: 'A' | 'B') =>
    countFor(id, 'faces') + countFor(id, 'texts') + countFor(id, 'objects');
  const activeFeedAnalysis = variants[activeFeedVariant]?.analysis;

  const renderUploadSlot = (id: 'A' | 'B', title: string, isOptional: boolean = false) => {
    const hasImage = !!variants[id];

    return (
      <div
        className={`upload-slot relative aspect-video border-2 ${hasImage ? 'border-[#8B5CF6] border-solid' : 'border-dashed border-[#E6E4DE] hover:border-[#D5D3CC]'} rounded-3xl transition-all duration-300 flex flex-col items-center justify-center overflow-hidden bg-white group cursor-pointer`}
        onClick={() => !isAnalyzing && !hasImage && handleUploadClick(id)}
      >
        <input 
          type="file" 
          ref={id === 'A' ? fileInputRefA : fileInputRefB} 
          className="hidden" 
          accept="image/*" 
          disabled={isAnalyzing}
          onChange={(e) => handleFileChange(id, e)} 
        />
        {hasImage ? (
          <>
            <img src={variants[id]!.previewUrl} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-3 backdrop-blur-[2px]">
              <span className="text-white font-bold tracking-wider">{title}</span>
              <div className="flex gap-2">
                <button disabled={isAnalyzing} onClick={(e) => { e.stopPropagation(); handleUploadClick(id); }} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-semibold backdrop-blur-md transition-colors">Replace</button>
                <button disabled={isAnalyzing} onClick={(e) => removeVariant(id, e)} className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs font-bold uppercase tracking-wider">{title}</div>
          </>
        ) : (
          <div className="text-center p-6 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-[#FAF9F5] border border-[#E6E4DE] flex items-center justify-center mb-4 text-[#8F8D98] group-hover:text-[#8B5CF6] group-hover:-translate-y-1 transition-all">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#121214] mb-1">{title}</h3>
            {isOptional ? (
              <p className="text-xs text-[#8F8D98] font-medium">Optional variant</p>
            ) : (
              <p className="text-xs text-[#8F8D98] font-medium">Drop to compare</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderVariantAnalysis = (id: 'A' | 'B') => {
    const result = variants[id]?.analysis;
    if (!result) return null;
    const total = totalFor(id);
    const displayUrl = viewMode === 'heatmap' && result.overlay_url
      ? result.overlay_url
      : result.url;

    return (
      <div key={id} className="battle-card bg-white border border-[#E6E4DE] rounded-3xl p-5 shadow-xl shadow-black/5 flex flex-col w-full max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4 px-1">
          <span className="text-sm font-bold text-[#121214] bg-[#FAF9F5] px-3 py-1 rounded-md border border-[#E6E4DE]">Variant {id}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#4A4950] uppercase tracking-wide">Elements detected</span>
            <span className="text-xl font-black text-[#8B5CF6]">{total}</span>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-[#121214] aspect-video flex items-center justify-center mb-6">
          <img src={displayUrl} alt={`Variant ${id} ${viewMode}`} className="battle-thumbnail w-full h-full object-cover" />
          {viewMode === 'scan' && (
            <div className="absolute inset-x-0 bottom-0 bg-black/70 px-4 py-2 text-center text-xs text-white">
              Scan-path data is not provided by the current analysis.
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="battle-metric bg-[#FAF9F5] p-3 rounded-xl border border-[#E6E4DE]">
            <div className="text-[10px] font-bold text-[#8F8D98] uppercase tracking-wider mb-1">Faces detected</div>
            <div className="text-lg font-bold text-[#121214]">{result.detections.faces}</div>
          </div>
          <div className="battle-metric bg-[#FAF9F5] p-3 rounded-xl border border-[#E6E4DE]">
            <div className="text-[10px] font-bold text-[#8F8D98] uppercase tracking-wider mb-1">Text regions detected</div>
            <div className="text-lg font-bold text-[#121214]">{result.detections.texts}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={pageRef} className="compare-page min-h-screen bg-[#FAF9F5] text-[#121214] font-sans selection:bg-purple-100 selection:text-purple-900 pb-24 overflow-x-hidden">
      <AppNavbar />

      {!isComparing ? (
        <main className="upload-section pt-32 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto min-h-[80vh] flex flex-col">

          <div className="compare-header text-center max-w-3xl mx-auto mb-16">
            <h1 className="compare-title text-4xl md:text-5xl font-bold tracking-tight text-[#121214] mb-4">
              Which design captures attention better?
            </h1>
          </div>

          <div className="upload-grid grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full mb-12">
            {renderUploadSlot('A', 'Thumbnail A')}
            {renderUploadSlot('B', 'Thumbnail B')}
          </div>

          <div className="compare-button-container flex flex-col items-center mt-auto pb-10">
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-4 bg-white px-10 py-6 rounded-3xl border border-[#E6E4DE] shadow-xl">
                <Activity className="w-8 h-8 text-[#8B5CF6] animate-pulse" />
                <div className="h-6 relative overflow-hidden w-64 text-center">
                  <div className="absolute inset-x-0 text-sm font-bold text-[#121214] animate-[slideUp_2s_infinite]">Analyzing visual hierarchy...</div>
                </div>
              </div>
            ) : (
              <button
                disabled={!canCompare}
                onClick={startComparison}
                className={`compare-button inline-flex items-center gap-2 px-8 py-4 text-base font-bold rounded-2xl transition-all duration-300 shadow-lg ${canCompare ? 'bg-[#121214] hover:bg-[#25252A] text-white hover:scale-105' : 'bg-[#E6E4DE] text-[#8F8D98] cursor-not-allowed'}`}
              >
                Compare Thumbnails
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            {analysisError && (
              <p role="alert" className="mt-4 text-sm font-medium text-red-600">{analysisError}</p>
            )}
            {!canCompare && !isAnalyzing && !analysisError && (
              <p className="mt-4 text-sm font-medium text-[#8F8D98]">Upload at least two variants to begin comparison.</p>
            )}
          </div>

        </main>
      ) : (
        <main className="comparison-results pt-28 px-6 sm:px-8 lg:px-12 max-w-[1600px] mx-auto">

          {/* A/B BATTLE HERO */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-[#121214] mb-4">A/B Thumbnail Battle</h2>
            <div className="flex items-center justify-center gap-2 p-1 bg-white border border-[#E6E4DE] rounded-xl shadow-sm inline-flex mx-auto">
              <button onClick={() => setViewMode('original')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${viewMode === 'original' ? 'bg-[#FAF9F5] text-[#121214] shadow-sm' : 'text-[#4A4950] hover:text-[#121214]'}`}>Original</button>
              <button
                onClick={() => setViewMode('heatmap')}
                disabled={!canShowHeatmaps}
                title={!canShowHeatmaps ? 'Heatmaps are unavailable for one or more variants.' : 'Show generated heatmaps'}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${viewMode === 'heatmap' ? 'bg-[#8B5CF6] text-white shadow-sm' : 'text-[#4A4950] hover:text-[#121214]'}`}
              ><Activity className="w-4 h-4" /> Heatmap</button>
              <button onClick={() => setViewMode('scan')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${viewMode === 'scan' ? 'bg-[#121214] text-white shadow-sm' : 'text-[#4A4950] hover:text-[#121214]'}`}><MousePointer2 className="w-4 h-4" /> Scan Path</button>
            </div>
            {viewMode === 'heatmap' && <p className="mt-4 text-xs font-bold text-[#8F8D98] uppercase tracking-wider">Predicted visual attention</p>}
            {viewMode === 'scan' && <p className="mt-4 text-xs font-bold text-[#8F8D98] uppercase tracking-wider">Scan-path data is unavailable for this analysis</p>}
          </div>

          <div className="battle-section flex flex-col lg:flex-row justify-center gap-8 mb-20 overflow-x-auto pb-8 snap-x">
            {activeKeys.map(key => renderVariantAnalysis(key))}
          </div>

          {/* DISTRIBUTION COMPARISON */}
          <div className="comparison-chart bg-white border border-[#E6E4DE] rounded-3xl p-8 lg:p-12 shadow-sm max-w-5xl mx-auto mb-20">
            <h3 className="text-sm font-bold text-[#4A4950] tracking-wide uppercase mb-10 text-center">Detected Elements by Category</h3>

            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center text-xs font-bold text-[#8F8D98] uppercase tracking-wider mb-2">
                <div className="w-32 shrink-0">Category</div>
                <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${activeKeys.length}, minmax(0, 1fr))` }}>
                  {activeKeys.map(k => <div key={k} className="text-center">Variant {k}</div>)}
                </div>
              </div>

              {/* Rows */}
              {([
                { label: 'Faces', key: 'faces' },
                { label: 'Text regions', key: 'texts' },
                { label: 'Objects', key: 'objects' },
              ] as const).map((row) => (
                <div key={row.label} className="flex items-center border-b border-[#E6E4DE]/50 pb-4">
                  <div className="w-32 shrink-0 font-semibold text-[#121214]">{row.label}</div>
                  <div className="flex-1 grid gap-4" style={{ gridTemplateColumns: `repeat(${activeKeys.length}, minmax(0, 1fr))` }}>
                    {activeKeys.map((k, j) => {
                      const val = countFor(k, row.key);
                      const total = totalFor(k);
                      const percentage = total ? Math.round((val / total) * 100) : 0;
                      return (
                        <div key={k} className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-right text-[#4A4950]">{val} ({percentage}%)</span>
                          <div className="h-1.5 w-full bg-[#FAF9F5] rounded-full overflow-hidden flex justify-end">
                            <div className={`comparison-bar h-full rounded-full ${j === 0 ? 'bg-[#8B5CF6]' : j === 1 ? 'bg-[#121214]' : 'bg-[#8F8D98]'}`} data-width={`${percentage}%`} style={{ width: '0%' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INSIGHTS */}
          <div className="comparison-insights max-w-5xl mx-auto mb-32">
            <h3 className="text-3xl font-bold tracking-tight text-[#121214] mb-8 text-center">What changed between the designs?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="comparison-insight bg-white p-6 rounded-3xl border border-[#E6E4DE] flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-[#8B5CF6]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8F8D98] uppercase tracking-wider block mb-1">Face detections</span>
                  <p className="text-sm font-medium text-[#121214]">
                    Variant A: {countFor('A', 'faces')} faces. Variant B: {countFor('B', 'faces')} faces.
                  </p>
                </div>
              </div>
              <div className="comparison-insight bg-white p-6 rounded-3xl border border-[#E6E4DE] flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-[#121214]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8F8D98] uppercase tracking-wider block mb-1">Text detections</span>
                  <p className="text-sm font-medium text-[#121214]">
                    Variant A: {countFor('A', 'texts')} text regions. Variant B: {countFor('B', 'texts')} text regions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FEED SIMULATOR */}
          <div className="feed-section max-w-[1400px] mx-auto mb-32 bg-[#121214] text-white rounded-[40px] p-8 lg:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-12">
              <div className="flex-1 lg:max-w-sm">
                <h2 className="text-4xl font-bold tracking-tight mb-4">Now put them in the feed.</h2>
                <p className="text-gray-400 font-medium text-lg mb-8">See how your thumbnails behave when reduced to the scale viewers actually encounter while browsing.</p>

                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Select Active Variant</span>
                    <div className="flex gap-2 bg-gray-900 p-1 rounded-xl border border-gray-800 w-fit">
                      {activeKeys.map(k => (
                        <button
                          key={k}
                          onClick={() => setActiveFeedVariant(k)}
                          className={`px-6 py-2 text-sm font-bold rounded-lg transition-colors ${activeFeedVariant === k ? 'bg-[#8B5CF6] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        >
                          Variant {k}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Feed Scale Preview</span>
                    <div className="flex gap-2">
                      <button onClick={() => setFeedScale('desktop')} className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-colors border ${feedScale === 'desktop' ? 'bg-white text-[#121214] border-white' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'}`}>
                        <Monitor className="w-4 h-4" /> Desktop
                      </button>
                      <button onClick={() => setFeedScale('mobile')} className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-colors border ${feedScale === 'mobile' ? 'bg-white text-[#121214] border-white' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'}`}>
                        <Smartphone className="w-4 h-4" /> Mobile
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-gray-800">
                    <span className="text-sm font-bold text-gray-300">Show Attention Overlay</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={showFeedHeatmap}
                        disabled={!activeFeedAnalysis?.overlay_url}
                        onChange={() => setShowFeedHeatmap(!showFeedHeatmap)}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B5CF6]"></div>
                    </label>
                  </div>
                </div>

                <div className="mt-12 p-5 bg-gray-900 border border-gray-800 rounded-2xl">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Attention Competition</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Variant {activeFeedVariant} has {countFor(activeFeedVariant, 'faces')} face,
                    {' '}{countFor(activeFeedVariant, 'texts')} text-region, and
                    {' '}{countFor(activeFeedVariant, 'objects')} object detections.
                  </p>
                </div>
              </div>

              {/* SIMULATED FEED */}
              <div className="flex-1 flex justify-center bg-black/40 rounded-3xl border border-gray-800 p-8 overflow-hidden h-[600px] feed-frame">
                <div className={`flex flex-col gap-6 w-full max-w-full overflow-y-auto pr-2 custom-scrollbar transition-all duration-500 ${feedScale === 'mobile' ? 'max-w-[320px]' : 'max-w-[480px]'}`}>

                  {/* Competitor 1 */}
                  <div className="feed-item flex flex-col gap-3">
                    <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Competitor" className="w-full h-full object-cover opacity-80" />
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">12:04</span>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-800 shrink-0"></div>
                      <div>
                        <h4 className="text-sm font-bold leading-snug line-clamp-2 mb-1">How to design better interfaces in 2024</h4>
                        <p className="text-xs text-gray-400">Design Studio • 120K views • 2 days ago</p>
                      </div>
                    </div>
                  </div>

                  {/* USER TARGET */}
                  <div className="feed-item feed-target flex flex-col gap-3 relative">
                    <div className="absolute -inset-4 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-2xl -z-10 animate-pulse"></div>
                    <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-2xl shadow-purple-900/20">
                      {activeFeedAnalysis && (
                        <img
                          src={showFeedHeatmap && activeFeedAnalysis.overlay_url
                            ? activeFeedAnalysis.overlay_url
                            : activeFeedAnalysis.url}
                          alt={`Your thumbnail variant ${activeFeedVariant}`}
                          className="w-full h-full object-cover transition-all duration-500"
                        />
                      )}
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">8:42</span>

                      <div className="absolute top-2 left-2 bg-[#8B5CF6] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase shadow-sm">Your Thumbnail {activeFeedVariant}</div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-orange-500 shrink-0"></div>
                      <div>
                        <h4 className="text-sm font-bold leading-snug line-clamp-2 mb-1 text-white">The exact formula for visual hierarchy</h4>
                        <p className="text-xs text-gray-400">Your Channel • 0 views • Just now</p>
                      </div>
                    </div>
                  </div>

                  {/* Competitor 2 */}
                  <div className="feed-item flex flex-col gap-3">
                    <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Competitor" className="w-full h-full object-cover opacity-80" />
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">15:30</span>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-800 shrink-0"></div>
                      <div>
                        <h4 className="text-sm font-bold leading-snug line-clamp-2 mb-1">Color theory secrets nobody tells you</h4>
                        <p className="text-xs text-gray-400">Creative Labs • 45K views • 1 week ago</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Feed Metrics below */}
            <div className="feed-metrics mt-12 pt-8 border-t border-gray-800 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { l: 'Text regions detected', v: countFor(activeFeedVariant, 'texts') },
                { l: 'Faces detected', v: countFor(activeFeedVariant, 'faces') },
                { l: 'Objects detected', v: countFor(activeFeedVariant, 'objects') },
              ].map(m => (
                <div key={m.l} className="feed-metric bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 line-clamp-1">{m.l}</div>
                  <div className="text-xl font-black text-white">{m.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SUMMARY */}
          <div className="comparison-summary max-w-4xl mx-auto mb-32 bg-white border border-[#E6E4DE] rounded-3xl p-8 lg:p-12 shadow-sm text-center">
            <h3 className="text-sm font-bold text-[#4A4950] tracking-wide uppercase mb-8">Comparison Summary</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="p-6 bg-[#FAF9F5] rounded-2xl border border-[#E6E4DE]">
                <span className="block text-xs font-bold text-[#8F8D98] uppercase tracking-wider mb-2">Variant A detections</span>
                <span className="block text-2xl font-black text-[#121214]">{totalFor('A')}</span>
              </div>
              <div className="p-6 bg-[#FAF9F5] rounded-2xl border border-[#E6E4DE]">
                <span className="block text-xs font-bold text-[#8F8D98] uppercase tracking-wider mb-2">Variant B detections</span>
                <span className="block text-2xl font-black text-[#121214]">{totalFor('B')}</span>
              </div>
              <div className="p-6 bg-[#FAF9F5] rounded-2xl border border-[#E6E4DE]">
                <span className="block text-xs font-bold text-[#8F8D98] uppercase tracking-wider mb-2">More detected elements</span>
                <span className="block text-2xl font-black text-[#121214]">
                  {totalFor('A') === totalFor('B') ? 'Tie' : `Variant ${totalFor('A') > totalFor('B') ? 'A' : 'B'}`}
                </span>
              </div>
            </div>

            <div className="pt-8 border-t border-[#E6E4DE]">
              <h2 className="text-2xl font-bold tracking-tight text-[#121214] mb-6">Ready to improve the design?</h2>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button onClick={() => navigate('/analyze')} className="px-6 py-3 bg-[#121214] text-white rounded-xl text-sm font-bold hover:bg-[#25252A] transition-colors shadow-sm">Analyze a Thumbnail</button>
                <button className="px-6 py-3 bg-white border border-[#E6E4DE] text-[#121214] rounded-xl text-sm font-bold hover:bg-[#FAF9F5] transition-colors shadow-sm">Open Thumbnail Editor</button>
                <button onClick={() => navigate('/analytics')} className="px-6 py-3 bg-white border border-[#E6E4DE] text-[#121214] rounded-xl text-sm font-bold hover:bg-[#FAF9F5] transition-colors shadow-sm">View Analytics</button>
              </div>
            </div>
          </div>

        </main>
      )}
    </div>
  );
};
