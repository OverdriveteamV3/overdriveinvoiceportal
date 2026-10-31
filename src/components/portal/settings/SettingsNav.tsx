export type SettingsSection = "profile" | "security" | "notifications" | "billing" | "data";

const ORDER: SettingsSection[] = ["profile", "security", "notifications", "billing", "data"];

export default function SettingsNav({
  labels,
  current,
  ariaLabel,
  onChange,
}: {
  labels: Record<SettingsSection, string>;
  current: SettingsSection;
  ariaLabel: string;
  onChange: (section: SettingsSection) => void;
}) {
  return (
    <nav className="od-settings-nav" aria-label={ariaLabel}>
      {ORDER.map((section) => (
        <button
          key={section}
          type="button"
          className={section === current ? "is-active" : ""}
          aria-current={section === current ? "true" : undefined}
          onClick={() => onChange(section)}
        >
          {labels[section]}
        </button>
      ))}
    </nav>
  );
}
