import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppNavbar } from "../components/AppNavbar";
import { useAuth } from "../context/AuthContext";
import { Check, Loader2, Save, ArrowLeft, User } from "lucide-react";
import { API_BASE } from "../lib/api";

const CATEGORIES = [
  "Education", "Gaming", "Tech & Science", "Entertainment",
  "Vlog / Lifestyle", "Finance & Business", "Health & Fitness",
  "Food & Cooking", "Travel", "Music", "DIY & Crafts",
  "News & Politics", "Comedy", "Beauty & Fashion", "Sports",
];

export const CreatorProfile: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [channelName, setChannelName] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetch(`${API_BASE}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.profile) {
          setChannelName(json.profile.channel_name ?? "");
          setCategory(json.profile.video_category ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ channel_name: channelName, video_category: category }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5]">
      <AppNavbar />
      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-[#71717A] hover:text-[#121214] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-[#7C3AED] mb-3">
            <User className="w-3.5 h-3.5" /> Creator Profile
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#121214]">
            Your channel info
          </h1>
          <p className="mt-2 text-[#52525B]">
            Iris uses this to personalise your thumbnail insights.
          </p>
        </div>

        <div className="bg-white border border-[#E6E4DE] rounded-3xl shadow-sm p-8 sm:p-10 space-y-8">

          <div>
            <label className="block text-sm font-bold text-[#121214] mb-1">Channel Name</label>
            <p className="text-xs text-[#71717A] mb-3">Your YouTube channel name</p>
            <input
              type="text"
              placeholder="e.g. TechWithNash"
              value={channelName}
              onChange={e => setChannelName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#E6E4DE] bg-[#FAF9F5] text-[#121214] text-sm placeholder-[#A1A1AA] focus:outline-none focus:border-[#121214] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#121214] mb-1">Channel Category</label>
            <p className="text-xs text-[#71717A] mb-3">Pick the one that fits best</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCategory(category === opt ? "" : opt)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                    category === opt
                      ? "bg-[#121214] text-white border-[#121214] shadow-sm scale-[1.03]"
                      : "bg-white text-[#52525B] border-[#E6E4DE] hover:border-[#121214] hover:text-[#121214]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {saveError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {saveError}
            </div>
          )}

          <div className="flex items-center justify-end pt-4 border-t border-[#E6E4DE]">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-60 ${
                saved
                  ? "bg-emerald-600 text-white"
                  : "bg-[#121214] text-white hover:bg-[#3F3F47]"
              }`}
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                : saved
                ? <><Check className="w-4 h-4" /> Saved!</>
                : <><Save className="w-4 h-4" /> Save Profile</>
              }
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};
