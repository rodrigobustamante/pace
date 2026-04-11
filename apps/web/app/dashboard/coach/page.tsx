"use client";

import { useCoachStream } from "@/hooks/useCoachStream";
import { useDailyCoach } from "@/hooks/useDailyCoach";
import { CoachInsightCard } from "@/components/CoachInsightCard";
import { CoachChat } from "@/components/CoachChat";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useEffect, useState } from "react";

function TypewriterText({ text, speed = 18 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <>{displayed}<span style={{ opacity: displayed.length < text.length ? 1 : 0 }}>▌</span></>;
}

function StaggeredCard({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 120 + 200);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      {children}
    </div>
  );
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  easy: "Rodaje suave",
  tempo: "Tempo",
  long: "Tirada larga",
  workout: "Series",
};

function DailyAdviceCard() {
  const { advice, isLoading, error, refetch } = useDailyCoach();

  const isRest = advice?.recommendation === "rest";
  const accentColor = isRest ? "#60a5fa" : "#4ade80";
  const bgColor = isRest ? "rgba(96,165,250,0.08)" : "rgba(74,222,128,0.08)";
  const borderColor = isRest ? "rgba(96,165,250,0.2)" : "rgba(74,222,128,0.2)";
  const icon = isRest ? "😴" : "🏃";

  return (
    <div
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isLoading || error || !advice ? 0 : 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: accentColor, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Consejo del día
          </span>
        </div>
        {!isLoading && (
          <button
            onClick={() => refetch()}
            style={{
              background: "transparent",
              border: "none",
              color: "#475569",
              fontSize: 12,
              cursor: "pointer",
              padding: "2px 6px",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ↻
          </button>
        )}
      </div>

      {isLoading && (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 10,
              height: 10,
              border: "2px solid #334155",
              borderTopColor: "#60a5fa",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, color: "#475569" }}>Analizando tu forma actual...</span>
        </div>
      )}

      {error && !isLoading && (
        <div style={{ fontSize: 13, color: "#f87171" }}>{error}</div>
      )}

      {advice && !isLoading && (
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ fontSize: 32, flexShrink: 0 }}>{icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>
              {advice.title}
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: advice.duration || advice.intensity ? 12 : 0 }}>
              {advice.body}
            </div>
            {(advice.sessionType || advice.duration || advice.intensity) && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {advice.sessionType && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: accentColor,
                      background: `${accentColor}18`,
                      border: `1px solid ${accentColor}30`,
                      borderRadius: 6,
                      padding: "3px 8px",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {SESSION_TYPE_LABELS[advice.sessionType] ?? advice.sessionType}
                  </span>
                )}
                {advice.duration && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 6,
                      padding: "3px 8px",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {advice.duration}
                  </span>
                )}
                {advice.intensity && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 6,
                      padding: "3px 8px",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {advice.intensity}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoachPage() {
  const { insights, isLoading, error, refetch } = useCoachStream();

  const insightCards = insights
    ? [
        { type: "positive" as const, ...insights.positive },
        { type: "warning" as const, ...insights.warning },
        { type: "tip" as const, ...insights.tip },
        { type: "prediction" as const, ...insights.prediction },
      ]
    : [];

  return (
    <div>
      <div
        style={{
          marginBottom: 28,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            Coach <span style={{ color: "#fb923c" }}>IA</span>
          </div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
            Análisis personalizado basado en tus datos de Strava
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          style={{
            background: isLoading
              ? "rgba(255,255,255,0.03)"
              : "rgba(249,115,22,0.15)",
            border: "1px solid rgba(249,115,22,0.3)",
            borderRadius: 8,
            padding: "8px 16px",
            color: isLoading ? "#475569" : "#fb923c",
            fontSize: 12,
            fontWeight: 600,
            cursor: isLoading ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.2s",
          }}
        >
          {isLoading ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  border: "2px solid #475569",
                  borderTopColor: "#fb923c",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Generando...
            </span>
          ) : (
            "↻ Regenerar"
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      <DailyAdviceCard />

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 12,
            padding: 16,
            color: "#f87171",
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Summary skeleton */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(239,68,68,0.04))",
              border: "1px solid rgba(249,115,22,0.15)",
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div
                style={{
                  fontSize: 36,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              >
                📊
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: 20,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 4,
                    marginBottom: 10,
                    width: "40%",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
                <div
                  style={{
                    height: 14,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 4,
                    marginBottom: 6,
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
                <div
                  style={{
                    height: 14,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 4,
                    width: "70%",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
          </div>
          <div className="rg-2 rg-insight">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} height={120} />
            ))}
          </div>
        </div>
      ) : insights ? (
        <>
          {/* Weekly summary with typewriter */}
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(239,68,68,0.05))",
              border: "1px solid rgba(249,115,22,0.2)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: 16 }}
            >
              <div style={{ fontSize: 36, flexShrink: 0 }}>📊</div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 10,
                    color: "#f1f5f9",
                  }}
                >
                  Resumen semanal
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#94a3b8",
                    lineHeight: 1.75,
                    minHeight: 40,
                  }}
                >
                  <TypewriterText text={insights.summary} />
                </div>
              </div>
            </div>
          </div>

          {/* Staggered insight cards */}
          <div className="rg-2 rg-insight">
            {insightCards.map((card, i) => (
              <StaggeredCard key={card.type} index={i}>
                <CoachInsightCard
                  type={card.type}
                  title={card.title}
                  body={card.body}
                />
              </StaggeredCard>
            ))}
          </div>

          {/* Footer note */}
          <div
            style={{
              marginTop: 24,
              padding: "12px 20px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 11, color: "#334155", fontFamily: "'DM Mono', monospace" }}>
              Análisis válido para esta semana · se regenera automáticamente cada lunes
            </span>
            <span style={{ fontSize: 11, color: "#334155", fontFamily: "'DM Mono', monospace" }}>
              gemini-2.5-flash
            </span>
          </div>

          {/* Chat */}
          <div style={{ marginTop: 32 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 12,
              }}
            >
              Pregúntale a tu coach
            </div>
            <CoachChat />
          </div>
        </>
      ) : !error ? (
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            padding: 48,
            textAlign: "center",
            color: "#475569",
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>🤖</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "'Barlow Condensed', sans-serif",
              marginBottom: 8,
              color: "#64748b",
            }}
          >
            Sin suficientes datos todavía
          </div>
          <div style={{ fontSize: 13, maxWidth: 320, margin: "0 auto" }}>
            Sincroniza al menos una semana de entrenamientos desde Strava para
            activar el coach IA.
          </div>
        </div>
      ) : null}
    </div>
  );
}
