"use client";
import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import TagInput from "@/components/ui/TagInput";
import { mockBrandProfile } from "@/lib/mock-data";

function ConnectButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/social/connect", { method: "POST" });
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError(data.error ?? "Failed to connect.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="shrink-0 text-right">
      <Button variant="primary" onClick={handleConnect} loading={loading}>
        {loading ? "Redirecting…" : "Connect →"}
      </Button>
      {error && <p className="text-[11px] text-error mt-1">{error}</p>}
    </div>
  );
}

const industryOptions = [
  { value: "", label: "Select industry..." },
  { value: "medspa", label: "Medical Spa" },
  { value: "beauty", label: "Beauty & Cosmetics" },
  { value: "fitness", label: "Fitness & Wellness" },
  { value: "coaching", label: "Coaching" },
  { value: "agency", label: "Agency" },
  { value: "retail", label: "Retail" },
  { value: "restaurant", label: "Restaurant & Food" },
  { value: "other", label: "Other" },
];

const toneOptions = ["Friendly", "Professional", "Playful", "Authoritative", "Luxe", "Bold", "Warm", "Minimalist"];

type SaveState = "idle" | "saving" | "saved";

export default function BrandSetupPage() {
  const [formData, setFormData] = useState(mockBrandProfile);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSaveState("idle");
  };

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("autom8_brand_draft", JSON.stringify(formData));
    }, 500);
    return () => clearTimeout(timer);
  }, [formData]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.businessName) newErrors.businessName = "Business name is required.";
    if (!formData.industry) newErrors.industry = "Please select an industry.";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    setErrors({});
    setSaveState("saving");
    await new Promise((r) => setTimeout(r, 800));
    setSaveState("saved");
  };

  const updateService = (i: number, field: "name" | "priceRange", value: string) => {
    const next = [...formData.services];
    next[i] = { ...next[i], [field]: value };
    set("services", next);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Brand Setup</h1>
        <div className="flex items-center gap-3">
          {saveState === "saving" && <span className="text-xs text-white/40 animate-pulse">Saving...</span>}
          {saveState === "saved" && <span className="text-xs text-neon">✓ Saved</span>}
          <Button variant="primary" onClick={handleSave} loading={saveState === "saving"}>
            Save Profile
          </Button>
        </div>
      </div>

      {/* Section 1: Business Info */}
      <Card header={<h2 className="font-semibold">Business Information</h2>}>
        <div className="space-y-4">
          <Input
            label="Business Name *"
            value={formData.businessName}
            onChange={(e) => set("businessName", e.target.value)}
            error={errors.businessName}
            placeholder="Your business name"
          />
          <Select
            label="Industry *"
            value={formData.industry}
            onChange={(e) => set("industry", e.target.value)}
            options={industryOptions}
            error={errors.industry}
          />
          <Input
            label="Website URL"
            type="url"
            value={formData.websiteUrl}
            onChange={(e) => set("websiteUrl", e.target.value)}
            placeholder="https://yourbusiness.com"
          />
          <Textarea
            label="Business Description"
            value={formData.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={500}
            placeholder="Describe what your business does, who you serve..."
          />
        </div>
      </Card>

      {/* Section 2: Brand Voice */}
      <Card header={<h2 className="font-semibold">Brand Voice & Tone</h2>}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white/80 block mb-2">Tone</label>
            <div className="flex flex-wrap gap-2">
              {toneOptions.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => {
                    const selected = formData.tones.includes(tone)
                      ? formData.tones.filter((t) => t !== tone)
                      : [...formData.tones, tone];
                    set("tones", selected);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    formData.tones.includes(tone)
                      ? "bg-brand-purple/20 border-brand-purple text-brand-purple"
                      : "border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            label="Custom Tone Notes"
            value={formData.customToneNotes}
            onChange={(e) => set("customToneNotes", e.target.value)}
            maxLength={300}
            placeholder="Additional tone guidance for the AI..."
          />
        </div>
      </Card>

      {/* Section 3: Services */}
      <Card header={
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Services & Pricing</h2>
          <button
            type="button"
            onClick={() => set("services", [...formData.services, { name: "", priceRange: "" }])}
            className="text-xs text-brand-purple hover:underline"
          >
            + Add Service
          </button>
        </div>
      }>
        <div className="space-y-3">
          {formData.services.map((svc, i) => (
            <div key={i} className="flex gap-3 items-start">
              <Input
                placeholder="Service name"
                value={svc.name}
                onChange={(e) => updateService(i, "name", e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Price / range"
                value={svc.priceRange}
                onChange={(e) => updateService(i, "priceRange", e.target.value)}
                className="w-32"
              />
              <button
                type="button"
                onClick={() => set("services", formData.services.filter((_, j) => j !== i))}
                className="mt-2 text-white/20 hover:text-brand-pink transition-colors text-lg"
              >
                ×
              </button>
            </div>
          ))}
          {formData.services.length === 0 && (
            <p className="text-sm text-white/30 text-center py-4">No services added yet</p>
          )}
        </div>
      </Card>

      {/* Section 4: CTA Keywords */}
      <Card header={<h2 className="font-semibold">CTA Keywords</h2>}>
        <p className="text-xs text-white/40 mb-3">Comments containing these words will trigger a call-to-action response.</p>
        <TagInput
          value={formData.ctaKeywords}
          onChange={(tags) => set("ctaKeywords", tags)}
          placeholder="price, book, available, how much..."
          maxTags={30}
        />
      </Card>

      {/* Section 5: Escalation Rules */}
      <Card header={<h2 className="font-semibold">Escalation Rules</h2>}>
        <p className="text-xs text-white/40 mb-3">Topics the AI should NOT handle — escalate to your team instead.</p>
        <Textarea
          value={formData.escalationRules}
          onChange={(e) => set("escalationRules", e.target.value)}
          placeholder="e.g. Medical diagnoses, complaints, refund requests..."
          maxLength={1000}
        />
      </Card>

      {/* Connect Facebook & Instagram */}
      <Card className="border-dashed border-primary/20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-medium mb-1 text-text-primary">Connect Facebook & Instagram</h3>
            <p className="text-sm text-text-muted">Link your Meta Business account to start automating replies.</p>
          </div>
          <ConnectButton />
        </div>
      </Card>
    </div>
  );
}
