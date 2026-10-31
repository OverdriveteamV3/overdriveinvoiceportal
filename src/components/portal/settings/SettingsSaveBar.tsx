export default function SettingsSaveBar({
  dirty,
  pending,
  saved,
  error,
  saveLabel,
  savingLabel,
  savedLabel,
}: {
  dirty: boolean;
  pending: boolean;
  saved: boolean;
  error: string;
  saveLabel: string;
  savingLabel: string;
  savedLabel: string;
}) {
  return (
    <div className="od-settings-save">
      <button type="submit" disabled={!dirty || pending}>
        {pending ? savingLabel : saveLabel}
      </button>
      {saved && !error ? <span>{savedLabel}</span> : null}
      {error ? (
        <p role="alert" className="od-settings-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
