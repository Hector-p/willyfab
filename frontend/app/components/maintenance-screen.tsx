const FALLBACK_MESSAGE = "Site under maintainance, Check back later";

export function MaintenanceScreen({ message }: { message: string | null }) {
  return (
    <main className="maintenance">
      <div className="maintenance-inner">
        <img alt="" className="maintenance-logo" height="64" src="/images/willyfab-logo.png" width="64" />
        <p className="maintenance-kicker">Willyfab Engineering</p>
        <h1 className="maintenance-message">{message || FALLBACK_MESSAGE}</h1>
        <span className="maintenance-rule" aria-hidden="true" />
      </div>
    </main>
  );
}
