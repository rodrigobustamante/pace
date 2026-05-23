"use client";

import { useCoachStream } from "@/hooks/useCoachStream";
import { useDailyCoach } from "@/hooks/useDailyCoach";
import { useCoachRisk } from "@/hooks/useCoachRisk";
import { useTranslations } from "next-intl";
import { CoachInsightCard } from "@/components/CoachInsightCard";
import { CoachChat } from "@/components/CoachChat";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useEffect, useState } from "react";
import * as cp from "@/styles/coachPage.css";
import * as grid from "@/styles/dashboardGrid.css";
import * as st from "@/styles/stagger.css";
import * as shared from "@/styles/pagesShared.css";

// TypewriterText is only used for cache-hit summaries (already-generated text)
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

  return (
    <>
      {displayed}
      <span style={{ opacity: displayed.length < text.length ? 1 : 0 }}>▌</span>
    </>
  );
}

function StaggeredCard({ children, index }: { children: React.ReactNode; index: number }) {
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

// ─── Overtraining banner ──────────────────────────────────────────────────────

function OverttrainingBanner() {
  const { risk, isLoading } = useCoachRisk();
  const t = useTranslations("coach");
  if (isLoading || !risk || risk.level === "ok") return null;
  const isDanger = risk.level === "danger";
  return (
    <div className={`${cp.riskBanner} ${isDanger ? cp.riskBannerDanger : cp.riskBannerWarning}`}>
      <span className={cp.riskIcon}>{isDanger ? "🚨" : "⚠️"}</span>
      <div className={cp.riskContent}>
        <div className={`${cp.riskTitle} ${isDanger ? cp.riskTitleDanger : cp.riskTitleWarning}`}>
          {isDanger ? t("risk.danger") : t("risk.warning")}
        </div>
        <div className={cp.riskSignals}>{risk.signals.join(" · ")}</div>
      </div>
    </div>
  );
}

// ─── Race day projection card ─────────────────────────────────────────────────

function RaceProjectionCard() {
  const { raceProjection, isLoading } = useCoachRisk();
  const t = useTranslations("coach");
  if (isLoading || !raceProjection?.projection) return null;

  const { goalTitle, targetDate, daysUntilRace, projection } = raceProjection;
  const { projectedCTL, projectedATL, projectedTSB } = projection;

  const tsbClass =
    projectedTSB >= 5 ? cp.projectionValuePositive
    : projectedTSB >= -10 ? cp.projectionValueNeutral
    : cp.projectionValueNegative;

  const formLabel =
    projectedTSB >= 5 ? t("projection.formGood")
    : projectedTSB >= -10 ? t("projection.formOk")
    : t("projection.formBad");

  const formClass =
    projectedTSB >= 5 ? cp.projectionFormGood
    : projectedTSB >= -10 ? cp.projectionFormOk
    : cp.projectionFormBad;

  return (
    <div className={cp.projectionCard}>
      <div className={cp.projectionHeader}>
        <div>
          <div className={cp.projectionLabel}>{t("projection.label")}</div>
          <div className={cp.projectionRace}>{goalTitle}</div>
        </div>
        <div className={cp.projectionDays}>
          {targetDate} · {t("projection.daysUntil", { days: daysUntilRace })}
        </div>
      </div>
      <div className={cp.projectionMetrics}>
        <div className={cp.projectionMetric}>
          <span className={`${cp.projectionValue} ${cp.projectionValueNeutral}`}>{projectedCTL}</span>
          <span className={cp.projectionMetricLabel}>CTL</span>
        </div>
        <div className={cp.projectionMetric}>
          <span className={`${cp.projectionValue} ${cp.projectionValueNegative}`}>{projectedATL}</span>
          <span className={cp.projectionMetricLabel}>ATL</span>
        </div>
        <div className={cp.projectionMetric}>
          <span className={`${cp.projectionValue} ${tsbClass}`}>
            {projectedTSB > 0 ? `+${projectedTSB}` : projectedTSB}
          </span>
          <span className={cp.projectionMetricLabel}>TSB</span>
        </div>
      </div>
      <div className={`${cp.projectionFormBadge} ${formClass}`}>{formLabel}</div>
    </div>
  );
}

// ─── Daily advice card ────────────────────────────────────────────────────────

function DailyAdviceCard() {
  const { advice, isLoading, error, refetch } = useDailyCoach();
  const t = useTranslations("coach");
  const isRest = advice?.recommendation === "rest";
  const accentColor = isRest ? "#60a5fa" : "#4ade80";

  return (
    <div className={`${cp.dailyCard} ${isRest ? cp.dailyCardRest : cp.dailyCardTrain}`}>
      <div className={`${cp.dailyHeader} ${isLoading || error || !advice ? "" : cp.dailyHeaderMb}`}>
        <div>
          <span className={`${cp.dailyLabel} ${isRest ? cp.dailyLabelRest : cp.dailyLabelTrain}`}>
            {t("daily.label")}
          </span>
        </div>
        {!isLoading ? (
          <button type="button" onClick={() => refetch()} className={cp.iconBtn}>↻</button>
        ) : null}
      </div>

      {isLoading ? (
        <div className={cp.loadRow}>
          <div className={cp.spinLoader} />
          <span className={shared.mutedText13}>{t("daily.analyzing")}</span>
        </div>
      ) : null}

      {error && !isLoading ? <div className={shared.errorText13}>{error}</div> : null}

      {advice && !isLoading ? (
        <div className={cp.dailyBodyRow}>
          <div className={cp.dailyIcon}>{isRest ? "😴" : "🏃"}</div>
          <div className={cp.dailyContent}>
            <div className={cp.dailyTitle}>{advice.title}</div>
            <div className={cp.dailyText} style={{ marginBottom: advice.duration || advice.intensity ? 12 : 0 }}>
              {advice.body}
            </div>
            {(advice.sessionType || advice.duration || advice.intensity) && (
              <div className={cp.chipRow}>
                {advice.sessionType ? (
                  <span
                    className={cp.chipAccent}
                    style={{ color: accentColor, background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}
                  >
                    {t(`daily.sessions.${advice.sessionType}` as Parameters<typeof t>[0]) ?? advice.sessionType}
                  </span>
                ) : null}
                {advice.duration ? <span className={cp.chipMuted}>{advice.duration}</span> : null}
                {advice.intensity ? <span className={cp.chipMuted}>{advice.intensity}</span> : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Weekly summary box (handles both streaming and loaded states) ─────────────

function WeeklySummaryBox({
  summary,
  isStreaming,
  wasStreamed,
}: {
  summary: string;
  isStreaming: boolean;
  wasStreamed: boolean;
}) {
  return (
    <div className={cp.weeklyBox}>
      <div className={cp.weeklyRow}>
        <div className={cp.weeklyEmoji}>📊</div>
        <div>
          <div className={cp.weeklyHeading}>
            {isStreaming ? (
              <span style={{ opacity: 0.6 }}>Analizando tu semana…</span>
            ) : (
              "Resumen semanal"
            )}
          </div>
          <div className={cp.weeklyText}>
            {isStreaming ? (
              <>
                {summary}
                <span style={{ opacity: 0.7 }}>▌</span>
              </>
            ) : wasStreamed ? (
              // Already appeared live — just render, no fake animation
              summary
            ) : (
              // Cache hit — simulate the "typing" feel
              <TypewriterText text={summary} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachPage() {
  const { insights, isLoading, isStreaming, streamSummary, wasStreamed, error, refetch } =
    useCoachStream();
  const t = useTranslations("coach");

  const insightCards = insights
    ? [
        { type: "positive" as const, ...insights.positive },
        { type: "warning" as const, ...insights.warning },
        { type: "tip" as const, ...insights.tip },
        { type: "prediction" as const, ...insights.prediction },
      ]
    : [];

  // Show the summary box while streaming (partial text) or once loaded
  const showSummaryBox = isStreaming || !!insights;
  const summaryText = isStreaming ? streamSummary : (insights?.summary ?? "");

  return (
    <div>
      <div className={cp.pageHead}>
        <div>
          <div className={cp.pageTitle}>
            Coach <span className={cp.accentOrange}>IA</span>
          </div>
          <div className={cp.pageSub}>{t("subtitle")}</div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading || isStreaming}
          className={`${cp.regenBtn} ${isLoading || isStreaming ? cp.regenBtnLoading : cp.regenBtnReady}`}
        >
          {isLoading || isStreaming ? (
            <span className={cp.regenRow}>
              <span className={cp.spinSm} />
              {isStreaming ? t("generating") : t("generating")}
            </span>
          ) : (
            t("regenerate")
          )}
        </button>
      </div>

      <OverttrainingBanner />
      <DailyAdviceCard />
      <RaceProjectionCard />

      {error ? <div className={cp.errorBanner}>{error}</div> : null}

      {/* Summary box: visible during streaming and after load */}
      {showSummaryBox ? (
        <WeeklySummaryBox
          summary={summaryText}
          isStreaming={isStreaming}
          wasStreamed={wasStreamed}
        />
      ) : null}

      {/* Skeleton cards shown while waiting for insights (streaming or initial load) */}
      {(isLoading || isStreaming) && !insights ? (
        <div className={grid.rg2Insight}>
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} height={120} />
          ))}
        </div>
      ) : null}

      {/* Full insight cards — appear with stagger once streaming finishes */}
      {insights ? (
        <>
          <div className={grid.rg2Insight}>
            {insightCards.map((card, i) => (
              <StaggeredCard key={card.type} index={i}>
                <CoachInsightCard type={card.type} title={card.title} body={card.body} />
              </StaggeredCard>
            ))}
          </div>

          {insights.complementary && (
            <StaggeredCard index={4}>
              <div className={cp.complementarySection}>
                <div className={cp.complementarySectionLabel}>{t("strengthLabel")}</div>
                <CoachInsightCard
                  type="complementary"
                  title={insights.complementary.title}
                  body={insights.complementary.body}
                />
              </div>
            </StaggeredCard>
          )}

          <div className={cp.footerNote}>
            <span className={cp.footerMono}>{t("footer")}</span>
            <span className={cp.footerMono}>gemini-2.5-flash</span>
          </div>

          <div className={cp.chatSection}>
            <div className={cp.chatSectionTitle}>{t("chatTitle")}</div>
            <CoachChat />
          </div>
        </>
      ) : !error && !isLoading && !isStreaming ? (
        <div className={cp.emptyCoach}>
          <div className={shared.emptyStateEmojiLg}>🤖</div>
          <div className={shared.emptyStateTitleLg}>{t("empty.title")}</div>
          <div className={shared.emptyStateBodyNarrow}>{t("empty.body")}</div>
        </div>
      ) : null}
    </div>
  );
}
