import type { Locale } from "@/lib/locale";

const servicesEn = [
  {
    title: "Websites",
    service: "Website Development",
    plans: [
      {
        name: "Essentials",
        price: "$199",
        items: [
          ["Landing pages", "Promote a service, product, event, or special offer."],
          ["Appointment booking", "Customers pick an open time and request a visit."],
          ["Mobile-friendly design", "Layouts that fit phones, tablets, and desktops."],
        ],
      },
      {
        name: "Business site",
        price: "$299",
        items: [
          ["Company website", "Services, portfolio, and contact details in one place."],
          ["Appointment booking", "Customers pick an open time and request a visit."],
          ["Mobile-friendly design", "Layouts that fit phones, tablets, and desktops."],
        ],
      },
    ],
  },
  {
    title: "Dashboards",
    service: "Dashboards & CRMs",
    plans: [
      {
        name: "Dashboard",
        price: "$299",
        items: [
          ["Business dashboard", "Metrics, activity, and performance in one place."],
          ["Lead management", "Collect, organize, and track prospective customers."],
          ["Sales pipeline", "Follow each opportunity from inquiry to closed sale."],
        ],
      },
      {
        name: "Dashboard + CRM",
        price: "$799",
        items: [
          ["Everything in Dashboard", "Metrics, leads, and the sales pipeline."],
          ["Job tracking", "Assignments, deadlines, status, and completion."],
          ["Team workflows", "Assign work and manage the process."],
          ["Reports", "Review sales, workload, and performance."],
        ],
      },
    ],
  },
  {
    title: "Apps & software",
    service: "Apps & Software",
    plans: [
      {
        name: "Starter build",
        price: "$499",
        items: [
          ["Web application", "A browser tool for customers and employees."],
          ["MVP", "A first version with the essential features."],
          ["Internal tool", "Replace a repetitive spreadsheet or manual process."],
        ],
      },
      {
        name: "Full system",
        price: "$1,499",
        items: [
          ["Operations", "Inventory, invoices, and payment status."],
          ["Customers", "Booking, memberships, and account access."],
          ["Connections", "Email, calendar, payments, and other services."],
          ["Automation", "Notifications, updates, and routine actions."],
          ["Mobile app", "An app shaped to the platform and features you need."],
        ],
      },
    ],
  },
];

const servicesEs = [
  {
    title: "Sitios web",
    service: "Website Development",
    plans: [
      {
        name: "Esencial",
        price: "$199",
        items: [
          ["Páginas de aterrizaje", "Promociona un servicio, producto, evento u oferta."],
          ["Reservas", "El cliente elige un horario y solicita una visita."],
          ["Diseño adaptable", "Se ve bien en el teléfono, la tablet y el escritorio."],
        ],
      },
      {
        name: "Sitio de negocio",
        price: "$299",
        items: [
          ["Sitio de la empresa", "Servicios, portafolio y contacto en un solo lugar."],
          ["Reservas", "El cliente elige un horario y solicita una visita."],
          ["Diseño adaptable", "Se ve bien en el teléfono, la tablet y el escritorio."],
        ],
      },
    ],
  },
  {
    title: "Paneles",
    service: "Dashboards & CRMs",
    plans: [
      {
        name: "Panel",
        price: "$299",
        items: [
          ["Panel del negocio", "Métricas, actividad y rendimiento en un solo lugar."],
          ["Gestión de leads", "Reúne, organiza y da seguimiento a posibles clientes."],
          ["Embudo de ventas", "Sigue cada oportunidad desde la consulta hasta el cierre."],
        ],
      },
      {
        name: "Panel + CRM",
        price: "$799",
        items: [
          ["Todo lo del panel", "Métricas, leads y el embudo de ventas."],
          ["Seguimiento de trabajos", "Asignaciones, fechas, estado y cierre."],
          ["Flujos del equipo", "Asigna el trabajo y gestiona el proceso."],
          ["Informes", "Revisa ventas, carga de trabajo y rendimiento."],
        ],
      },
    ],
  },
  {
    title: "Apps y software",
    service: "Apps & Software",
    plans: [
      {
        name: "Versión inicial",
        price: "$499",
        items: [
          ["Aplicación web", "Una herramienta en el navegador para clientes y el equipo."],
          ["MVP", "Una primera versión con las funciones esenciales."],
          ["Herramienta interna", "Reemplaza una hoja de cálculo o un proceso manual."],
        ],
      },
      {
        name: "Sistema completo",
        price: "$1,499",
        items: [
          ["Operaciones", "Inventario, facturas y estado de pagos."],
          ["Clientes", "Reservas, membresías y acceso a la cuenta."],
          ["Conexiones", "Correo, calendario, pagos y otros servicios."],
          ["Automatización", "Avisos, actualizaciones y acciones rutinarias."],
          ["App móvil", "Una app según la plataforma y las funciones que necesitas."],
        ],
      },
    ],
  },
];

export function pricingContent(locale: Locale) {
  const es = locale === "es";
  return {
    title: es ? "Precios | Over Drive" : "Pricing | Over Drive",
    description: es
      ? "Precios iniciales de sitios web, paneles, apps y diseño de marca."
      : "Starting prices for websites, dashboards, apps, and brand design.",
    homeAria: es ? "Inicio de Over Drive" : "Over Drive home",
    tagline: "design · build · support",
    kicker: es ? "Sitios · Software · Servicios creativos" : "Websites · Software · Creative services",
    hero: es ? ["TU NEGOCIO.", "EN OVER DRIVE."] : ["YOUR BUSINESS.", "IN OVER DRIVE."],
    heroLead: es
      ? "Precios iniciales para un alcance definido. El hosting, los dominios, las herramientas de pago y la publicidad se cobran aparte."
      : "Starting prices for a defined scope. Hosting, domains, paid tools, and ad spend are billed separately.",
    from: es ? "Desde" : "From",
    services: es ? servicesEs : servicesEn,
    brandService: "UI/UX & Branding",
    brandTitle: es ? "Logo y diseño de marca" : "Logo + brand design",
    brandName: es ? "Esencial de marca" : "Brand essentials",
    brandItems: es
      ? [
          ["Logo a medida", "Un logo que refleja la identidad y los valores de tu marca."],
          ["Colores y tipografía", "Una paleta y unas fuentes que definen el estilo."],
          ["Piezas de marketing", "Tarjetas, volantes y gráficos para redes."],
          ["Flujos del equipo", "Una forma simple de asignar el trabajo y gestionar el proceso."],
        ]
      : [
          ["Custom logo", "A logo that reflects your brand’s identity and values."],
          ["Colors and type", "A palette and fonts that define the look."],
          ["Marketing essentials", "Business cards, flyers, and social graphics."],
          ["Team workflows", "A simple way to assign work and manage the process."],
        ],
    note: es
      ? "Las funciones a medida, las apps nativas y los sistemas más grandes se cotizan aparte."
      : "Custom features, native mobile apps, and larger systems are quoted separately.",
    startTitle: es ? ["EMPECEMOS", "AHORA."] : ["LET’S GET", "STARTED."],
    startLead: es ? "Un camino claro de la idea al lanzamiento." : "A clear path from idea to launch.",
    steps: es
      ? [
          ["01", "Revisar y firmar", "Confirma el alcance, los servicios y las condiciones de pago. Firma en línea o en persona."],
          ["02", "Asegurar el proyecto", "Un depósito del 50% inicia el trabajo. Paga por Zelle, Stripe, el portal de Over Drive, Cash App, PayPal o Venmo."],
          ["03", "Enviar dominio y contactos", "Comparte el dominio, un nombre principal, correo y teléfono. Indica las cuentas de correo del negocio."],
          ["04", "Crear las cuentas del proyecto", "Creamos un Gmail para el proyecto y coordinamos el acceso. Tú conservas la propiedad y la recuperación."],
          ["05", "Activar la facturación", "Entra a los servicios, termina la verificación y agrega tu método de pago cuando haya una suscripción."],
          ["06", "Enviar tu contenido", "Logos, textos, biografías, imágenes, colores y referencias en una carpeta."],
        ]
      : [
          ["01", "Review and sign", "Confirm the scope, services, and payment terms. Sign online or in person."],
          ["02", "Secure the project", "A 50% deposit starts the work. Pay by Zelle, Stripe, the Over Drive portal, Cash App, PayPal, or Venmo."],
          ["03", "Send domain and contacts", "Share the domain you want, a primary name, email, and phone. List the business email accounts you need."],
          ["04", "Set up project accounts", "We create a Gmail account for the project and coordinate access. You keep ownership and recovery."],
          ["05", "Activate billing", "Sign in to the services, finish verification, and add your payment method where a subscription is required."],
          ["06", "Send your content", "Logos, copy, bios, images, colors, and references in one folder."],
        ],
    expectTitle: es ? "Qué esperar" : "What to expect",
    facts: es
      ? [
          ["3–5 días hábiles", "El plazo empieza cuando hay acuerdo, depósito, accesos y materiales. Los proyectos complejos tienen su propio calendario."],
          ["3 rondas de revisión", "Tres rondas van incluidas en el alcance aprobado. Las rondas extra cuestan $25. Las funciones nuevas se cotizan aparte."],
          ["Las cuentas siguen siendo tuyas", "Gmail, Vercel, GitHub, Supabase y Stripe quedan a tu nombre."],
        ]
      : [
          ["3–5 business days", "The clock starts after the agreement, deposit, access, and materials are in. Complex projects get their own timeline."],
          ["3 revision rounds", "Three rounds are included in the approved scope. Extra rounds are $25 each. New features are quoted separately."],
          ["Accounts stay yours", "Gmail, Vercel, GitHub, Supabase, and Stripe stay in your name."],
        ],
    expectNote: es
      ? "Los dominios, el correo del negocio, el hosting y las suscripciones de terceros se cobran aparte, salvo que la propuesta los incluya."
      : "Domains, business email, hosting, and third-party subscriptions are billed separately unless the proposal includes them.",
    footTitle: es ? "CONSTRUYAMOS TU PRÓXIMO PASO." : "LET’S BUILD YOUR NEXT MOVE.",
    consult: es ? "Agendar una consulta" : "Book a consultation",
    quote: es ? "Pedir una cotización" : "Request a quote",
    fine: es
      ? "Precios iniciales propuestos para alcances definidos. El hosting, los dominios, las herramientas de pago y la publicidad se cobran aparte."
      : "Proposed starting prices for defined scopes. Hosting, domains, paid tools, and ad spend are billed separately.",
  };
}
