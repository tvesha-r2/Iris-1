import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNavbar } from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import {
  Upload, RefreshCw, Activity, AlertCircle, Eye, LayoutGrid, Brain,
  MessageSquare, Lightbulb, Users, Type, Package, ChevronDown, ChevronUp,
} from 'lucide-react';
import gsap from 'gsap';
import { AttentionBudget } from './AttentionBudget';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { analyzeImage, generateAIInsights, getThumbnails, uploadImage } from '../lib/api';
import type { AnalysisResult, StoredImage } from '../lib/api';

gsap.registerPlugin(ScrollTrigger);

type AppState = 'empty' | 'uploaded' | 'analyzing' | 'results' | 'error';
type ViewMode = 'original' | 'heatmap';

const LOADING_STEPS = [
  'Detecting visual elements…',
  'Analysing faces and text…',
  'Computing saliency…',
  'Mapping visual attention…',
  'Generating heatmap…',
  'Requesting AI insights…',
];

// ─── Detection summary card ────────────────────────────────────────────────
function DetectionCard({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 bg-[#FAF9F5] border border-[#E6E4DE] rounded-2xl p-4 min-w-[90px]">
      <div className="text-[#8B5CF6]">{icon}</div>
      <span className="text-2xl font-bold text-[#121214] tabular-nums">{count}</span>
      <span className="text-xs font-semibold text-[#8F8D98] uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ─── AI Insights panel ────────────────────────────────────────────────────
function InsightsPanel({ insights }: { insights: AnalysisResult['insights'] }) {
  const [open, setOpen] = useState(true);

  if (!insights) {
    return (
      <div className="bg-[#FAF9F5] border border-[#E6E4DE] rounded-2xl p-4 text-sm text-[#8F8D98] italic">
        AI insights are temporarily unavailable.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E6E4DE] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-[#121214] hover:bg-[#FAF9F5] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[#8B5CF6]" />
          AI Insights
          <span className="text-[10px] font-semibold text-[#8F8D98] bg-[#FAF9F5] border border-[#E6E4DE] rounded-full px-2 py-0.5 ml-1">
            AI-GENERATED
          </span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-[#8F8D98]" /> : <ChevronDown className="w-4 h-4 text-[#8F8D98]" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-[#E6E4DE]">
          {/* Summary */}
          <div className="pt-4">
            <p className="text-sm text-[#4A4950] leading-relaxed">{insights.summary}</p>
          </div>

          {/* Attention observations */}
          <div>
            <h4 className="text-xs font-bold text-[#121214] uppercase tracking-widest mb-3">
              Attention Observations
            </h4>
            <ul className="space-y-2">
              {insights.attention_observations.map((obs, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-[#4A4950] leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shrink-0" />
                  {obs}
                </li>
              ))}
            </ul>
          </div>

          {/* Suggestions */}
          <div>
            <h4 className="text-xs font-bold text-[#121214] uppercase tracking-widest mb-3">
              Thumbnail Suggestions
            </h4>
            <ul className="space-y-2">
              {insights.thumbnail_suggestions.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-[#4A4950] leading-relaxed">
                  <span className="mt-0.5 shrink-0 text-[#8B5CF6] font-bold text-xs">
                    {i + 1}.
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Full results view ─────────────────────────────────────────────────────
function ResultsView({
  localPreview,
  result,
  onReset,
}: {
  localPreview: string;
  result: AnalysisResult;
  onReset: () => void;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap');
  const displayUrl = viewMode === 'heatmap' && result.overlay_url
    ? result.overlay_url
    : result.url || localPreview;

  return (
    <div className="relative flex flex-col items-center w-full gap-6">
      {/* Reset button */}
      <button
        onClick={onReset}
        className="z-50 px-6 py-2.5 bg-white border border-[#E6E4DE] text-[#121214] rounded-full text-sm font-bold
                   hover:bg-[#FAF9F5] transition-colors flex items-center gap-2 shadow-sm"
      >
        <RefreshCw className="w-4 h-4" />
        Analyse Another Thumbnail
      </button>

      <div className="w-full max-w-4xl mx-auto space-y-5">

        {/* Image comparison card */}
        <div className="bg-white border border-[#E6E4DE] rounded-3xl p-4 shadow-xl shadow-black/5">
          {/* Toggle */}
          <div className="flex items-center gap-1 mb-4 bg-[#FAF9F5] border border-[#E6E4DE] rounded-xl p-1 w-fit">
            <button
              onClick={() => setViewMode('original')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${viewMode === 'original'
                  ? 'bg-white text-[#121214] shadow-sm border border-[#E6E4DE]'
                  : 'text-[#8F8D98] hover:text-[#4A4950]'}`}
            >
              <Eye className="w-3.5 h-3.5" />
              Original
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              disabled={!result.overlay_url}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${viewMode === 'heatmap'
                  ? 'bg-white text-[#121214] shadow-sm border border-[#E6E4DE]'
                  : 'text-[#8F8D98] hover:text-[#4A4950]'}
                disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Attention Heatmap
            </button>
          </div>

          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden bg-[#121214] aspect-video flex items-center justify-center">
            <img
              key={displayUrl}
              src={displayUrl}
              alt={viewMode === 'heatmap' ? 'Predicted attention heatmap overlay' : 'Original thumbnail'}
              className="w-full h-full object-contain transition-opacity duration-300"
            />
            {/* Label badge */}
            <div className="absolute top-3 left-3">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full
                ${viewMode === 'heatmap'
                  ? 'bg-[#8B5CF6] text-white'
                  : 'bg-black/60 text-white backdrop-blur-sm'}`}>
                {viewMode === 'heatmap' ? 'Predicted Attention' : 'Original'}
              </span>
            </div>
          </div>

          {viewMode === 'heatmap' && (
            <p className="mt-3 text-xs text-[#8F8D98] text-center">
              Warm regions = high predicted visual attention · Cool regions = low attention
            </p>
          )}
        </div>

        {/* Detection summary */}
        <div className="bg-white border border-[#E6E4DE] rounded-3xl p-5 shadow-xl shadow-black/5">
          <h3 className="text-sm font-bold text-[#121214] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#8B5CF6]" />
            Detection Summary
          </h3>
          <div className="flex flex-wrap gap-3">
            <DetectionCard
              icon={<Type className="w-5 h-5" />}
              label="Text"
              count={result.detections.texts}
            />
            <DetectionCard
              icon={<Users className="w-5 h-5" />}
              label="Faces"
              count={result.detections.faces}
            />
            <DetectionCard
              icon={<Package className="w-5 h-5" />}
              label="Objects"
              count={result.detections.objects}
            />
          </div>
        </div>

        {/* AI insights */}
        <div className="shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
          <InsightsPanel insights={result.insights} />
        </div>

      </div>
    </div>
  );
}

// ─── Main Analyze page ─────────────────────────────────────────────────────
export const Analyze: React.FC = () => {
  const [appState, setAppState]         = useState<AppState>('empty');
  const [isDragging, setIsDragging]     = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [storedImage, setStoredImage] = useState<StoredImage | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError]   = useState<string | null>(null);
  const [loadingStep, setLoadingStep]   = useState(0);

  const pageRef            = useRef<HTMLDivElement>(null);
  const uploadZoneRef      = useRef<HTMLDivElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const stepTimerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const userInteractedRef  = useRef(false);

  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  // Page load animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.analyze-header', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
      gsap.fromTo('.analyze-title',  { opacity: 0, y: 20  }, { opacity: 1, y: 0, duration: 0.8, delay: 0.1, ease: 'power3.out' });
      gsap.fromTo('.upload-zone',    { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.8, delay: 0.3, ease: 'power3.out' });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    getThumbnails(token).then(thumbnails => {
      if (cancelled || userInteractedRef.current) return;
      const latest = thumbnails.find(thumbnail => thumbnail.url);
      if (!latest) return;

      const savedImage = {
        id: latest.id,
        url: latest.url,
        filename: latest.filename,
      };
      setStoredImage(savedImage);
      setLocalPreview(latest.url);

      const scores = latest.ai_scores ?? {};
      const hasAnalysis = latest.analysis_status === 'completed'
        || Boolean(latest.overlay_url)
        || Object.keys(scores).length > 0;
      if (hasAnalysis) {
        setAnalysisResult({
          id: latest.id,
          url: latest.url,
          overlay_url: latest.overlay_url ?? null,
          detections: latest.detections ?? {
            texts: scores.texts_detected ?? 0,
            faces: scores.faces_detected ?? 0,
            objects: scores.objects_detected ?? 0,
          },
          insights: latest.insights ?? null,
        });
        setAppState('results');
      } else {
        setAppState('uploaded');
      }
    }).catch(error => {
      if (!cancelled && !userInteractedRef.current) {
        setAnalysisError(error instanceof Error ? error.message : 'Could not load saved thumbnails.');
      }
    });

    return () => { cancelled = true; };
  }, [token]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (localPreview && localPreview.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  // ── Drag-and-drop ──────────────────────────────────────────────────────
  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); if (!isDragging) setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop      = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (file: File) => {
    userInteractedRef.current = true;
    // Validate image type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setAnalysisError('Please upload a PNG, JPG, or WEBP image.');
      return;
    }
    // Warn on very large files (>20 MB)
    if (file.size > 20 * 1024 * 1024) {
      setAnalysisError('File is too large. Please use an image under 20 MB.');
      return;
    }

    setAnalysisError(null);
    setAnalysisResult(null);
    setStoredImage(null);

    if (localPreview?.startsWith('blob:')) URL.revokeObjectURL(localPreview);
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setSelectedFile(file);

    gsap.to('.upload-zone', {
      opacity: 0, scale: 0.95, duration: 0.4,
      onComplete: () => {
        setAppState('uploaded');
        setTimeout(() => {
          gsap.fromTo('.analysis-workspace', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
        }, 50);
      },
    });
  };

  const loadSample = () => {
    userInteractedRef.current = true;
    const sampleUrl = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=1280&q=80';
    setLocalPreview(sampleUrl);
    setSelectedFile(null); // sample is URL-only, not a File
    setStoredImage(null);

    gsap.to('.upload-zone', {
      opacity: 0, scale: 0.95, duration: 0.4,
      onComplete: () => {
        setAppState('uploaded');
        setTimeout(() => {
          gsap.fromTo('.analysis-workspace', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
        }, 50);
      },
    });
  };

  // ── Real analysis call ─────────────────────────────────────────────────
  const startAnalysis = async () => {
    if (!selectedFile && !storedImage) {
      setAnalysisError('Please select a real image file to analyse (sample URLs cannot be sent to the backend).');
      return;
    }
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }

    setAnalysisError(null);
    setAppState('analyzing');
    setLoadingStep(0);

    // Cycle through loading step labels while the request runs
    let step = 0;
    stepTimerRef.current = setInterval(() => {
      step = (step + 1) % LOADING_STEPS.length;
      setLoadingStep(step);
    }, 1800);

    // Scanning animation
    gsap.fromTo('.analysis-scan-line',
      { top: '0%', opacity: 0 },
      { top: '100%', opacity: 1, duration: 2, ease: 'linear', repeat: -1, yoyo: true }
    );

    try {
      let imageReference = storedImage;
      if (!imageReference && selectedFile) {
        imageReference = await uploadImage(selectedFile, token);
        setStoredImage(imageReference);
      }
      if (!imageReference) {
        throw new Error('The image has not been stored yet. Please select it again and retry.');
      }

      const result = await analyzeImage(imageReference.id, token);
      clearInterval(stepTimerRef.current!);

      setAnalysisResult(result);

      gsap.to('.loading-overlay', {
        opacity: 0, duration: 0.4,
        onComplete: () => {
          setAppState('results');
          setTimeout(() => {
            if (resultsContainerRef.current) {
              gsap.fromTo(resultsContainerRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
              );
            }
          }, 50);
        },
      });
    } catch (err: any) {
      clearInterval(stepTimerRef.current!);
      setAnalysisError(err.message ?? 'Analysis failed. Please try again.');
      setAppState('uploaded');
    }
  };

  const resetToEmpty = () => {
    if (resultsContainerRef.current) {
      gsap.to(resultsContainerRef.current, {
        opacity: 0, y: 20, duration: 0.4,
        onComplete: () => {
          if (localPreview?.startsWith('blob:')) URL.revokeObjectURL(localPreview);
          setLocalPreview(null);
          setSelectedFile(null);
          setStoredImage(null);
          setAnalysisResult(null);
          setAnalysisError(null);
          setAppState('empty');
        },
      });
    } else {
      setLocalPreview(null);
      setSelectedFile(null);
      setStoredImage(null);
      setAnalysisResult(null);
      setAnalysisError(null);
      setAppState('empty');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div ref={pageRef} className="analyze-page min-h-screen bg-[#FAF9F5] text-[#121214] font-sans selection:bg-purple-100 selection:text-purple-900 pb-20">
      <AppNavbar />

      <main className="pt-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">

        {/* ── Empty state ─────────────────────────────────────────────── */}
        {appState === 'empty' && (
          <div className="flex flex-col items-center w-full">
            <div className="analyze-header text-center max-w-3xl mx-auto mb-10">
              <h1 className="analyze-title text-4xl md:text-5xl font-bold tracking-tight text-[#121214] mb-4">
                See what viewers see first.
              </h1>
            </div>

            {analysisError && (
              <div className="mb-6 max-w-lg w-full flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {analysisError}
              </div>
            )}

            <div
              ref={uploadZoneRef}
              className={`upload-zone relative w-full max-w-4xl mx-auto h-[400px] border-2 border-dashed rounded-3xl
                transition-all duration-300 flex flex-col items-center justify-center overflow-hidden bg-white group
                ${isDragging ? 'border-[#8B5CF6] bg-purple-50/50' : 'border-[#E6E4DE] hover:border-[#D5D3CC]'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Background decoration */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-[#8B5CF6] blur-3xl" />
                <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-orange-500 blur-3xl" />
              </div>

              <div className="z-10 text-center flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl bg-[#FAF9F5] border border-[#E6E4DE] flex items-center justify-center mb-6
                  text-[#4A4950] transition-transform duration-300 ${isDragging ? '-translate-y-2' : ''}`}>
                  <Upload className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-bold text-[#121214] mb-2">
                  {isDragging ? 'Drop to analyse' : 'Drop your thumbnail here'}
                </h3>
                <p className="text-[#4A4950] mb-8">or choose an image from your device</p>

                <label className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white
                  bg-[#121214] hover:bg-[#25252A] rounded-xl transition-colors cursor-pointer shadow-sm">
                  Upload Thumbnail
                  <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleFileInput} />
                </label>

                <p className="text-xs text-[#8F8D98] mt-4 font-medium tracking-wide">
                  PNG, JPG, WEBP · Recommended 1280 × 720
                </p>

                <button onClick={loadSample} className="mt-8 text-sm font-semibold text-[#8B5CF6] hover:text-[#7C3AED] transition-colors">
                  Try a sample thumbnail
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Uploaded (pre-analysis) state ───────────────────────────── */}
        {appState === 'uploaded' && (
          <div className="analysis-workspace w-full max-w-4xl mx-auto">
            {analysisError && (
              <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {analysisError}
              </div>
            )}

            <div className="bg-white border border-[#E6E4DE] rounded-3xl p-4 shadow-xl shadow-black/5">
              <div className="relative rounded-2xl overflow-hidden bg-[#121214] aspect-video flex items-center justify-center">
                <img src={localPreview!} alt="Thumbnail preview" className="w-full h-full object-contain" />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#121214]">
                    {selectedFile?.name ?? storedImage?.filename ?? 'sample-thumbnail.jpg'}
                  </span>
                  <span className="text-xs text-[#8F8D98] font-medium">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(0)} KB`
                      : storedImage
                        ? 'Saved image · click Analyse to continue'
                        : 'Sample image · click Analyse to use a real file'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setAppState('empty');
                      setAnalysisError(null);
                      setLocalPreview(null);
                      setSelectedFile(null);
                      setStoredImage(null);
                    }}
                    className="px-4 py-2 text-sm font-semibold text-[#4A4950] hover:text-[#121214] hover:bg-[#FAF9F5] rounded-xl transition-colors"
                  >
                    Remove
                  </button>
                  <button
                    onClick={startAnalysis}
                    disabled={!selectedFile && !storedImage}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white
                      bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-xl transition-colors shadow-md shadow-purple-500/20
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!selectedFile && !storedImage ? 'Upload a real image file to analyse' : 'Analyse thumbnail'}
                  >
                    <Activity className="w-4 h-4" />
                    Analyse Thumbnail
                  </button>
                </div>
              </div>

              {!selectedFile && !storedImage && (
                <p className="mt-3 text-xs text-[#8F8D98] text-center">
                  Sample thumbnails can be previewed but must be uploaded as a file to run analysis.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Analysing (loading) state ────────────────────────────────── */}
        {appState === 'analyzing' && (
          <div className="analysis-workspace w-full max-w-4xl mx-auto relative">
            <div className="bg-white border border-[#E6E4DE] rounded-3xl p-4 shadow-xl shadow-black/5 relative overflow-hidden loading-overlay">
              <div className="relative rounded-2xl overflow-hidden bg-[#121214] aspect-video">
                <img src={localPreview!} alt="Analysing" className="w-full h-full object-contain opacity-60" />

                {/* Scanning line */}
                <div className="analysis-scan-line absolute left-0 w-full h-32 bg-gradient-to-b from-transparent via-[#8B5CF6]/30 to-[#8B5CF6]/80 border-b border-[#8B5CF6] blur-sm z-10 -translate-y-full" />

                {/* Centred status */}
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-6 shadow-2xl">
                    <Activity className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <p className="text-sm font-semibold text-white animate-pulse min-h-[20px]">
                    {LOADING_STEPS[loadingStep]}
                  </p>
                  <p className="text-xs text-white/50 mt-2">This may take 20–60 seconds</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Results state ────────────────────────────────────────────── */}
        <div ref={resultsContainerRef} className={`w-full ${appState === 'results' ? 'block' : 'hidden'}`}>
          {appState === 'results' && analysisResult && (
            <div className="relative flex flex-col items-center w-full gap-6">

              <div className="flex gap-4 z-50">
                {/* Reset button */}
                <button
                  onClick={resetToEmpty}
                  className="px-6 py-2.5 bg-white border border-[#E6E4DE] text-[#121214] rounded-full text-sm font-bold
                             hover:bg-[#FAF9F5] transition-colors flex items-center gap-2 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Analyse Another Thumbnail
                </button>
                
                {/* AI Insights trigger button */}
                {!analysisResult.insights && (
                  <button
                    onClick={async () => {
                      try {
                        if (!token) throw new Error("Not authenticated");
                        
                        const btn = document.getElementById('ai-btn') as HTMLButtonElement | null;
                        if (btn) { btn.textContent = 'Generating...'; btn.disabled = true; }
                        
                        const insights = await generateAIInsights(analysisResult.id, token);
                        setAnalysisResult(prev => prev ? { ...prev, insights } : null);
                      } catch (err: any) {
                        alert(err.message || "AI Insights are temporarily unavailable.");
                        const btn = document.getElementById('ai-btn') as HTMLButtonElement | null;
                        if (btn) { btn.textContent = 'Generate AI Analysis'; btn.disabled = false; }
                      }
                    }}
                    id="ai-btn"
                    className="px-6 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white rounded-full text-sm font-bold
                               hover:shadow-lg hover:shadow-[#8B5CF6]/20 transition-all flex items-center gap-2"
                  >
                    <Brain className="w-4 h-4" />
                    Generate AI Analysis
                  </button>
                )}
              </div>

              {/* Full AttentionBudget analytics page with real heatmap overlay */}
              <div className="w-full">
                <AttentionBudget
                  isEmbedded={true}
                  imageUrl={analysisResult.url || localPreview || undefined}
                  overlayUrl={analysisResult.overlay_url}
                  insights={analysisResult.insights}
                />
              </div>

            </div>
          )}
        </div>

        {/* ── Error state (hard failure) ───────────────────────────────── */}
        {appState === 'error' && (
          <div className="flex flex-col items-center gap-6 mt-20">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#121214] mb-1">Analysis failed</h3>
              <p className="text-sm text-[#8F8D98]">{analysisError}</p>
            </div>
            <button
              onClick={resetToEmpty}
              className="px-6 py-2.5 bg-[#121214] text-white rounded-xl text-sm font-semibold hover:bg-[#25252A] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

      </main>
    </div>
  );
};
