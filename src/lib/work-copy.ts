import type { Locale } from "@/lib/locale";

type PropertyStudy = {
  kind: "property";
  title: string;
  detail: string;
  url: string;
  brand: string;
  links: string[];
  search: string;
  searchButton: string;
  listings: { price: string; specs: string; place: string }[];
};

type DashboardStudy = {
  kind: "dashboard";
  title: string;
  detail: string;
  url: string;
  screenTitle: string;
  nav: string[];
  stats: [string, string, string][];
  chart: string;
  columns: [string, string, string];
  rows: [string, string, string][];
};

type BookingStudy = {
  kind: "booking";
  title: string;
  detail: string;
  url: string;
  screenTitle: string;
  month: string;
  weekdays: string[];
  service: string;
  duration: string;
  times: string[];
  selected: number;
  confirm: string;
};

type PortalStudy = {
  kind: "portal";
  title: string;
  detail: string;
  url: string;
  project: string;
  status: string;
  progressLabel: string;
  progress: string;
  filesLabel: string;
  files: [string, string][];
  invoiceLabel: string;
  invoice: string;
  amount: string;
  steps: [string, string][];
};

export type WorkStudy = PropertyStudy | DashboardStudy | BookingStudy | PortalStudy;

type WorkCopy = {
  title: string;
  description: string;
  homeAria: string;
  pricing: string;
  quote: string;
  kicker: string;
  hero: [string, string];
  lead: string;
  studies: WorkStudy[];
};

const en: WorkCopy = {
  title: "Work | Over Drive",
  description: "Website and product templates for search, dashboards, booking, and client portals.",
  homeAria: "Over Drive home",
  pricing: "Pricing",
  quote: "Request a quote",
  kicker: "Selected work",
  hero: ["A CLOSER LOOK", "AT WHAT WE BUILD."],
  lead: "Website and product templates for the systems a company uses with its customers and its team.",
  studies: [
    {
      kind: "property",
      title: "Real estate search",
      detail: "Listing site with search and property cards",
      url: "homes.example",
      brand: "NEST",
      links: ["Buy", "Rent", "Saved"],
      search: "City, neighborhood, or address",
      searchButton: "Search",
      listings: [
        { price: "$890,000", specs: "3 bd · 2 ba · 1,840 sf", place: "Maple Street" },
        { price: "$1,240,000", specs: "4 bd · 3 ba · 2,610 sf", place: "Oak Avenue" },
        { price: "$640,000", specs: "2 bd · 2 ba · 1,120 sf", place: "Pine Road" },
      ],
    },
    {
      kind: "dashboard",
      title: "Operations dashboard",
      detail: "Pipeline, revenue, and deal table",
      url: "pipeline.example",
      screenTitle: "Sales",
      nav: ["Overview", "Pipeline", "Clients", "Invoices"],
      stats: [
        ["New leads", "124", "+18"],
        ["Active deals", "32", "+4"],
        ["Revenue", "$284K", "+12%"],
      ],
      chart: "Sales trend",
      columns: ["Deal", "Stage", "Value"],
      rows: [
        ["Riverside Properties", "Proposal", "$48,000"],
        ["Maple Grove", "Discovery", "$12,500"],
        ["Cobalt Media", "Active", "$86,000"],
      ],
    },
    {
      kind: "booking",
      title: "Appointment booking",
      detail: "Calendar, open times, and confirmation",
      url: "book.example",
      screenTitle: "Book a visit",
      month: "October 2026",
      weekdays: ["S", "M", "T", "W", "T", "F", "S"],
      service: "Consultation · 45 min",
      duration: "45 min",
      times: ["Tue 10:00", "Tue 14:30", "Wed 09:00", "Thu 11:15"],
      selected: 1,
      confirm: "Confirm Tue 14:30",
    },
    {
      kind: "portal",
      title: "Client portal",
      detail: "Project progress, files, and invoice",
      url: "portal.example",
      project: "Website redesign",
      status: "In progress",
      progressLabel: "Delivery",
      progress: "68%",
      filesLabel: "Files",
      files: [
        ["Homepage draft", "Updated today"],
        ["Brand notes", "Shared by you"],
        ["Launch checklist", "3 items open"],
      ],
      invoiceLabel: "Invoice",
      invoice: "Deposit",
      amount: "$2,400 due",
      steps: [
        ["Design", "Done"],
        ["Build", "Active"],
        ["Review", "Next"],
      ],
    },
  ],
};

const es: WorkCopy = {
  title: "Trabajo | Over Drive",
  description: "Plantillas de sitios y productos para búsqueda, paneles, reservas y portales.",
  homeAria: "Inicio de Over Drive",
  pricing: "Precios",
  quote: "Pedir una cotización",
  kicker: "Trabajo seleccionado",
  hero: ["UN VISTAZO", "A LO QUE CONSTRUIMOS."],
  lead: "Plantillas de sitios y productos para los sistemas que una empresa usa con sus clientes y su equipo.",
  studies: [
    {
      kind: "property",
      title: "Búsqueda inmobiliaria",
      detail: "Sitio de listados con búsqueda y fichas",
      url: "homes.example",
      brand: "NEST",
      links: ["Comprar", "Rentar", "Guardados"],
      search: "Ciudad, barrio o dirección",
      searchButton: "Buscar",
      listings: [
        { price: "$890,000", specs: "3 rec · 2 ba · 1,840 sf", place: "Maple Street" },
        { price: "$1,240,000", specs: "4 rec · 3 ba · 2,610 sf", place: "Oak Avenue" },
        { price: "$640,000", specs: "2 rec · 2 ba · 1,120 sf", place: "Pine Road" },
      ],
    },
    {
      kind: "dashboard",
      title: "Panel de operaciones",
      detail: "Embudo, ingresos y tabla de tratos",
      url: "pipeline.example",
      screenTitle: "Ventas",
      nav: ["Resumen", "Embudo", "Clientes", "Facturas"],
      stats: [
        ["Leads nuevos", "124", "+18"],
        ["Tratos activos", "32", "+4"],
        ["Ingresos", "$284K", "+12%"],
      ],
      chart: "Tendencia de ventas",
      columns: ["Trato", "Etapa", "Valor"],
      rows: [
        ["Riverside Properties", "Propuesta", "$48,000"],
        ["Maple Grove", "Descubrimiento", "$12,500"],
        ["Cobalt Media", "Activo", "$86,000"],
      ],
    },
    {
      kind: "booking",
      title: "Reservas",
      detail: "Calendario, horarios y confirmación",
      url: "book.example",
      screenTitle: "Reservar una visita",
      month: "Octubre 2026",
      weekdays: ["D", "L", "M", "X", "J", "V", "S"],
      service: "Consulta · 45 min",
      duration: "45 min",
      times: ["Mar 10:00", "Mar 14:30", "Mié 09:00", "Jue 11:15"],
      selected: 1,
      confirm: "Confirmar mar 14:30",
    },
    {
      kind: "portal",
      title: "Portal del cliente",
      detail: "Avance, archivos y factura",
      url: "portal.example",
      project: "Rediseño del sitio",
      status: "En curso",
      progressLabel: "Entrega",
      progress: "68%",
      filesLabel: "Archivos",
      files: [
        ["Borrador de inicio", "Actualizado hoy"],
        ["Notas de marca", "Compartido por ti"],
        ["Lista de lanzamiento", "3 puntos abiertos"],
      ],
      invoiceLabel: "Factura",
      invoice: "Depósito",
      amount: "$2,400 pendiente",
      steps: [
        ["Diseño", "Listo"],
        ["Construcción", "Activo"],
        ["Revisión", "Siguiente"],
      ],
    },
  ],
};

export function workContent(locale: Locale) {
  return locale === "es" ? es : en;
}
