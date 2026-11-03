"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  clearSecondaryEmail,
  exportPortalRosterCsv,
  resetClientPortal,
  saveEmailChange,
  savePasswordChange,
  savePortalAvatar,
  savePortalBilling,
  savePortalPreferences,
  savePortalProfile,
  saveSecondaryEmail,
} from "@/app/portal/settings/actions";
import type { PortalPreferences } from "@/lib/crm/portal-preferences";
import { US_STATES } from "@/lib/us-states";
import SettingsCard from "@/components/portal/settings/SettingsCard";
import SettingsDialog from "@/components/portal/settings/SettingsDialog";
import SettingsField from "@/components/portal/settings/SettingsField";
import SettingsNav, { type SettingsSection } from "@/components/portal/settings/SettingsNav";
import SettingsSaveBar from "@/components/portal/settings/SettingsSaveBar";

export type SettingsAccount = {
  name: string;
  email: string;
  avatarUrl: string | null;
  phone: string;
  businessName: string;
  hasPassword: boolean;
  pendingEmail: string | null;
  secondaryEmail: string;
  secondaryEmailVerified: boolean;
  preferences: PortalPreferences;
  billingContactName: string;
  billingBusinessName: string;
  billingEmail: string;
  billingCountry: string;
  billingAddress: string;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  deletionRequestedAt: string | null;
};

type Copy = {
  title: string;
  subtitle: string;
  navLabel: string;
  sections: Record<SettingsSection, string>;
  save: string;
  saving: string;
  saved: string;
  unsaved: string;
  profileTitle: string;
  profileBody: string;
  photo: string;
  replace: string;
  remove: string;
  name: string;
  business: string;
  phone: string;
  email: string;
  emailHint: string;
  emailLink: string;
  securityTitle: string;
  securityBody: string;
  loginEmail: string;
  changeEmail: string;
  pending: string;
  googleEmail: string;
  secondaryTitle: string;
  secondaryBody: string;
  addSecondary: string;
  replaceSecondary: string;
  removeSecondary: string;
  verified: string;
  unverified: string;
  passwordTitle: string;
  changePassword: string;
  googlePassword: string;
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
  show: string;
  hide: string;
  newEmail: string;
  sendLink: string;
  notesTitle: string;
  notesBody: string;
  projectStatus: string;
  invoiceReminders: string;
  marketing: string;
  messages: string;
  payments: string;
  unavailable: string;
  securityMail: string;
  billingTitle: string;
  billingBody: string;
  contact: string;
  billingBusiness: string;
  billingEmail: string;
  country: string;
  street: string;
  line2: string;
  city: string;
  state: string;
  selectState: string;
  postal: string;
  dataTitle: string;
  dataBody: string;
  download: string;
  importCsv: string;
  imported: string;
  deleteTitle: string;
  deleteBody: string;
  resetLabel: string;
  resetAction: string;
  resetting: string;
  csvTitle: string;
  csvBody: string;
  csvSave: string;
  csvSaving: string;
  csvReset: string;
  resetDone: string;
  resetKept: string;
  resetCsvKept: string;
  resetFailed: string;
  resetNeedType: string;
  confirmWipe: string;
  confirmWipeSaved: string;
  close: string;
  cancel: string;
  notices: Record<string, string>;
};

const EN: Copy = {
  title: "Settings",
  subtitle: "Manage your profile, security, preferences, and account.",
  navLabel: "Settings sections",
  sections: {
    profile: "Profile",
    security: "Email & security",
    notifications: "Notifications",
    billing: "Billing details",
    data: "Data & account",
  },
  save: "Save changes",
  saving: "Saving…",
  saved: "Saved",
  unsaved: "You have unsaved changes. Leave this section without saving?",
  profileTitle: "Profile",
  profileBody: "How your account appears in the portal.",
  photo: "Photo",
  replace: "Replace photo",
  remove: "Remove",
  name: "Full name",
  business: "Business name",
  phone: "Phone",
  email: "Email",
  emailHint: "Login email changes from Email & security.",
  emailLink: "Email & security",
  securityTitle: "Email",
  securityBody: "Your login email changes only after you open the confirmation link.",
  loginEmail: "Login email",
  changeEmail: "Change email",
  pending: "Waiting for confirmation at",
  googleEmail: "This account uses Google. Change the email in Google, then sign in again.",
  secondaryTitle: "Secondary contact",
  secondaryBody: "A verified contact address. It is not used to sign in or reset your password.",
  addSecondary: "Add contact email",
  replaceSecondary: "Replace contact email",
  removeSecondary: "Remove",
  verified: "Verified",
  unverified: "Check your inbox to verify",
  passwordTitle: "Password",
  changePassword: "Change password",
  googlePassword: "You sign in with Google.",
  currentPassword: "Current password",
  nextPassword: "New password",
  confirmPassword: "Confirm new password",
  show: "Show",
  hide: "Hide",
  newEmail: "New email",
  sendLink: "Send confirmation",
  notesTitle: "Notifications",
  notesBody: "These switches control emails this portal actually sends.",
  projectStatus: "Project status",
  invoiceReminders: "Invoice reminders",
  marketing: "Marketing",
  messages: "New messages",
  payments: "Payment confirmations",
  unavailable: "This portal does not send that email.",
  securityMail: "Security email, including password and address confirmation, is always sent.",
  billingTitle: "Billing details",
  billingBody: "Contact details stored on your portal account. Cards are not saved here.",
  contact: "Billing contact",
  billingBusiness: "Billing business",
  billingEmail: "Billing email",
  country: "Country",
  street: "Street address",
  line2: "Apt, suite",
  city: "City",
  state: "State",
  selectState: "Select a state",
  postal: "ZIP code",
  dataTitle: "Download your data",
  dataBody:
    "A CSV file of your profile, billing details, notification settings, and your project and invoice summaries. Import updates your profile, billing details, and notification settings.",
  download: "Download CSV",
  importCsv: "Import CSV",
  imported: "Imported",
  deleteTitle: "Reset account",
  deleteBody:
    "This deletes every job, invoice, message, and history record on this account. Your sign-in stays. The projects page starts empty.",
  resetLabel: "Type RESET to confirm",
  resetAction: "Reset account data",
  resetting: "Resetting…",
  csvTitle: "Save a CSV backup",
  csvBody: "Save a CSV of this account's jobs and invoices before they are deleted.",
  csvSave: "Save CSV",
  csvSaving: "Saving…",
  csvReset: "Reset",
  resetDone: "Account data cleared. Projects, invoices, messages, and history are gone.",
  resetKept: "Account data was not reset.",
  resetCsvKept: "CSV backup saved. Account data was not reset.",
  resetFailed: "Account reset failed. Please try again.",
  resetNeedType: 'Type "RESET" to confirm.',
  confirmWipe:
    "This permanently deletes every job, invoice, payment, message, and history item on this account. Your sign-in stays. This cannot be undone.",
  confirmWipeSaved:
    "CSV backup saved. This permanently deletes every job, invoice, payment, message, and history item on this account. Your sign-in stays. This cannot be undone.",
  close: "Close",
  cancel: "Cancel",
  notices: {
    "email-confirmed": "Your login email is updated.",
    "email-error": "That email link is invalid or expired.",
    "contact-confirmed": "Your secondary contact email is verified.",
    "contact-error": "That contact link is invalid or expired.",
  },
};

const ES: Copy = {
  ...EN,
  title: "Ajustes",
  subtitle: "Administra tu perfil, seguridad, preferencias y cuenta.",
  navLabel: "Secciones de ajustes",
  sections: {
    profile: "Perfil",
    security: "Correo y seguridad",
    notifications: "Avisos",
    billing: "Facturación",
    data: "Datos y cuenta",
  },
  save: "Guardar cambios",
  saving: "Guardando…",
  saved: "Guardado",
  unsaved: "Hay cambios sin guardar. ¿Salir de esta sección sin guardar?",
  profileTitle: "Perfil",
  profileBody: "Cómo aparece tu cuenta en el portal.",
  photo: "Foto",
  replace: "Cambiar foto",
  remove: "Quitar",
  name: "Nombre completo",
  business: "Empresa",
  phone: "Teléfono",
  email: "Correo",
  emailHint: "El correo de acceso se cambia en Correo y seguridad.",
  emailLink: "Correo y seguridad",
  securityTitle: "Correo",
  securityBody: "El correo de acceso cambia solo al abrir el enlace de confirmación.",
  loginEmail: "Correo de acceso",
  changeEmail: "Cambiar correo",
  pending: "Esperando confirmación en",
  googleEmail: "Esta cuenta usa Google. Cambia el correo en Google y vuelve a entrar.",
  secondaryTitle: "Contacto secundario",
  secondaryBody: "Un correo de contacto verificado. No sirve para entrar ni para restablecer la contraseña.",
  addSecondary: "Añadir correo de contacto",
  replaceSecondary: "Cambiar correo de contacto",
  removeSecondary: "Quitar",
  verified: "Verificado",
  unverified: "Revisa tu bandeja para verificar",
  passwordTitle: "Contraseña",
  changePassword: "Cambiar contraseña",
  googlePassword: "Entras con Google.",
  currentPassword: "Contraseña actual",
  nextPassword: "Nueva contraseña",
  confirmPassword: "Confirmar contraseña",
  show: "Mostrar",
  hide: "Ocultar",
  newEmail: "Nuevo correo",
  sendLink: "Enviar confirmación",
  notesTitle: "Avisos",
  notesBody: "Estos interruptores controlan los correos que este portal sí envía.",
  projectStatus: "Estado del proyecto",
  invoiceReminders: "Recordatorios de facturas",
  marketing: "Marketing",
  messages: "Mensajes nuevos",
  payments: "Confirmaciones de pago",
  unavailable: "Este portal no envía ese correo.",
  securityMail: "El correo de seguridad, incluida la contraseña y la confirmación de dirección, siempre se envía.",
  billingTitle: "Datos de facturación",
  billingBody: "Datos de contacto guardados en tu cuenta. Aquí no se guardan tarjetas.",
  contact: "Contacto de facturación",
  billingBusiness: "Empresa de facturación",
  billingEmail: "Correo de facturación",
  country: "País",
  street: "Calle",
  line2: "Apto, suite",
  city: "Ciudad",
  state: "Estado",
  selectState: "Elige un estado",
  postal: "Código postal",
  dataTitle: "Descargar tus datos",
  dataBody:
    "Un CSV con tu perfil, facturación, avisos y el resumen de tus proyectos y facturas. La importación actualiza el perfil, la facturación y los avisos.",
  download: "Descargar CSV",
  importCsv: "Importar CSV",
  imported: "Importado",
  deleteTitle: "Reiniciar cuenta",
  deleteBody:
    "Esto borra cada trabajo, factura, mensaje e historial de esta cuenta. Tu acceso se mantiene. La página de proyectos queda vacía.",
  resetLabel: "Escribe RESET para confirmar",
  resetAction: "Reiniciar los datos",
  resetting: "Reiniciando…",
  csvTitle: "Guardar una copia CSV",
  csvBody: "Guarda un CSV de los trabajos y facturas de esta cuenta antes de borrarlos.",
  csvSave: "Guardar CSV",
  csvSaving: "Guardando…",
  csvReset: "Reiniciar",
  resetDone: "Datos borrados. Proyectos, facturas, mensajes e historial ya no están.",
  resetKept: "Los datos de la cuenta no se reiniciaron.",
  resetCsvKept: "CSV guardado. Los datos de la cuenta no se reiniciaron.",
  resetFailed: "No se pudo reiniciar la cuenta. Inténtalo de nuevo.",
  resetNeedType: 'Escribe "RESET" para confirmar.',
  confirmWipe:
    "Esto elimina de forma permanente cada trabajo, factura, pago, mensaje e historial de esta cuenta. Tu acceso se mantiene. No se puede deshacer.",
  confirmWipeSaved:
    "CSV guardado. Esto elimina de forma permanente cada trabajo, factura, pago, mensaje e historial de esta cuenta. Tu acceso se mantiene. No se puede deshacer.",
  close: "Cerrar",
  cancel: "Cancelar",
  notices: {
    "email-confirmed": "Tu correo de acceso quedó actualizado.",
    "email-error": "Ese enlace de correo no es válido o expiró.",
    "contact-confirmed": "Tu correo de contacto secundario quedó verificado.",
    "contact-error": "Ese enlace de contacto no es válido o expiró.",
  },
};

function billingDraft(account: SettingsAccount) {
  const hasParts = Boolean(
    account.billingAddressLine1 ||
      account.billingAddressLine2 ||
      account.billingCity ||
      account.billingState ||
      account.billingPostalCode
  );
  return {
    contactName: account.billingContactName,
    businessName: account.billingBusinessName,
    email: account.billingEmail,
    country: account.billingCountry,
    addressLine1: hasParts ? account.billingAddressLine1 : account.billingAddress,
    addressLine2: account.billingAddressLine2,
    city: account.billingCity,
    state: account.billingState,
    postalCode: account.billingPostalCode,
  };
}

export default function PortalSettings({
  locale,
  notice,
  account,
}: {
  locale: "en" | "es";
  notice?: string;
  account: SettingsAccount;
}) {
  const copy = locale === "es" ? ES : EN;
  const router = useRouter();
  const [section, setSection] = useState<SettingsSection>("profile");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [avatarOverride, setAvatarOverride] = useState<string | null | undefined>(undefined);
  const avatarUrl = avatarOverride === undefined ? account.avatarUrl : avatarOverride;

  const [name, setName] = useState(account.name);
  const [businessName, setBusinessName] = useState(account.businessName);
  const [phone, setPhone] = useState(account.phone);
  const [baseProfile, setBaseProfile] = useState({
    name: account.name,
    businessName: account.businessName,
    phone: account.phone,
  });

  const [prefs, setPrefs] = useState(account.preferences);
  const [basePrefs, setBasePrefs] = useState(account.preferences);
  const [billing, setBilling] = useState(() => billingDraft(account));
  const [baseBilling, setBaseBilling] = useState(billing);
  const [secondaryEmail, setSecondaryEmail] = useState(account.secondaryEmail);
  const [secondaryVerified, setSecondaryVerified] = useState(account.secondaryEmailVerified);
  const [pendingEmail, setPendingEmail] = useState(account.pendingEmail);
  const [resetText, setResetText] = useState("");
  const [csvPromptOpen, setCsvPromptOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [savingCsv, setSavingCsv] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const [dialog, setDialog] = useState<"email" | "secondary" | "password" | null>(null);
  const [dialogError, setDialogError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [nextEmail, setNextEmail] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [importError, setImportError] = useState("");
  const [imported, setImported] = useState(false);

  const profileDirty =
    name !== baseProfile.name || businessName !== baseProfile.businessName || phone !== baseProfile.phone;
  const notesDirty =
    prefs.notifyInvoiceReminders !== basePrefs.notifyInvoiceReminders ||
    prefs.notifyProjectStatus !== basePrefs.notifyProjectStatus;
  const billingDirty =
    billing.contactName !== baseBilling.contactName ||
    billing.businessName !== baseBilling.businessName ||
    billing.email !== baseBilling.email ||
    billing.country !== baseBilling.country ||
    billing.addressLine1 !== baseBilling.addressLine1 ||
    billing.addressLine2 !== baseBilling.addressLine2 ||
    billing.city !== baseBilling.city ||
    billing.state !== baseBilling.state ||
    billing.postalCode !== baseBilling.postalCode;
  const dirty = profileDirty || notesDirty || billingDirty;

  useEffect(() => {
    function onLeave(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  function resetDrafts() {
    setName(baseProfile.name);
    setBusinessName(baseProfile.businessName);
    setPhone(baseProfile.phone);
    setPrefs(basePrefs);
    setBilling(baseBilling);
    setError("");
    setSaved(false);
  }

  function openSection(next: SettingsSection) {
    if (next === section) return;
    if (dirty && !window.confirm(copy.unsaved)) return;
    resetDrafts();
    setSection(next);
  }

  function finish(result: { error: string }, after?: () => void) {
    if (result.error) {
      setError(result.error);
      setSaved(false);
      return;
    }
    after?.();
    setError("");
    setSaved(true);
    router.refresh();
  }

  function onPhoto(file: File | null) {
    if (!file) return;
    const body = new FormData();
    body.set("photo", file);
    setPhotoError("");
    startTransition(async () => {
      const result = await savePortalAvatar(body);
      if (result.error) {
        setPhotoError(result.error);
        return;
      }
      setAvatarOverride(`/api/portal/avatar?v=${Date.now()}`);
      router.refresh();
    });
  }

  function removePhoto() {
    const body = new FormData();
    body.set("remove", "1");
    setPhotoError("");
    startTransition(async () => {
      const result = await savePortalAvatar(body);
      if (result.error) {
        setPhotoError(result.error);
        return;
      }
      setAvatarOverride(null);
      router.refresh();
    });
  }

  async function runPortalReset() {
    setResetting(true);
    setResetError("");
    setResetMessage("");
    try {
      const result = await resetClientPortal();
      if (result.error) {
        setResetError(result.error);
        return;
      }
      window.location.assign("/portal");
    } catch {
      setResetError(copy.resetFailed);
    } finally {
      setResetting(false);
    }
  }

  function handleMasterReset() {
    setResetError("");
    setResetMessage("");
    if (resetText.trim() !== "RESET") {
      setResetError(copy.resetNeedType);
      return;
    }
    setCsvPromptOpen(true);
  }

  async function handleSaveCsvBackup() {
    setSavingCsv(true);
    setResetError("");
    try {
      const result = await exportPortalRosterCsv();
      if (result.error || !result.csv) {
        setResetError(result.error || copy.resetFailed);
        return;
      }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `client-portal-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setCsvPromptOpen(false);
      if (!window.confirm(copy.confirmWipeSaved)) {
        setResetMessage(copy.resetCsvKept);
        return;
      }
      await runPortalReset();
    } catch {
      setResetError(copy.resetFailed);
    } finally {
      setSavingCsv(false);
    }
  }

  async function handleContinueReset() {
    setResetError("");
    if (!window.confirm(copy.confirmWipe)) {
      setCsvPromptOpen(false);
      setResetMessage(copy.resetKept);
      return;
    }
    await runPortalReset();
  }

  function closeDialog() {
    setDialog(null);
    setDialogError("");
    setShowCurrent(false);
    setShowNext(false);
    setCurrentPassword("");
    setNextPassword("");
    setConfirmPassword("");
    setNextEmail("");
    setContactEmail("");
  }

  const noticeText = notice ? copy.notices[notice] : "";

  return (
    <>
      <header className="od-settings-intro">
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </header>
      {noticeText ? <p className="od-settings-notice">{noticeText}</p> : null}
      <div className="od-settings">
      <SettingsNav
        labels={copy.sections}
        current={section}
        ariaLabel={copy.navLabel}
        onChange={openSection}
      />
      <div className="od-settings-main">

        {section === "profile" ? (
          <SettingsCard title={copy.profileTitle} description={copy.profileBody}>
            <div className="od-settings-photo">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" />
              ) : (
                <span aria-hidden="true">{(name || account.email).slice(0, 1).toUpperCase()}</span>
              )}
              <div>
                <p>{copy.photo}</p>
                <div className="od-settings-photo-actions">
                  <label>
                    {avatarUrl ? copy.replace : copy.photo}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => onPhoto(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  {avatarUrl ? (
                    <button type="button" onClick={removePhoto} disabled={pending}>
                      {copy.remove}
                    </button>
                  ) : null}
                </div>
                {photoError ? (
                  <p role="alert" className="od-settings-error">
                    {photoError}
                  </p>
                ) : null}
              </div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setError("");
                startTransition(async () => {
                  const result = await savePortalProfile({ name, businessName, phone });
                  finish(result, () => setBaseProfile({ name, businessName, phone }));
                });
              }}
            >
              <SettingsField label={copy.name}>
                <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} />
              </SettingsField>
              <SettingsField label={copy.business}>
                <input
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  maxLength={160}
                />
              </SettingsField>
              <SettingsField label={copy.phone}>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} />
              </SettingsField>
              <SettingsField label={copy.email} hint={copy.emailHint}>
                <input value={account.email} readOnly />
              </SettingsField>
              <button type="button" className="od-settings-textlink" onClick={() => openSection("security")}>
                {copy.emailLink}
              </button>
              <SettingsSaveBar
                dirty={profileDirty}
                pending={pending}
                saved={saved && !profileDirty}
                error={error}
                saveLabel={copy.save}
                savingLabel={copy.saving}
                savedLabel={copy.saved}
              />
            </form>
          </SettingsCard>
        ) : null}

        {section === "security" ? (
          <div className="od-settings-stack">
            <SettingsCard title={copy.securityTitle} description={copy.securityBody}>
              <p className="od-settings-readonly">
                <span>{copy.loginEmail}</span>
                <strong>{account.email}</strong>
              </p>
              {pendingEmail ? (
                <p className="od-settings-note">
                  {copy.pending} {pendingEmail}
                </p>
              ) : null}
              {account.hasPassword ? (
                <button type="button" onClick={() => setDialog("email")}>
                  {copy.changeEmail}
                </button>
              ) : (
                <p className="od-settings-note">{copy.googleEmail}</p>
              )}
            </SettingsCard>
            <SettingsCard title={copy.secondaryTitle} description={copy.secondaryBody}>
              {secondaryEmail ? (
                <p className="od-settings-readonly">
                  <span>{secondaryVerified ? copy.verified : copy.unverified}</span>
                  <strong>{secondaryEmail}</strong>
                </p>
              ) : null}
              <div className="od-settings-row">
                <button type="button" onClick={() => setDialog("secondary")}>
                  {secondaryEmail ? copy.replaceSecondary : copy.addSecondary}
                </button>
                {secondaryEmail ? (
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        const result = await clearSecondaryEmail();
                        if (!result.error) {
                          setSecondaryEmail("");
                          setSecondaryVerified(false);
                          router.refresh();
                        } else {
                          setError(result.error);
                        }
                      })
                    }
                  >
                    {copy.removeSecondary}
                  </button>
                ) : null}
              </div>
              {error ? (
                <p role="alert" className="od-settings-error">
                  {error}
                </p>
              ) : null}
            </SettingsCard>
            <SettingsCard title={copy.passwordTitle}>
              {account.hasPassword ? (
                <button type="button" onClick={() => setDialog("password")}>
                  {copy.changePassword}
                </button>
              ) : (
                <p className="od-settings-note">{copy.googlePassword}</p>
              )}
            </SettingsCard>
          </div>
        ) : null}

        {section === "notifications" ? (
          <SettingsCard title={copy.notesTitle} description={copy.notesBody}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                startTransition(async () => {
                  const result = await savePortalPreferences(prefs);
                  finish(result, () => setBasePrefs(prefs));
                });
              }}
            >
              <label className="od-settings-toggle">
                <input
                  type="checkbox"
                  checked={prefs.notifyInvoiceReminders}
                  onChange={(event) =>
                    setPrefs({ ...prefs, notifyInvoiceReminders: event.target.checked })
                  }
                />
                {copy.invoiceReminders}
              </label>
              <label className="od-settings-toggle">
                <input
                  type="checkbox"
                  checked={prefs.notifyProjectStatus}
                  onChange={(event) => setPrefs({ ...prefs, notifyProjectStatus: event.target.checked })}
                />
                {copy.projectStatus}
              </label>
              {[copy.marketing, copy.messages, copy.payments].map((label) => (
                <label key={label} className="od-settings-toggle is-disabled">
                  <input type="checkbox" disabled />
                  <span>
                    {label}
                    <small>{copy.unavailable}</small>
                  </span>
                </label>
              ))}
              <p className="od-settings-note">{copy.securityMail}</p>
              <SettingsSaveBar
                dirty={notesDirty}
                pending={pending}
                saved={saved && !notesDirty}
                error={error}
                saveLabel={copy.save}
                savingLabel={copy.saving}
                savedLabel={copy.saved}
              />
            </form>
          </SettingsCard>
        ) : null}

        {section === "billing" ? (
          <SettingsCard title={copy.billingTitle} description={copy.billingBody}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                startTransition(async () => {
                  const result = await savePortalBilling(billing);
                  finish(result, () => setBaseBilling(billing));
                });
              }}
            >
              <SettingsField label={copy.contact}>
                <input
                  value={billing.contactName}
                  onChange={(event) => setBilling({ ...billing, contactName: event.target.value })}
                  maxLength={120}
                />
              </SettingsField>
              <SettingsField label={copy.billingBusiness}>
                <input
                  value={billing.businessName}
                  onChange={(event) => setBilling({ ...billing, businessName: event.target.value })}
                  maxLength={160}
                />
              </SettingsField>
              <SettingsField label={copy.billingEmail}>
                <input
                  type="email"
                  value={billing.email}
                  onChange={(event) => setBilling({ ...billing, email: event.target.value })}
                  maxLength={200}
                />
              </SettingsField>
              <SettingsField label={copy.country}>
                <input
                  value={billing.country}
                  onChange={(event) => setBilling({ ...billing, country: event.target.value })}
                  maxLength={80}
                />
              </SettingsField>
              <SettingsField label={copy.street}>
                <input
                  value={billing.addressLine1}
                  onChange={(event) => setBilling({ ...billing, addressLine1: event.target.value })}
                  maxLength={120}
                  autoComplete="address-line1"
                />
              </SettingsField>
              <SettingsField label={copy.line2}>
                <input
                  value={billing.addressLine2}
                  onChange={(event) => setBilling({ ...billing, addressLine2: event.target.value })}
                  maxLength={120}
                  autoComplete="address-line2"
                />
              </SettingsField>
              <div className="od-settings-address">
                <SettingsField label={copy.city}>
                  <input
                    value={billing.city}
                    onChange={(event) => setBilling({ ...billing, city: event.target.value })}
                    maxLength={80}
                    autoComplete="address-level2"
                  />
                </SettingsField>
                <SettingsField label={copy.state}>
                  <select
                    value={billing.state}
                    onChange={(event) => setBilling({ ...billing, state: event.target.value })}
                    autoComplete="address-level1"
                  >
                    <option value="">{copy.selectState}</option>
                    {US_STATES.map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </SettingsField>
                <SettingsField label={copy.postal}>
                  <input
                    value={billing.postalCode}
                    onChange={(event) => setBilling({ ...billing, postalCode: event.target.value })}
                    maxLength={12}
                    autoComplete="postal-code"
                  />
                </SettingsField>
              </div>
              <SettingsSaveBar
                dirty={billingDirty}
                pending={pending}
                saved={saved && !billingDirty}
                error={error}
                saveLabel={copy.save}
                savingLabel={copy.saving}
                savedLabel={copy.saved}
              />
            </form>
          </SettingsCard>
        ) : null}

        {section === "data" ? (
          <div className="od-settings-stack">
            <SettingsCard title={copy.dataTitle} description={copy.dataBody}>
              <div className="od-settings-data-actions">
                <a className="od-settings-button" href="/api/portal/account-export">
                  {copy.download}
                </a>
                <label className="od-settings-button">
                  {pending ? copy.saving : copy.importCsv}
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    disabled={pending}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      event.target.value = "";
                      if (!file) return;
                      setImportError("");
                      setImported(false);
                      const body = new FormData();
                      body.set("file", file);
                      startTransition(async () => {
                        const response = await fetch("/api/portal/account-export", { method: "POST", body });
                        const result = (await response.json().catch(() => null)) as {
                          error?: string;
                          name?: string;
                          phone?: string;
                          businessName?: string;
                          billing?: {
                            contactName: string;
                            businessName: string;
                            email: string;
                            country: string;
                            addressLine1: string;
                            addressLine2: string;
                            city: string;
                            state: string;
                            postalCode: string;
                          };
                          notifyProjectStatus?: boolean;
                          notifyInvoiceReminders?: boolean;
                        } | null;
                        if (!response.ok || !result || result.error || !result.billing) {
                          setImportError(result?.error || "Could not import that CSV.");
                          return;
                        }
                        const nextProfile = {
                          name: result.name ?? "",
                          phone: result.phone ?? "",
                          businessName: result.businessName ?? "",
                        };
                        const nextPrefs = {
                          ...prefs,
                          notifyProjectStatus: Boolean(result.notifyProjectStatus),
                          notifyInvoiceReminders: Boolean(result.notifyInvoiceReminders),
                        };
                        setName(nextProfile.name);
                        setPhone(nextProfile.phone);
                        setBusinessName(nextProfile.businessName);
                        setBaseProfile(nextProfile);
                        setBilling(result.billing);
                        setBaseBilling(result.billing);
                        setPrefs(nextPrefs);
                        setBasePrefs(nextPrefs);
                        setImported(true);
                        router.refresh();
                      });
                    }}
                  />
                </label>
              </div>
              {imported && !importError ? <p className="od-settings-note">{copy.imported}</p> : null}
              {importError ? (
                <p role="alert" className="od-settings-error">
                  {importError}
                </p>
              ) : null}
            </SettingsCard>
            <SettingsCard title={copy.deleteTitle} description={copy.deleteBody}>
              <div className="od-settings-reset">
                <SettingsField label={copy.resetLabel}>
                  <input
                    value={resetText}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) => setResetText(event.target.value)}
                  />
                </SettingsField>
                <button
                  type="button"
                  className="od-settings-danger"
                  disabled={resetting || savingCsv}
                  onClick={handleMasterReset}
                >
                  {resetting ? copy.resetting : copy.resetAction}
                </button>
              </div>
              {resetMessage ? <p className="od-settings-note">{resetMessage}</p> : null}
              {resetError ? (
                <p role="alert" className="od-settings-error">
                  {resetError}
                </p>
              ) : null}
            </SettingsCard>
          </div>
        ) : null}
      </div>

      <SettingsDialog
        open={dialog === "email"}
        title={copy.changeEmail}
        description={copy.securityBody}
        closeLabel={copy.close}
        onClose={closeDialog}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setDialogError("");
            startTransition(async () => {
              const result = await saveEmailChange({ email: nextEmail, currentPassword });
              if (result.error) {
                setDialogError(result.error);
                return;
              }
              setPendingEmail(nextEmail.trim().toLowerCase());
              closeDialog();
              router.refresh();
            });
          }}
        >
          <SettingsField label={copy.newEmail}>
            <input type="email" value={nextEmail} onChange={(event) => setNextEmail(event.target.value)} required />
          </SettingsField>
          <PasswordField
            label={copy.currentPassword}
            value={currentPassword}
            shown={showCurrent}
            showLabel={copy.show}
            hideLabel={copy.hide}
            onToggle={() => setShowCurrent((value) => !value)}
            onChange={setCurrentPassword}
          />
          {dialogError ? (
            <p role="alert" className="od-settings-error">
              {dialogError}
            </p>
          ) : null}
          <button type="submit" disabled={pending}>
            {pending ? copy.saving : copy.sendLink}
          </button>
        </form>
      </SettingsDialog>

      <SettingsDialog
        open={dialog === "secondary"}
        title={secondaryEmail ? copy.replaceSecondary : copy.addSecondary}
        description={copy.secondaryBody}
        closeLabel={copy.close}
        onClose={closeDialog}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setDialogError("");
            startTransition(async () => {
              const result = await saveSecondaryEmail({ email: contactEmail });
              if (result.error) {
                setDialogError(result.error);
                return;
              }
              setSecondaryEmail(contactEmail.trim().toLowerCase());
              setSecondaryVerified(false);
              closeDialog();
              router.refresh();
            });
          }}
        >
          <SettingsField label={copy.email}>
            <input
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              required
            />
          </SettingsField>
          {dialogError ? (
            <p role="alert" className="od-settings-error">
              {dialogError}
            </p>
          ) : null}
          <button type="submit" disabled={pending}>
            {pending ? copy.saving : copy.sendLink}
          </button>
        </form>
      </SettingsDialog>

      <SettingsDialog
        open={dialog === "password"}
        title={copy.changePassword}
        closeLabel={copy.close}
        onClose={closeDialog}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setDialogError("");
            startTransition(async () => {
              const result = await savePasswordChange({
                currentPassword,
                nextPassword,
                confirmPassword,
              });
              if (result.error) {
                setDialogError(result.error);
                return;
              }
              closeDialog();
            });
          }}
        >
          <PasswordField
            label={copy.currentPassword}
            value={currentPassword}
            shown={showCurrent}
            showLabel={copy.show}
            hideLabel={copy.hide}
            onToggle={() => setShowCurrent((value) => !value)}
            onChange={setCurrentPassword}
          />
          <PasswordField
            label={copy.nextPassword}
            value={nextPassword}
            shown={showNext}
            showLabel={copy.show}
            hideLabel={copy.hide}
            onToggle={() => setShowNext((value) => !value)}
            onChange={setNextPassword}
          />
          <SettingsField label={copy.confirmPassword}>
            <input
              type={showNext ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </SettingsField>
          {dialogError ? (
            <p role="alert" className="od-settings-error">
              {dialogError}
            </p>
          ) : null}
          <button type="submit" disabled={pending}>
            {pending ? copy.saving : copy.save}
          </button>
        </form>
      </SettingsDialog>

      <SettingsDialog
        open={csvPromptOpen}
        title={copy.csvTitle}
        description={copy.csvBody}
        closeLabel={copy.close}
        onClose={() => {
          if (resetting || savingCsv) return;
          setCsvPromptOpen(false);
        }}
      >
        <div className="od-settings-reset-actions">
          <button
            type="button"
            disabled={resetting || savingCsv}
            onClick={() => setCsvPromptOpen(false)}
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            className="od-settings-reset-save"
            disabled={resetting || savingCsv}
            onClick={() => void handleSaveCsvBackup()}
          >
            {savingCsv ? copy.csvSaving : copy.csvSave}
          </button>
          <button
            type="button"
            className="od-settings-danger"
            disabled={resetting || savingCsv}
            onClick={() => void handleContinueReset()}
          >
            {resetting ? copy.resetting : copy.csvReset}
          </button>
        </div>
      </SettingsDialog>
      </div>
    </>
  );
}

function PasswordField({
  label,
  value,
  shown,
  showLabel,
  hideLabel,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  shown: boolean;
  showLabel: string;
  hideLabel: string;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <SettingsField label={label}>
      <span className="od-settings-password">
        <input
          type={shown ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="current-password"
          required
        />
        <button type="button" onClick={onToggle}>
          {shown ? hideLabel : showLabel}
        </button>
      </span>
    </SettingsField>
  );
}
