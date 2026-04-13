import Link from "next/link";
import * as s from "@/styles/pagesShared.css";

export default function Home() {
  return (
    <div className={s.homeRoot}>
      <div className={s.homeInner}>
        <div className={s.homeLogo}>🏃</div>
        <div className={s.homeTitle}>PACE</div>
        <div className={s.homeTagline}>Tu analítica de running personalizada</div>
        <Link href="/dashboard" className={s.homeCta}>
          Entrar con Strava
        </Link>
      </div>
    </div>
  );
}
