import { getCurrentUser } from "@/lib/auth";
import { HRZonesSetup } from "@/components/HRZonesSetup";
import { SyncButton } from "@/components/SyncButton";
import * as s from "@/styles/pagesShared.css";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className={s.maxWidth480}>
      <div className={s.settingsSectionHeader}>
        <div className={s.pageTitle}>Perfil</div>
        <div className={s.pageSubtitle}>
          Configura tus datos para cálculos personalizados
        </div>
      </div>

      <div className={s.settingsCard}>
        <div className={s.settingsRow}>
          {user?.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profileImageUrl}
              alt={user.name}
              className={s.settingsAvatarImg}
            />
          ) : (
            <div className={s.settingsAvatarPlaceholder}>
              {user?.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}
          <div>
            <div className={s.settingsName}>{user?.name}</div>
            <div className={s.settingsMeta}>Conectado con Strava</div>
          </div>
        </div>

        <div className={s.settingsRowLast}>
          <div className={s.settingsFieldLabel}>Frecuencia cardíaca</div>
          <HRZonesSetup currentMaxHR={user?.maxHR} />
        </div>

        <div className={s.settingsRowBorderTop}>
          <SyncButton />
        </div>
      </div>
    </div>
  );
}
