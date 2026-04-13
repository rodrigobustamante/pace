"use client";

import { useCoachStream } from "@/hooks/useCoachStream";
import { useDailyCoach } from "@/hooks/useDailyCoach";
import { CoachInsightCard } from "@/components/CoachInsightCard";
import { CoachChat } from "@/components/CoachChat";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useEffect, useState } from "react";
import * as cp from "@/styles/coachPage.css";
import * as grid from "@/styles/dashboardGrid.css";
import * as st from "@/styles/stagger.css";
import * as shared from "@/styles/pagesShared.css";

function TypewriterText({
  text,
  speed = 18,
}: {
  text: string;
  speed?: number;
}) {
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

  return (
    <>
      {displayed}
      <span
        style={{
          opacity: displayed.length < text.length ? 1 : 0,
        }}
      >
        ▌
      </span>
    </>
  );
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
    <div className={st.reveal} data-visible={visible ? "true" : "false"}>
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

  return (
    <div
      className={`${cp.dailyCard} ${isRest ? cp.dailyCardRest : cp.dailyCardTrain}`}
    >
      <div
        className={`${cp.dailyHeader} ${isLoading || error || !advice ? "" : cp.dailyHeaderMb}`}
      >
        <div>
          <span
            className={`${cp.dailyLabel} ${isRest ? cp.dailyLabelRest : cp.dailyLabelTrain}`}
          >
            Consejo del día
          </span>
        </div>
        {!isLoading ? (
          <button
            type="button"
            onClick={() => refetch()}
            className={cp.iconBtn}
          >
            ↻
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className={cp.loadRow}>
          <div className={cp.spinLoader} />
          <span className={shared.mutedText13}>
            Analizando tu forma actual...
          </span>
        </div>
      ) : null}

      {error && !isLoading ? (
        <div className={shared.errorText13}>{error}</div>
      ) : null}

      {advice && !isLoading ? (
        <div className={cp.dailyBodyRow}>
          <div className={cp.dailyIcon}>{isRest ? "😴" : "🏃"}</div>
          <div className={cp.dailyContent}>
            <div className={cp.dailyTitle}>{advice.title}</div>
            <div
              className={cp.dailyText}
              style={{
                marginBottom:
                  advice.duration || advice.intensity ? 12 : 0,
              }}
            >
              {advice.body}
            </div>
            {(advice.sessionType || advice.duration || advice.intensity) && (
              <div className={cp.chipRow}>
                {advice.sessionType ? (
                  <span
                    className={cp.chipAccent}
                    style={{
                      color: accentColor,
                      background: `${accentColor}18`,
                      border: `1px solid ${accentColor}30`,
                    }}
                  >
                    {SESSION_TYPE_LABELS[advice.sessionType] ??
                      advice.sessionType}
                  </span>
                ) : null}
                {advice.duration ? (
                  <span className={cp.chipMuted}>{advice.duration}</span>
                ) : null}
                {advice.intensity ? (
                  <span className={cp.chipMuted}>{advice.intensity}</span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
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
      <div className={cp.pageHead}>
        <div>
          <div className={cp.pageTitle}>
            Coach <span className={cp.accentOrange}>IA</span>
          </div>
          <div className={cp.pageSub}>
            Análisis personalizado basado en tus datos de Strava
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className={`${cp.regenBtn} ${isLoading ? cp.regenBtnLoading : cp.regenBtnReady}`}
        >
          {isLoading ? (
            <span className={cp.regenRow}>
              <span className={cp.spinSm} />
              Generando...
            </span>
          ) : (
            "↻ Regenerar"
          )}
        </button>
      </div>

      <DailyAdviceCard />

      {error ? <div className={cp.errorBanner}>{error}</div> : null}

      {isLoading ? (
        <div className={shared.flexColGap16}>
          <div className={cp.skeletonSummary}>
            <div className={cp.weeklyRow}>
              <div className={cp.skeletonEmoji}>📊</div>
              <div className={cp.dailyContent}>
                <div
                  className={cp.skeletonLine}
                  style={{
                    height: 20,
                    background: "rgba(255,255,255,0.06)",
                    marginBottom: 10,
                    width: "40%",
                  }}
                />
                <div
                  className={cp.skeletonLine}
                  style={{
                    height: 14,
                    background: "rgba(255,255,255,0.04)",
                    marginBottom: 6,
                  }}
                />
                <div
                  className={cp.skeletonLine}
                  style={{
                    height: 14,
                    background: "rgba(255,255,255,0.04)",
                    width: "70%",
                  }}
                />
              </div>
            </div>
          </div>
          <div className={grid.rg2Insight}>
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} height={120} />
            ))}
          </div>
        </div>
      ) : insights ? (
        <>
          <div className={cp.weeklyBox}>
            <div className={cp.weeklyRow}>
              <div className={cp.weeklyEmoji}>📊</div>
              <div>
                <div className={cp.weeklyHeading}>Resumen semanal</div>
                <div className={cp.weeklyText}>
                  <TypewriterText text={insights.summary} />
                </div>
              </div>
            </div>
          </div>

          <div className={grid.rg2Insight}>
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

          <div className={cp.footerNote}>
            <span className={cp.footerMono}>
              Análisis válido para esta semana · se regenera automáticamente
              cada lunes
            </span>
            <span className={cp.footerMono}>gemini-2.5-flash</span>
          </div>

          <div className={cp.chatSection}>
            <div className={cp.chatSectionTitle}>Pregúntale a tu coach</div>
            <CoachChat />
          </div>
        </>
      ) : !error ? (
        <div className={cp.emptyCoach}>
          <div className={shared.emptyStateEmojiLg}>🤖</div>
          <div className={shared.emptyStateTitleLg}>
            Sin suficientes datos todavía
          </div>
          <div className={shared.emptyStateBodyNarrow}>
            Sincroniza al menos una semana de entrenamientos desde Strava para
            activar el coach IA.
          </div>
        </div>
      ) : null}
    </div>
  );
}
