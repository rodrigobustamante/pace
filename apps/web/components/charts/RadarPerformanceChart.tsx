"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import * as c from "@/styles/chartCard.css";

interface RadarData {
  metric: string;
  value: number;
}

const RADAR_LEGEND: Array<{ name: string; body: string }> = [
  {
    name: "Volumen",
    body: "Kilometraje medio por semana (últimas 4 semanas) frente a ~80 km como referencia alta (100 en el gráfico).",
  },
  {
    name: "Consistencia",
    body: "Semanas con actividad registrada frente a ~12 semanas como referencia de constancia en el tiempo.",
  },
  {
    name: "Intensidad",
    body: "Carga de la última semana (TSS) frente a ~150 TSS como referencia de semana exigente.",
  },
  {
    name: "Recuperación",
    body: "Forma actual (TSB): valores más altos indican más margen para entrenar; negativos, más fatiga acumulada.",
  },
  {
    name: "Cadencia",
    body: "Pasos por minuto (técnica y ritmo de pierna). Suele mirarse en carrera continua; rangos típicos dependen de altura y ritmo.",
  },
  {
    name: "Economía",
    body: "Running economy: qué tan eficiente eres a ritmos submáximos (menos coste fisiológico al mismo ritmo; en laboratorio se mide con oxígeno). Aquí es un indicador orientativo hasta enlazarlo con tus series FC/ritmo.",
  },
];

export function RadarPerformanceChart({ data }: { data: RadarData[] }) {
  return (
    <div className={c.root}>
      <div className={c.kicker}>Perfil atlético</div>
      <div className={c.titleMb8}>Balance</div>
      <ResponsiveContainer width="100%" height={180}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "#475569", fontSize: 10 }}
          />
          <Radar
            dataKey="value"
            stroke="#fb923c"
            fill="#fb923c"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className={c.radarLegend}>
        <div className={c.radarLegendTitle}>Qué significa cada eje</div>
        <ul className={c.radarLegendList}>
          {RADAR_LEGEND.map((row) => (
            <li key={row.name} className={c.radarLegendItem}>
              <span className={c.radarLegendName}>{row.name}:</span>
              {row.body}
            </li>
          ))}
        </ul>
        <p className={c.radarLegendFoot}>
          Escala 0–100 respecto a referencias internas del dashboard, no percentiles
          poblacionales. Cadencia y economía en el radar usan valores fijos de momento
          hasta calcularlos desde tus actividades.
        </p>
      </div>
    </div>
  );
}
