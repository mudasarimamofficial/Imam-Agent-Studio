"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/layout/TopNav';
import { 
  ArrowLeft, ArrowRight, Save, Sparkles, Loader2, Play, 
  Settings, Mail, MessageSquare, Target, User
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Basics', icon: Settings },
  { id: 2, label: 'Targeting', icon: Target },
  { id: 3, label: 'Agency Profile', icon: User },
  { id: 4, label: 'Templates', icon: Mail },
  { id: 5, label: 'Delivery', icon: Settings },
];

export default function CampaignWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [maxLeads, setMaxLeads] = useState(30);

  const [agencyName, setAgencyName] = useState("ShuMuz Labs");
  const [agencyEmail, setAgencyEmail] = useState("onboarding@resend.dev");
  const [agencyWebsite, setAgencyWebsite] = useState("https://shumuzlabs.com");

  const [emailSubject, setEmailSubject] = useState("quick observation about {{business_name}} website speed");
  const [emailBody, setEmailBody] = useState("Hi,\n\nI was looking at your site {{website_url}} and noticed some performance suggestions.\n\nBest,\n{{agent_name}}");
  const [whatsappBody, setWhatsappBody] = useState("Hi, I had a quick speed audit question for {{business_name}}.");
  const [instagramBody, setInstagramBody] = useState("Hi, checked out your site {{website_url}} and wanted to suggest a performance boost.");

  const [channels, setChannels] = useState<string[]>(["email"]);
  const [autoApprove, setAutoApprove] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(50);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);
  const [timezone, setTimezone] = useState("GMT+5");

  // AI assistant state
  const [aiLoading, setAiLoading] = useState(false);

  const handleGenerateTemplate = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/campaigns/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location, agencyName }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setEmailSubject(json.data.email?.subject || emailSubject);
        setEmailBody(json.data.email?.body || emailBody);
        setWhatsappBody(json.data.whatsapp || whatsappBody);
        setInstagramBody(json.data.instagram || instagramBody);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        query,
        location,
        max_leads: maxLeads,
        agency_profile: { name: agencyName, email: agencyEmail, website: agencyWebsite },
        templates: {
          email: { subject: emailSubject, body: emailBody },
          whatsapp: whatsappBody,
          instagram: instagramBody
        },
        delivery_settings: {
          channels,
          autoApprove,
          dailyLimit,
          sendWindow: { startHour, endHour, timezone }
        }
      };

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        router.push('/campaigns');
      } else {
        alert(json.error?.message || "Failed to create campaign");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleChannel = (c: string) => {
    if (channels.includes(c)) {
      setChannels(channels.filter(x => x !== c));
    } else {
      setChannels([...channels, c]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <TopNav title="Campaign Wizard" tabs={['Create New Campaign']} activeTab="Create New Campaign" />

      {/* Progress HUD */}
      <div className="shrink-0 glass-panel border-b border-cyber-border/40 py-4 px-6 bg-surface-elevated/40 relative z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = step === s.id;
            const passed = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-xs ${
                  active ? 'border-primary bg-primary text-on-primary-fixed font-bold' :
                  passed ? 'border-primary text-primary bg-primary/10' :
                  'border-cyber-border text-on-surface-variant'
                }`}>
                  {passed ? '✓' : s.id}
                </div>
                <span className={`text-xs font-mono tracking-wide hidden md:inline-block ${
                  active ? 'text-on-surface font-semibold' : 'text-on-surface-variant'
                }`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-2xl mx-auto glass-panel border-surface-border p-6 md:p-8 space-y-6">
          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-on-surface">Campaign Identity</h3>
              <p className="text-xs text-on-surface-variant font-mono">Give this automated prospecting pipeline a clear name and goal.</p>
              
              <div>
                <label htmlFor="camp-name" className="text-xs font-medium text-on-surface block mb-1">Campaign Name</label>
                <input
                  id="camp-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Karachi E-commerce Core Web Vitals Pitch"
                  className="w-full bg-surface-container border border-cyber-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="camp-desc" className="text-xs font-medium text-on-surface block mb-1">Description</label>
                <textarea
                  id="camp-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe target market segments or pitch rationale..."
                  className="w-full bg-surface-container border border-cyber-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Targeting */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-on-surface">Target Search Settings</h3>
              <p className="text-xs text-on-surface-variant font-mono">Input parameters for the autonomous Client Hunting query.</p>

              <div>
                <label htmlFor="camp-query" className="text-xs font-medium text-on-surface block mb-1">Lead Search Query</label>
                <input
                  id="camp-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Restaurants or Boutiques"
                  className="w-full bg-surface-container border border-cyber-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="camp-loc" className="text-xs font-medium text-on-surface block mb-1">Target Location</label>
                <input
                  id="camp-loc"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Karachi or Lahore"
                  className="w-full bg-surface-container border border-cyber-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="camp-cap" className="text-xs font-medium text-on-surface block mb-2">Max Lead Pipeline Limit</label>
                <div className="flex items-center gap-4">
                  <input
                    id="camp-cap"
                    type="range"
                    min="5" max="100" step="5"
                    value={maxLeads}
                    onChange={(e) => setMaxLeads(parseInt(e.target.value))}
                    className="flex-1 accent-primary bg-surface-elevated h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-mono text-sm text-primary font-bold w-12 text-right">{maxLeads} leads</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Agency Profile */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-on-surface">Agency Sender Information</h3>
              <p className="text-xs text-on-surface-variant font-mono">Details included in cold outbox outreach email footers and signatures.</p>

              <div>
                <label htmlFor="agency-name" className="text-xs font-medium text-on-surface block mb-1">Agency Name</label>
                <input
                  id="agency-name"
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full bg-surface-container border border-cyber-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="agency-email" className="text-xs font-medium text-on-surface block mb-1">Outbox Sender Address</label>
                <input
                  id="agency-email"
                  type="email"
                  value={agencyEmail}
                  onChange={(e) => setAgencyEmail(e.target.value)}
                  className="w-full bg-surface-container border border-cyber-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="agency-web" className="text-xs font-medium text-on-surface block mb-1">Agency Website</label>
                <input
                  id="agency-web"
                  type="text"
                  value={agencyWebsite}
                  onChange={(e) => setAgencyWebsite(e.target.value)}
                  className="w-full bg-surface-container border border-cyber-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Step 4: Templates */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-on-surface">AI Outreach Templates</h3>
                <button
                  onClick={handleGenerateTemplate}
                  disabled={aiLoading || !query}
                  className="flex items-center gap-1 bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded hover:bg-primary/30 font-mono text-xs uppercase font-bold transition-all disabled:opacity-40"
                >
                  {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  Auto-Gen via Gemini
                </button>
              </div>
              <p className="text-xs text-on-surface-variant font-mono">Use tags like {"{{business_name}}"} and {"{{website_url}}"} to dynamically substitute lead details.</p>

              <div>
                <label htmlFor="tmpl-subject" className="text-xs font-mono text-on-surface-variant block mb-1">Email Subject Line</label>
                <input
                  id="tmpl-subject"
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-surface-container border border-cyber-border rounded px-3 py-2 text-xs text-on-surface font-mono outline-none focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="tmpl-body" className="text-xs font-mono text-on-surface-variant block mb-1">Email Body Layout</label>
                <textarea
                  id="tmpl-body"
                  rows={5}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full bg-surface-container border border-cyber-border rounded p-3 text-xs text-on-surface font-mono outline-none focus:border-primary resize-none"
                />
              </div>

              <div>
                <label htmlFor="tmpl-wa" className="text-xs font-mono text-on-surface-variant block mb-1">WhatsApp Text Copy</label>
                <textarea
                  id="tmpl-wa"
                  rows={2}
                  value={whatsappBody}
                  onChange={(e) => setWhatsappBody(e.target.value)}
                  className="w-full bg-surface-container border border-cyber-border rounded p-3 text-xs text-on-surface font-mono outline-none focus:border-secondary resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 5: Delivery */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-on-surface">Outbox Throttling &amp; Safe Send</h3>
              <p className="text-xs text-on-surface-variant font-mono">Configure limits and send windows to protect deliverability and reputations.</p>

              {/* Channels selector */}
              <div>
                <label className="text-xs font-medium text-on-surface block mb-2">Enabled Channels</label>
                <div className="flex gap-4">
                  {['email', 'whatsapp', 'instagram'].map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleChannel(c)}
                      className={`px-3 py-2 rounded-lg border font-mono text-xs uppercase font-bold transition-all ${
                        channels.includes(c) ? 'bg-primary text-on-primary-fixed border-primary' : 'bg-surface-elevated/40 border-cyber-border text-on-surface-variant'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Approve */}
              <div className="flex items-center justify-between p-3 border border-cyber-border rounded-lg bg-surface-container-low">
                <div>
                  <h4 className="text-sm font-semibold text-on-surface">Auto-Approve Outreach</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">Skip manual verification and deliver outreach instantly on brain generation.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
              </div>

              {/* Daily Limit */}
              <div>
                <label htmlFor="del-limit" className="text-xs font-medium text-on-surface block mb-1">Max Daily Send Cap</label>
                <input
                  id="del-limit"
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(parseInt(e.target.value))}
                  className="w-24 bg-surface-container border border-cyber-border rounded p-2 text-xs text-on-surface font-mono"
                />
              </div>

              {/* Time Window */}
              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div>
                  <label htmlFor="del-start" className="text-[10px] text-on-surface-variant uppercase block mb-1">Start Hour (0-23)</label>
                  <input
                    id="del-start"
                    type="number"
                    value={startHour}
                    onChange={(e) => setStartHour(parseInt(e.target.value))}
                    className="w-full bg-surface-container border border-cyber-border rounded p-2 text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label htmlFor="del-end" className="text-[10px] text-on-surface-variant uppercase block mb-1">End Hour (0-23)</label>
                  <input
                    id="del-end"
                    type="number"
                    value={endHour}
                    onChange={(e) => setEndHour(parseInt(e.target.value))}
                    className="w-full bg-surface-container border border-cyber-border rounded p-2 text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label htmlFor="del-tz" className="text-[10px] text-on-surface-variant uppercase block mb-1">Timezone</label>
                  <input
                    id="del-tz"
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-surface-container border border-cyber-border rounded p-2 text-xs text-on-surface"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between pt-4 border-t border-cyber-border/40">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="px-4 py-2 border border-cyber-border text-on-surface hover:bg-surface-elevated rounded transition-colors disabled:opacity-40 flex items-center gap-1 font-mono text-xs uppercase"
            >
              <ArrowLeft size={14} /> Back
            </button>

            {step === 5 ? (
              <button
                onClick={handleSave}
                disabled={saving || !name}
                className="px-6 py-2 bg-primary text-on-primary-fixed hover:brightness-110 font-mono text-xs uppercase font-bold rounded transition-all shadow-[0_4px_16px_-4px_rgba(var(--primary-rgb),0.4)] disabled:opacity-40 flex items-center gap-1.5"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Deploy Pipeline
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="px-5 py-2 bg-primary text-on-primary-fixed hover:brightness-110 font-mono text-xs uppercase font-bold rounded transition-all flex items-center gap-1"
              >
                Next <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
