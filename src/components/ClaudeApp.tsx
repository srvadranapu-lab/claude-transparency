import { useState, useRef, useEffect } from "react";
import {
  Plus,
  MessageSquare,
  Archive,
  Sparkles,
  Code2,
  SlidersHorizontal,
  Search,
  Download,
  ChevronsUpDown,
} from "lucide-react";
import claudeLogo from "@/assets/claude-logo.png";

type Depth = "Beginner" | "Standard" | "Advanced";
type PanelState = "idle" | "compiling" | "ready_collapsed" | "expanded";

interface SignalSet {
  assumptions: string;
  confidence: string;
  verify: string;
  fork: string;
  advAssumptions: string;
  advConfidence: string;
  advVerify: string;
  advFork: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  signals?: SignalSet;
  panelState: PanelState;
  showDepthModal: boolean;
  perFeedback: { assumptions: string | null; confidence: string | null; verify: string | null; fork: string | null };
  panelFeedback: string | null;
}

const PROMPTS = [
  "Should I invest in solar panels for my home?",
  "Is remote work actually more productive?",
  "Should I start a small business right now?",
];

const ANSWERS: Record<string, string> = {
  [PROMPTS[0]]:
    "Solar panels can be a strong financial decision depending on your location, roof condition, energy usage, and available incentives. In regions with high electricity rates and good sun exposure, the payback period typically ranges from 6 to 10 years, after which the energy savings are essentially pure return. Government subsidies and net metering policies significantly affect the economics — in India, the PM Surya Ghar scheme currently offers subsidies for rooftop installations that reduce upfront cost substantially. The main risks are roof suitability, installer quality, and whether you plan to stay in the property long enough to recoup the investment. If you own your home and your monthly electricity bill exceeds ₹3,000, the case for solar is generally strong.",
  [PROMPTS[1]]:
    "The evidence on remote work productivity is genuinely mixed and depends heavily on the type of work, the individual, and how the organisation is structured. For deep, focused, individual work — writing, coding, analysis — remote settings consistently show equal or higher output compared to office environments, largely because interruptions are reduced. For highly collaborative work, new employee onboarding, and tasks requiring rapid iterative feedback, co-location tends to outperform. The most important variable is often not location but autonomy and clarity of expectations. Workers with high autonomy and clear goals perform well remotely. Workers in ambiguous roles or early in their careers tend to struggle more. Hybrid arrangements with structured in-person time for collaboration and remote time for deep work appear to outperform both extremes in most studies.",
  [PROMPTS[2]]:
    "The right time to start a business is rarely about macroeconomic timing and almost always about whether you have a specific problem you understand deeply, a customer who needs it solved, and enough runway to reach your first paying customer. That said, current conditions in India are relatively favourable for first-time founders — GST registration is simpler than it was five years ago, digital payment infrastructure is mature, and the cost of building and distributing a product has dropped significantly. The genuine risks right now are compressed consumer discretionary spending in some categories and higher interest rates making working capital loans more expensive. The most honest question to ask is not whether the market conditions are right but whether you have identified a specific underserved need — because businesses that solve real, specific problems find customers in most economic environments.",
};

const SIGNALS: Record<string, SignalSet> = {
  [PROMPTS[0]]: {
    assumptions:
      "I assumed you own your home outright or have the structural right to install panels, that you are based in India where the PM Surya Ghar subsidy applies, and that your primary motivation is financial rather than environmental. If any of these are wrong — particularly if you are renting, in a high-rise, or evaluating this for environmental reasons on a short tenure — the calculus changes significantly.",
    advAssumptions:
      "In advanced mode, also note that the subsidy disbursement timeline can affect your cash flow planning significantly even if eligibility is confirmed.",
    confidence:
      "My payback period range of 6 to 10 years is accurate for typical cases but has high variance. Your actual payback depends on your exact electricity tariff, local solar irradiance, installer pricing, and whether net metering is available from your DISCOM. I cannot give you a reliable specific number without those inputs.",
    advConfidence:
      "Advanced note: the DISCOM net metering approval process is the single most variable factor in Indian solar ROI and the one most frequently underestimated by installers.",
    verify:
      "Before committing to an installer, verify the subsidy eligibility criteria with your state electricity board directly — the PM Surya Ghar portal has had processing delays and eligibility rules vary by state. Get at least three quotes from MNRE-empanelled installers. Do not prepay in full before installation is complete.",
    advVerify:
      "Advanced note: check whether your housing society bylaws or apartment association rules restrict rooftop installations before proceeding.",
    fork:
      "I considered framing this as a financial ROI calculation with specific numbers, but without knowing your location, roof size, and current tariff rate, any specific number would have been false precision. I chose directional guidance over spurious specificity.",
    advFork:
      "This fork decision reflects a deliberate choice to prioritise epistemic honesty over surface-level confidence — a trade-off that may feel less satisfying but is more reliable.",
  },
  [PROMPTS[1]]: {
    assumptions:
      "I assumed you are asking about knowledge work — not manufacturing, retail, or field roles where remote work is structurally impossible. I also assumed the question is about individual or team productivity, not organisational coordination costs, which are a separate and less favourable part of the remote work calculus.",
    advAssumptions:
      "In advanced mode, note that remote work productivity effects also vary by demographic — early-career employees and those with caregiving responsibilities show the widest performance variance.",
    confidence:
      "The research base here is genuinely contested. Many studies were conducted during pandemic-era forced remote work, which is not comparable to voluntary hybrid arrangements. I am confident about the directional pattern — focused work benefits, collaborative work does not — but I would not cite a specific productivity percentage with confidence.",
    advConfidence:
      "Advanced note: measuring your own productivity honestly over a 4-week remote trial with objective metrics is more informative than any published study.",
    verify:
      "If you are making a policy decision — for a team or organisation — do not rely on general research. Run a structured 90-day experiment with clear metrics defined in advance. The variance between teams and organisations is large enough that general findings may not apply to your specific context.",
    advVerify:
      "Advanced note: if you are a manager evaluating this for your team, measure output quality not activity metrics — the latter actively incentivise the wrong behaviours in remote settings.",
    fork:
      "I considered citing specific productivity percentage studies, but the variance across studies is too large for any single figure to be honest. I chose to describe the pattern of evidence rather than a number that would feel more authoritative but be less accurate.",
    advFork:
      "This fork decision reflects a deliberate choice to prioritise epistemic honesty over surface-level confidence — a trade-off that may feel less satisfying but is more reliable.",
  },
  [PROMPTS[2]]: {
    assumptions:
      "I assumed you are considering starting a business in India and that you are in the early ideation stage, not already operating. I also assumed this is not a capital-intensive manufacturing or infrastructure business — the advice changes substantially for those categories. If you have a specific sector in mind, the relevant risks and opportunities are quite different from what I described.",
    advAssumptions:
      "In advanced mode, note that the single most predictive factor in early business survival is not the idea quality but the founder's ability to sell — which is worth honestly self-assessing before committing.",
    confidence:
      "My read on current conditions in India is based on general macroeconomic indicators and policy changes. I do not have visibility into your specific sector, city, or customer segment — all of which matter more than the national business environment. The statement that conditions are 'relatively favourable' is directionally honest but may not hold for your specific idea.",
    advConfidence:
      "Advanced note: your confidence gap is largest in customer acquisition cost estimation — most first-time founders underestimate this by 3 to 5x.",
    verify:
      "Before registering or investing, speak to at least five people who would be your target customer and ask them to describe the problem you are solving in their own words. If they cannot describe the problem clearly without prompting, the market need may not be as strong as it appears. This validation step costs nothing and eliminates the most common reason early businesses fail.",
    advVerify:
      "Advanced note: the regulatory environment for your specific sector matters more than general ease-of-doing-business scores — check MCA21 and sector-specific licensing requirements directly.",
    fork:
      "I considered advising against starting a business given macroeconomic uncertainty, but that framing would have been paternalistic without knowing your specific idea. I chose to reframe the question toward the variable that actually predicts success — problem specificity — rather than market timing.",
    advFork:
      "This fork decision reflects a deliberate choice to prioritise epistemic honesty over surface-level confidence — a trade-off that may feel less satisfying but is more reliable.",
  },
};

const CUSTOM_ANSWER =
  "That's a nuanced question. Based on what you've shared, there are a few things worth considering before forming a view. The answer likely depends on factors specific to your situation that I don't have full visibility into. I've tried to give you the most useful framing I can with the information available — but treat this as a starting point for your own thinking, not a conclusion.";

const CUSTOM_PLACEHOLDER =
  "Signals generated based on your specific query — assumptions and gaps will vary depending on what additional context you provide.";

const customSignals: SignalSet = {
  assumptions: CUSTOM_PLACEHOLDER,
  confidence: CUSTOM_PLACEHOLDER,
  verify: CUSTOM_PLACEHOLDER,
  fork: CUSTOM_PLACEHOLDER,
  advAssumptions: "",
  advConfidence: "",
  advVerify: "",
  advFork: "",
};

function firstTwoSentences(t: string) {
  const m = t.match(/^[^.!?]*[.!?]+[\s]*[^.!?]*[.!?]+/);
  return m ? m[0].trim() : t;
}

function TypingDots() {
  return (
    <div className="inline-flex items-center gap-1 px-4 py-3 rounded-2xl bg-[#F2F1EE]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </div>
  );
}

function FeedbackPair({
  value,
  onPick,
  labels = ["Useful", "Not relevant"],
}: {
  value: string | null;
  onPick: (v: string) => void;
  labels?: [string, string] | string[];
}) {
  const [a, b] = labels;
  return (
    <div className="flex gap-2 mt-2">
      {[a, b].map((label) => {
        const picked = value === label;
        const faded = value !== null && !picked;
        const isPositive = label === a;
        const bg = picked ? (isPositive ? "#185FA5" : "#6B7280") : "#fff";
        const color = picked ? "#fff" : "#374151";
        return (
          <button
            key={label}
            disabled={value !== null}
            onClick={() => onPick(label)}
            className="rounded-md border transition"
            style={{
              height: 26,
              fontSize: 11,
              padding: "0 10px",
              borderColor: "#E5E7EB",
              background: bg,
              color,
              opacity: faded ? 0.4 : 1,
              cursor: value !== null ? "default" : "pointer",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function SignalBlock({
  tagLabel,
  tagBg,
  tagColor,
  text,
  feedback,
  onFeedback,
}: {
  tagLabel: string;
  tagBg: string;
  tagColor: string;
  text: string;
  feedback: string | null;
  onFeedback: (v: string) => void;
}) {
  return (
    <div className="mb-4">
      <span
        className="inline-block rounded-full"
        style={{
          background: tagBg,
          color: tagColor,
          fontSize: 11,
          padding: "2px 10px",
        }}
      >
        {tagLabel}
      </span>
      <p className="mt-2" style={{ fontSize: 13, color: "#374151", lineHeight: 1.55 }}>
        {text}
      </p>
      <FeedbackPair value={feedback} onPick={onFeedback} />
    </div>
  );
}

function DepthModal({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (d: Depth) => void;
}) {
  const [sel, setSel] = useState<Depth>("Standard");
  const descs: Record<Depth, string> = {
    Beginner:
      "Plain-language summary of the most important assumption and verification point. Best when you want a quick sanity check.",
    Standard:
      "Balanced view: assumptions, key uncertainties, and the specific section to verify. Recommended for most high-stakes tasks.",
    Advanced:
      "Full audit including alternatives considered, confidence calibration, and jurisdiction- or domain-specific caveats.",
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.3)" }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl"
        style={{ width: 420, padding: 28 }}
      >
        <div className="flex items-start justify-between">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>
            Signal depth — how much detail do you want?
          </h3>
          <button
            onClick={onCancel}
            style={{ color: "#6B7280", fontSize: 18, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <div
          className="mt-4 flex rounded-xl overflow-hidden"
          style={{ border: "1px solid #E5E7EB", height: 44 }}
        >
          {(["Beginner", "Standard", "Advanced"] as Depth[]).map((d) => {
            const active = sel === d;
            return (
              <button
                key={d}
                onClick={() => setSel(d)}
                className="flex-1 transition"
                style={{
                  background: active ? "#fff" : "transparent",
                  color: active ? "#185FA5" : "#6B7280",
                  fontWeight: active ? 500 : 400,
                  fontSize: 13,
                  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
        <div
          className="rounded-lg"
          style={{
            background: "#F3F4F6",
            padding: 14,
            marginTop: 16,
            fontSize: 14,
            color: "#374151",
            minHeight: 72,
          }}
        >
          {descs[sel]}
        </div>
        <div className="flex justify-end gap-3" style={{ marginTop: 24 }}>
          <button
            onClick={onCancel}
            className="rounded-lg"
            style={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              fontSize: 13,
              color: "#374151",
              height: 40,
              padding: "0 20px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(sel)}
            className="rounded-lg"
            style={{
              background: "#185FA5",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              height: 40,
              padding: "0 20px",
            }}
          >
            Save preference
          </button>
        </div>
      </div>
    </div>
  );
}

function ReasoningPanel({
  msg,
  depthPreference,
  onSetDepth,
  onUpdate,
}: {
  msg: Message;
  depthPreference: Depth | null;
  onSetDepth: (d: Depth) => void;
  onUpdate: (patch: Partial<Message>) => void;
}) {
  const { panelState, signals, showDepthModal, perFeedback, panelFeedback } = msg;

  if (panelState === "compiling") {
    return (
      <div
        className="flex items-center gap-2 mt-3 rounded-r"
        style={{
          height: 40,
          background: "#F8FBFF",
          borderLeft: "3px solid #D1D5DB",
          padding: "0 12px",
        }}
      >
        <span style={{ color: "#9CA3AF" }}>◈</span>
        <span style={{ fontSize: 12, color: "#9CA3AF" }}>Reasoning audit</span>
        <span className="inline-flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block w-1 h-1 rounded-full"
              style={{
                background: "#9CA3AF",
                animation: `dotPulse 1.2s ${i * 0.3}s infinite`,
              }}
            />
          ))}
        </span>
      </div>
    );
  }

  const headerRow = (
    <div
      className="flex items-center gap-2 cursor-pointer rounded-r transition"
      style={{
        height: 40,
        background: "#F8FBFF",
        borderLeft: "3px solid #185FA5",
        padding: "0 12px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#F8FBFF")}
      onClick={() => {
        if (depthPreference === null) {
          onUpdate({ showDepthModal: true });
        } else {
          onUpdate({
            panelState: panelState === "expanded" ? "ready_collapsed" : "expanded",
          });
        }
      }}
    >
      <span style={{ color: "#185FA5" }}>◈</span>
      <span style={{ fontSize: 12, color: "#185FA5", fontWeight: 500 }}>
        Reasoning audit · 3 signals
      </span>
      <span style={{ color: "#9CA3AF", fontSize: 12 }}>·</span>
      <span style={{ fontSize: 12, color: "#9CA3AF" }}>
        {panelState === "expanded" ? "tap to collapse" : "tap to expand"}
      </span>
      <span className="ml-auto" style={{ color: "#9CA3AF" }}>
        {panelState === "expanded" ? "▴" : "▾"}
      </span>
    </div>
  );

  const depth: Depth = depthPreference ?? "Standard";
  const s = signals!;
  const showAll = depth !== "Beginner";
  const adv = depth === "Advanced";

  const expanded = panelState === "expanded" && signals;

  return (
    <div className="mt-3">
      {headerRow}
      <div
        style={{
          maxHeight: expanded ? 4000 : 0,
          overflow: "hidden",
          transition: "max-height 300ms ease-in-out",
        }}
      >
        <div
          style={{
            background: "#F8FBFF",
            borderLeft: "3px solid #185FA5",
            padding: "14px 16px",
          }}
        >
          <div className="text-right" style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 10 }}>
            Depth: {depth}
          </div>

          <SignalBlock
            tagLabel="Assumptions made"
            tagBg="#E6F1FB"
            tagColor="#0C447C"
            text={
              depth === "Beginner"
                ? firstTwoSentences(s.assumptions)
                : s.assumptions + (adv && s.advAssumptions ? " " + s.advAssumptions : "")
            }
            feedback={perFeedback.assumptions}
            onFeedback={(v) =>
              onUpdate({ perFeedback: { ...perFeedback, assumptions: v } })
            }
          />

          {showAll && (
            <SignalBlock
              tagLabel="Confidence gap"
              tagBg="#FEF3C7"
              tagColor="#92400E"
              text={s.confidence + (adv && s.advConfidence ? " " + s.advConfidence : "")}
              feedback={perFeedback.confidence}
              onFeedback={(v) =>
                onUpdate({ perFeedback: { ...perFeedback, confidence: v } })
              }
            />
          )}

          <SignalBlock
            tagLabel="Verify before acting"
            tagBg="#FDECEA"
            tagColor="#791F1F"
            text={
              depth === "Beginner"
                ? firstTwoSentences(s.verify)
                : s.verify + (adv && s.advVerify ? " " + s.advVerify : "")
            }
            feedback={perFeedback.verify}
            onFeedback={(v) =>
              onUpdate({ perFeedback: { ...perFeedback, verify: v } })
            }
          />

          {showAll && (
            <SignalBlock
              tagLabel="Fork considered"
              tagBg="#F0FDF4"
              tagColor="#166534"
              text={s.fork + (adv && s.advFork ? " " + s.advFork : "")}
              feedback={perFeedback.fork}
              onFeedback={(v) =>
                onUpdate({ perFeedback: { ...perFeedback, fork: v } })
              }
            />
          )}

          <p
            className="italic"
            style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8 }}
          >
            What matters most in your specific situation that I may not have considered?
          </p>

          <hr className="my-3" style={{ borderColor: "#E5E7EB" }} />

          <div style={{ fontSize: 12, color: "#6B7280" }}>
            Was this reasoning audit useful?
          </div>
          <FeedbackPair
            value={panelFeedback}
            onPick={(v) => onUpdate({ panelFeedback: v })}
            labels={["Yes, helpful", "Not relevant"]}
          />

          <div className="mt-4 flex flex-col gap-2">
            <div
              className="rounded-lg"
              style={{ background: "#F3F4F6", padding: "12px 16px" }}
            >
              <span
                className="inline-block rounded-full"
                style={{
                  background: "#E5E7EB",
                  color: "#374151",
                  fontSize: 11,
                  padding: "2px 10px",
                  marginBottom: 8,
                }}
              >
                Uncertainty
              </span>
              <div style={{ fontSize: 13, color: "#6B7280" }}>
                Some aspects of this analysis depend on jurisdiction-specific details that may vary.
              </div>
            </div>

            <div
              className="rounded-lg flex items-center justify-between"
              style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                padding: "14px 16px",
              }}
            >
              <div className="flex flex-col" style={{ gap: 2 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                  <span style={{ fontSize: 13 }}>🔒</span> Full reasoning audit — Pro only
                </div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  Upgrade to see assumptions, uncertainty signals, and verification points behind every high-stakes response.
                </div>
              </div>
              <button
                className="rounded-lg"
                style={{
                  background: "#185FA5",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 500,
                  height: 36,
                  padding: "0 18px",
                }}
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDepthModal && (
        <DepthModal
          onCancel={() => onUpdate({ showDepthModal: false })}
          onSave={(d) => {
            onSetDepth(d);
            onUpdate({ showDepthModal: false, panelState: "expanded" });
          }}
        />
      )}
    </div>
  );
}

export default function ClaudeApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [depthPreference, setDepthPreference] = useState<Depth | null>(null);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Claude";
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const updateMessage = (id: number, patch: Partial<Message>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const submit = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const userMsg: Message = {
      id: idRef.current++,
      role: "user",
      text: t,
      panelState: "idle",
      showDepthModal: false,
      perFeedback: { assumptions: null, confidence: null, verify: null, fork: null },
      panelFeedback: null,
    };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const answer = ANSWERS[t] ?? CUSTOM_ANSWER;
      const signals = SIGNALS[t] ?? customSignals;
      const assistantId = idRef.current++;
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        text: answer,
        signals,
        panelState: "compiling",
        showDepthModal: false,
        perFeedback: { assumptions: null, confidence: null, verify: null, fork: null },
        panelFeedback: null,
      };
      setMessages((p) => [...p, assistantMsg]);
      setTimeout(() => {
        setMessages((p) =>
          p.map((m) => (m.id === assistantId ? { ...m, panelState: "ready_collapsed" } : m))
        );
      }, 3000);
    }, 1500);
  };

  const newChat = () => {
    setMessages([]);
    setInput("");
    setTyping(false);
    setDepthPreference(null);
  };

  const showLanding = messages.length === 0 && !typing;

  return (
    <div className="flex h-screen w-screen" style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 15, background: "#FFFFFF" }}>
      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Sidebar */}
      <aside
        className="flex flex-col shrink-0"
        style={{ width: 260, background: "#F7F6F3", borderRight: "1px solid #ECEBE7" }}
      >
        <div className="flex items-center gap-2" style={{ padding: 20 }}>
          <img src={claudeLogo} alt="Claude" style={{ width: 24, height: 24 }} />
          <span style={{ fontSize: 18, color: "#1A1A1A", fontWeight: 600 }}>Claude</span>
        </div>
        <div style={{ padding: "0 12px" }}>
          <button
            onClick={newChat}
            className="w-full flex items-center gap-2 rounded-lg transition hover:bg-white/60"
            style={{
              height: 36,
              border: "1px solid #E5E4DF",
              background: "#fff",
              fontSize: 13,
              color: "#1A1A1A",
              padding: "0 12px",
            }}
          >
            <span style={{ fontSize: 16 }}>+</span> New chat
          </button>
        </div>
        <div style={{ padding: "16px 20px 4px", fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Recents
        </div>
        <div className="flex flex-col">
          {["Legal contract review", "Solar panel ROI", "Remote work productivity"].map((t) => (
            <div
              key={t}
              className="flex items-center cursor-pointer transition hover:bg-black/5"
              style={{ height: 36, padding: "0 20px", fontSize: 13, color: "#4B5563" }}
            >
              {t}
            </div>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-2" style={{ padding: 16, borderTop: "1px solid #ECEBE7" }}>
          <div className="rounded-full" style={{ width: 32, height: 32, background: "#D1D5DB" }} />
          <span style={{ fontSize: 13, color: "#1A1A1A" }}>Anya</span>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {showLanding ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="flex items-center gap-3 mb-2">
              <img src={claudeLogo} alt="" style={{ width: 36, height: 36 }} />
              <h1 style={{ fontSize: 26, color: "#1A1A1A", fontWeight: 500 }}>
                Hey there. What do you have in mind today?
              </h1>
            </div>
            <p style={{ fontSize: 15, color: "#6B7280", marginTop: 4 }}>
              Ask me anything. I'll show you my reasoning.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => submit(p)}
                  className="rounded-full transition hover:shadow-md"
                  style={{
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    padding: "10px 18px",
                    fontSize: 14,
                    color: "#1A1A1A",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full" style={{ maxWidth: 720, padding: "32px 24px 24px" }}>
              {messages.map((m) => {
                if (m.role === "user") {
                  return (
                    <div key={m.id} className="flex justify-end mb-6">
                      <div
                        style={{
                          background: "#185FA5",
                          color: "#fff",
                          fontSize: 15,
                          maxWidth: "60%",
                          borderRadius: 18,
                          padding: "12px 16px",
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={m.id} className="mb-6">
                    <div
                      style={{
                        background: "#F2F1EE",
                        color: "#1A1A1A",
                        fontSize: 15,
                        maxWidth: "80%",
                        borderRadius: 18,
                        padding: "16px 20px",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.55,
                      }}
                    >
                      {m.text}
                    </div>
                    {m.signals && (
                      <div style={{ maxWidth: "80%" }}>
                        <ReasoningPanel
                          msg={m}
                          depthPreference={depthPreference}
                          onSetDepth={setDepthPreference}
                          onUpdate={(patch) => updateMessage(m.id, patch)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              {typing && (
                <div className="mb-6">
                  <TypingDots />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div style={{ padding: "16px 24px 24px" }}>
          <div
            className="mx-auto flex items-center"
            style={{
              maxWidth: 720,
              height: 52,
              border: "1px solid #E5E7EB",
              borderRadius: 26,
              padding: "0 8px 0 20px",
              background: "#fff",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit(input);
              }}
              placeholder="Message Claude..."
              className="flex-1 outline-none bg-transparent"
              style={{ fontSize: 15, color: "#1A1A1A" }}
            />
            <button
              onClick={() => submit(input)}
              className="rounded-full flex items-center justify-center"
              style={{ width: 36, height: 36, background: "#185FA5", color: "#fff" }}
              aria-label="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
