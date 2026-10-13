"use client";

/**
 * RiveFormWidget
 *
 * Displays the athlete's current training form (TSB) as an animated widget.
 *
 * ── Placeholder mode (default) ────────────────────────────────────────────
 * Works out of the box with a CSS-animated visual keyed to the TSB state.
 * No .riv file required.
 *
 * ── Rive mode ─────────────────────────────────────────────────────────────
 * To activate a Rive animation:
 *
 *   1. Drop your .riv file into  public/animations/  (e.g. runner.riv)
 *   2. Pass `rivSrc="/animations/runner.riv"` to this component
 *   3. Pass `stateMachineName` matching the name in the Rive editor
 *   4. Pass `inputName` for the Number input that controls the state
 *      (the component sends values 0–4 → fatigued / tired / normal / fresh / peak)
 *
 * Example:
 *   <RiveFormWidget
 *     tsb={12.5}
 *     rivSrc="/animations/runner.riv"
 *     stateMachineName="Form Machine"
 *     inputName="formLevel"
 *   />
 */

import { useEffect } from "react";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { assignInlineVars } from "@vanilla-extract/dynamic";
import * as s from "@/styles/riveFormWidget.css";

// ─── Form-state definitions ────────────────────────────────────────────────

interface FormState {
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  emoji: string;
  description: string;
  color: string;
  glow: string;
}

const FORM_STATES: Record<0 | 1 | 2 | 3 | 4, FormState> = {
  4: {
    level: 4,
    label: "Pico de forma",
    emoji: "🔥",
    description: "Forma óptima. Ideal para competir o hacer un test de rendimiento.",
    color: "#4ade80",
    glow: "rgba(74,222,128,0.08)",
  },
  3: {
    level: 3,
    label: "Fresco",
    emoji: "✨",
    description: "Bien recuperado. Momento ideal para una sesión de calidad.",
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.08)",
  },
  2: {
    level: 2,
    label: "En forma",
    emoji: "💪",
    description: "Carga normal de entrenamiento. Sigue el plan.",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.08)",
  },
  1: {
    level: 1,
    label: "Cargado",
    emoji: "😮‍💨",
    description: "Acumulando fatiga. Prioriza la recuperación esta semana.",
    color: "#facc15",
    glow: "rgba(250,204,21,0.08)",
  },
  0: {
    level: 0,
    label: "Fatigado",
    emoji: "😴",
    description: "Fatiga alta. Considera reducir la carga o descansar hoy.",
    color: "#f97316",
    glow: "rgba(249,115,22,0.08)",
  },
};

function getFormState(tsb: number): FormState {
  if (tsb > 10) return FORM_STATES[4];
  if (tsb > 3)  return FORM_STATES[3];
  if (tsb > -5) return FORM_STATES[2];
  if (tsb > -15) return FORM_STATES[1];
  return FORM_STATES[0];
}

// ─── Props ────────────────────────────────────────────────────────────────

interface RiveFormWidgetProps {
  tsb: number;
  /** Path to a .riv file inside /public. When omitted, shows the CSS placeholder. */
  rivSrc?: string;
  /** Name of the state machine in your .riv file. */
  stateMachineName?: string;
  /** Name of the Number input that controls form level (receives 0–4). */
  inputName?: string;
}

// ─── Subcomponent: Rive canvas with state machine wiring ─────────────────

function RiveCanvas({
  rivSrc,
  stateMachineName,
  inputName,
  level,
}: {
  rivSrc: string;
  stateMachineName: string;
  inputName: string;
  level: 0 | 1 | 2 | 3 | 4;
}) {
  const { RiveComponent, rive } = useRive({
    src: rivSrc,
    stateMachines: stateMachineName,
    autoplay: true,
  });

  const formInput = useStateMachineInput(rive, stateMachineName, inputName);

  useEffect(() => {
    if (formInput) {
      formInput.value = level;
    }
  }, [formInput, level]);

  return <RiveComponent className={s.riveCanvas} />;
}

// ─── Main component ───────────────────────────────────────────────────────

export function RiveFormWidget({
  tsb,
  rivSrc,
  stateMachineName = "Form Machine",
  inputName = "formLevel",
}: RiveFormWidgetProps) {
  const state = getFormState(tsb);
  const tsbFormatted = `${tsb > 0 ? "+" : ""}${tsb.toFixed(1)}`;
  const isRiveMode = Boolean(rivSrc);

  return (
    <div
      className={s.card}
    >
      {/* Ambient glow that reacts to form state */}
      <div
        className={s.glowLayer}
        style={assignInlineVars({ background: `radial-gradient(ellipse at 20% 50%, ${state.glow} 0%, transparent 70%)` })}
      />

      {/* ── Figure area ── */}
      <div className={s.figureWrap}>
        {isRiveMode && rivSrc ? (
          <RiveCanvas
            rivSrc={rivSrc}
            stateMachineName={stateMachineName}
            inputName={inputName}
            level={state.level}
          />
        ) : (
          // CSS placeholder: pulsing emoji with two expanding rings
          <>
            <div className={s.ring} style={{ color: state.color }} />
            <div className={s.ring2} style={{ color: state.color }} />
            <span className={s.emoji}>{state.emoji}</span>
          </>
        )}
      </div>

      {/* ── Text info ── */}
      <div className={s.info}>
        <div className={s.stateLabel} style={{ color: state.color }}>
          {state.label}
        </div>

        <div className={s.tsbValue} style={{ color: state.color }}>
          {tsbFormatted}
          <span className={s.tsbUnit}>TSB</span>
        </div>

        <div className={s.description}>{state.description}</div>

        {!isRiveMode && (
          <div className={s.hint}>
            <span className={s.hintDot} />
            Conecta una animación Rive pasando{" "}
            <code style={{ fontFamily: "monospace", fontSize: 10 }}>rivSrc=</code> al componente
          </div>
        )}
      </div>
    </div>
  );
}
