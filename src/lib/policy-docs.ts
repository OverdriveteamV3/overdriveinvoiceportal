import type { Locale } from "@/lib/locale";

export type PolicySection = {
  heading: string;
  paragraphs: string[];
  items?: string[];
  part?: boolean;
};

export type PolicyDoc = {
  title: string;
  description: string;
  sections: PolicySection[];
};

const contactEn = "Over Drive IO. Website: www.overdriveio.com. Email: admin@overdriveio.com. Phone: 347.822.0528.";
const contactEs = "Over Drive IO. Sitio: www.overdriveio.com. Correo: admin@overdriveio.com. Teléfono: 347.822.0528.";

const privacyEn: PolicyDoc = {
  title: "Privacy Policy",
  description: "How Over Drive IO collects, uses, and shares personal information.",
  sections: [
    {
      heading: "",
      paragraphs: [
        "Over Drive IO (“Over Drive,” “we,” “us,” or “our”) respects your privacy. This Privacy Policy explains how we collect, use, disclose, and handle personal information through www.overdriveio.com, our client onboarding process, and our website development, software, design, and support services.",
      ],
    },
    {
      heading: "1. Information we collect",
      paragraphs: [
        "Depending on how you interact with us, we may collect the information below. Please provide only information reasonably necessary for your project. Do not submit sensitive personal information unless we have agreed on an appropriate method and purpose for handling it.",
      ],
      items: [
        "Contact information: your name, business name, email address, phone number, and billing address.",
        "Project information: service requests, business descriptions, project requirements, domain preferences, design references, and communications.",
        "Submitted materials: logos, images, biographies, website copy, documents, and other content you provide.",
        "Account and access information: account identifiers, project email addresses, developer invitations, permissions, and information needed to configure or support your project.",
        "Payment and transaction information: invoice details, payment status, transaction references, and limited payment information provided by payment services.",
        "Technical information: IP addresses, browser and device information, access logs, and activity recorded by our website infrastructure or enabled analytics tools.",
        "Support information: messages, troubleshooting details, and records related to service requests.",
      ],
    },
    {
      heading: "2. How we use information",
      paragraphs: [
        "We use information to respond to inquiries and prepare proposals; create and manage client relationships; process onboarding, agreements, invoices, and payments; design, develop, deploy, maintain, and support projects; configure authorized domains, business email, hosting, databases, and integrations; communicate about project progress, approvals, revisions, and service matters; maintain website functionality, troubleshoot problems, and improve our services; protect accounts, investigate misuse, and prevent fraud; and maintain business records, resolve disputes, and meet applicable legal obligations. Where required, we obtain consent before using information for a purpose that requires it.",
      ],
    },
    {
      heading: "3. Project accounts and developer access",
      paragraphs: [
        "Projects may use third-party services such as Google or Gmail, Vercel, GitHub, Supabase, Stripe, domain registrars, and business email providers. Clients should retain control of their account ownership, billing, recovery information, and administrative settings. Where supported, access should be provided through team invitations and role-based permissions.",
        "Add payment methods directly through the relevant provider’s secure website. Do not send full payment card details, account recovery codes, or passwords through ordinary project forms or email. We use authorized account access to perform agreed development, configuration, maintenance, or support work.",
      ],
    },
    {
      heading: "4. Payment services",
      paragraphs: [
        "Payments may be accepted through Stripe, Zelle, Cash App, PayPal, Venmo, or other methods identified on your invoice. Electronic payment services process financial information under their own privacy policies and terms. We may receive information needed to confirm payment, manage billing, issue refunds where applicable, and maintain transaction records.",
      ],
    },
    {
      heading: "5. When we share information",
      paragraphs: [
        "We may disclose information to service providers supporting hosting, communications, file storage, payments, project management, analytics, or other business operations; to authorized project personnel who need access to perform agreed services; at your direction when configuring accounts, integrations, deployments, or other requested features; to professional advisers where reasonably necessary for accounting, legal, insurance, or related business matters; for legal or security purposes when reasonably necessary to comply with applicable requirements, address fraud or misuse, or protect rights and safety; and during a business transaction such as a merger, acquisition, or transfer of business assets, subject to applicable protections. The information shared depends on the service involved and the purpose of the disclosure.",
      ],
    },
    {
      heading: "6. Cookies and similar technologies",
      paragraphs: [
        "Our website and integrated services may use cookies, local storage, server logs, or similar technologies to support functionality, remember preferences, maintain security, and understand website use. Your browser may allow you to block or delete cookies. Disabling certain technologies may affect website features.",
        "Where applicable law requires consent or privacy choices for particular tracking activities, those activities must be managed through the appropriate controls. Third-party services may also provide their own privacy settings.",
      ],
    },
    {
      heading: "7. Client data processed during projects",
      paragraphs: [
        "When we access personal information on behalf of a client — for example, information in a CRM, application database, or customer support system — we handle that information according to the applicable project agreement and authorized instructions. The client is responsible for determining the purposes of its own data collection and providing appropriate notices and permissions.",
        "If your information is held in a system operated by one of our clients, contact that business first about access, correction, or deletion requests. We will assist the client where appropriate under our agreement and applicable law.",
      ],
    },
    {
      heading: "8. Information retention",
      paragraphs: [
        "We retain information for as long as reasonably necessary for the purposes described in this policy, including providing services, maintaining business records, resolving disputes, and meeting legal obligations. Retention periods vary by information type and project requirements. Copies may remain in backups until the applicable backup cycle expires.",
        "Ending a project does not automatically delete records we need to retain. Information held in client-owned third-party accounts is also subject to the client’s settings and the provider’s policies.",
      ],
    },
    {
      heading: "9. Security",
      paragraphs: [
        "We use reasonable safeguards appropriate to the information and services involved. No method of electronic storage or transmission is completely secure, and we cannot guarantee absolute security. Clients should use strong passwords, enable multifactor authentication where available, and notify us promptly if project access may have been compromised.",
      ],
    },
    {
      heading: "10. Your privacy choices and rights",
      paragraphs: [
        "Depending on your location and applicable law, you may have rights to request access to, correction of, deletion of, or a copy of certain personal information. Other rights may include restricting or objecting to certain processing, withdrawing consent, or opting out of certain data uses.",
        "Contact admin@overdriveio.com to submit a request. We may need to verify your identity and authority before responding. Certain information may be retained or requests limited where permitted or required by law. If applicable law provides an appeal right, you may contact us at the same address to request review of our response.",
        "You may unsubscribe from promotional emails using the instructions provided. We may still send necessary billing, security, and project communications.",
      ],
    },
    {
      heading: "11. Third-party websites and services",
      paragraphs: [
        "Our website and project workflows may link to or use third-party platforms. Their collection and handling of information are governed by their own policies. Review those policies before submitting information or connecting accounts.",
      ],
    },
    {
      heading: "12. Children’s privacy",
      paragraphs: [
        "Our services are intended for businesses and adults seeking professional services. We do not knowingly collect personal information from children under 13 through our own website. If you believe a child has provided personal information to us, contact us so we can review and address the matter.",
      ],
    },
    {
      heading: "13. International processing",
      paragraphs: [
        "Information may be processed in locations where we or our service providers operate. Privacy laws may differ between locations. Where applicable law requires safeguards for international transfers, those requirements apply.",
      ],
    },
    {
      heading: "14. Changes to this policy",
      paragraphs: [
        "We may update this policy to reflect changes in our services, practices, or applicable requirements. The current version will be available on this page. Where required, we will provide additional notice or obtain consent for material changes.",
      ],
    },
    {
      heading: "15. Contact us",
      paragraphs: [`For privacy questions or requests, contact ${contactEn}`],
    },
  ],
};

const privacyEs: PolicyDoc = {
  title: "Política de privacidad",
  description: "Cómo Over Drive IO recoge, usa y comparte información personal.",
  sections: [
    {
      heading: "",
      paragraphs: [
        "Over Drive IO (“Over Drive”, “nosotros” o “nuestro”) respeta tu privacidad. Esta política explica cómo recogemos, usamos, divulgamos y tratamos la información personal a través de www.overdriveio.com, el proceso de inicio con el cliente y nuestros servicios de sitios, software, diseño y soporte.",
      ],
    },
    {
      heading: "1. Información que recogemos",
      paragraphs: [
        "Según cómo interactúes con nosotros, podemos recoger la información de abajo. Envía solo lo que sea razonablemente necesario para el proyecto. No envíes información personal sensible salvo que hayamos acordado un método y un fin adecuados para tratarla.",
      ],
      items: [
        "Contacto: nombre, empresa, correo, teléfono y dirección de facturación.",
        "Proyecto: solicitudes, descripción del negocio, requisitos, preferencias de dominio, referencias de diseño y comunicaciones.",
        "Materiales: logos, imágenes, biografías, textos, documentos y otro contenido que nos des.",
        "Cuentas y accesos: identificadores, correos del proyecto, invitaciones de desarrollador, permisos y lo necesario para configurar o dar soporte.",
        "Pagos: datos de factura, estado del pago, referencias de la transacción e información limitada que entreguen los servicios de pago.",
        "Datos técnicos: direcciones IP, navegador y dispositivo, registros de acceso y actividad de la infraestructura del sitio o de las analíticas activadas.",
        "Soporte: mensajes, detalles de diagnóstico y registros de solicitudes de servicio.",
      ],
    },
    {
      heading: "2. Cómo usamos la información",
      paragraphs: [
        "Usamos la información para responder consultas y preparar propuestas; crear y administrar la relación con el cliente; tramitar el inicio, los acuerdos, las facturas y los pagos; diseñar, desarrollar, publicar, mantener y dar soporte a los proyectos; configurar dominios, correo del negocio, hosting, bases de datos e integraciones autorizadas; comunicar avances, aprobaciones, revisiones y asuntos del servicio; mantener el sitio, resolver problemas y mejorar los servicios; proteger cuentas, investigar el mal uso y prevenir el fraude; y conservar registros, resolver disputas y cumplir obligaciones legales. Cuando haga falta, pedimos consentimiento antes de usar la información para un fin que lo exija.",
      ],
    },
    {
      heading: "3. Cuentas del proyecto y acceso del desarrollador",
      paragraphs: [
        "Los proyectos pueden usar servicios de terceros como Google o Gmail, Vercel, GitHub, Supabase, Stripe, registradores de dominio y proveedores de correo. El cliente debe conservar la propiedad de la cuenta, la facturación, la recuperación y la administración. Cuando el servicio lo permita, el acceso se da con invitaciones de equipo y permisos por rol.",
        "Agrega los métodos de pago directamente en el sitio seguro del proveedor. No envíes el número completo de la tarjeta, códigos de recuperación ni contraseñas por formularios ordinarios o por correo. Usamos el acceso autorizado para hacer el desarrollo, la configuración, el mantenimiento o el soporte acordados.",
      ],
    },
    {
      heading: "4. Servicios de pago",
      paragraphs: [
        "Los pagos pueden recibirse por Stripe, Zelle, Cash App, PayPal, Venmo u otros métodos indicados en la factura. Esos servicios tratan la información financiera según sus propias políticas y términos. Podemos recibir lo necesario para confirmar el pago, administrar la facturación, emitir reembolsos cuando corresponda y conservar el registro de la transacción.",
      ],
    },
    {
      heading: "5. Cuándo compartimos información",
      paragraphs: [
        "Podemos divulgar información a proveedores que apoyan hosting, comunicaciones, archivos, pagos, gestión del proyecto, analíticas u otras operaciones; al personal autorizado que necesite acceso para prestar el servicio; por tu instrucción al configurar cuentas, integraciones, publicaciones u otras funciones pedidas; a asesores profesionales cuando sea razonablemente necesario para contabilidad, asuntos legales, seguros u otros temas del negocio; por motivos legales o de seguridad cuando sea razonablemente necesario para cumplir requisitos aplicables, atender fraude o mal uso, o proteger derechos y seguridad; y en una operación empresarial como una fusión, adquisición o transferencia de activos, con las protecciones aplicables. Lo que se comparte depende del servicio y del fin de la divulgación.",
      ],
    },
    {
      heading: "6. Cookies y tecnologías similares",
      paragraphs: [
        "El sitio y los servicios integrados pueden usar cookies, almacenamiento local, registros del servidor o tecnologías similares para funcionar, recordar preferencias, mantener la seguridad y entender el uso del sitio. El navegador puede permitir bloquear o borrar cookies. Desactivar algunas tecnologías puede afectar funciones del sitio.",
        "Cuando la ley exija consentimiento u opciones de privacidad para un seguimiento concreto, esas actividades se gestionan con los controles correspondientes. Los servicios de terceros también pueden ofrecer sus propios ajustes.",
      ],
    },
    {
      heading: "7. Datos del cliente durante el proyecto",
      paragraphs: [
        "Cuando accedemos a información personal por cuenta de un cliente — por ejemplo, en un CRM, una base de datos o un sistema de soporte — la tratamos según el acuerdo del proyecto y las instrucciones autorizadas. El cliente define los fines de su propia recogida de datos y da los avisos y permisos correspondientes.",
        "Si tu información está en un sistema operado por uno de nuestros clientes, contacta primero a ese negocio para pedir acceso, corrección o eliminación. Ayudamos al cliente cuando corresponda según el acuerdo y la ley aplicable.",
      ],
    },
    {
      heading: "8. Conservación",
      paragraphs: [
        "Conservamos la información el tiempo razonablemente necesario para los fines de esta política, incluido prestar el servicio, mantener registros, resolver disputas y cumplir obligaciones legales. Los plazos varían según el tipo de información y el proyecto. Pueden quedar copias en respaldos hasta que termine el ciclo de respaldo.",
        "Terminar un proyecto no borra automáticamente los registros que debamos conservar. La información en cuentas de terceros del cliente también depende de la configuración del cliente y de las políticas del proveedor.",
      ],
    },
    {
      heading: "9. Seguridad",
      paragraphs: [
        "Usamos resguardos razonables según la información y los servicios. Ningún método de almacenamiento o transmisión electrónica es completamente seguro, y no podemos garantizar una seguridad absoluta. El cliente debe usar contraseñas sólidas, activar la autenticación multifactor cuando exista y avisarnos pronto si el acceso del proyecto pudo verse comprometido.",
      ],
    },
    {
      heading: "10. Opciones y derechos",
      paragraphs: [
        "Según tu ubicación y la ley aplicable, puedes tener derecho a pedir acceso, corrección, eliminación o una copia de cierta información personal. Otros derechos pueden incluir limitar u oponerte a cierto tratamiento, retirar el consentimiento o excluirte de ciertos usos.",
        "Escribe a admin@overdriveio.com para enviar una solicitud. Podemos verificar tu identidad y tu autoridad antes de responder. Cierta información puede conservarse o la solicitud puede limitarse cuando la ley lo permita o lo exija. Si la ley da un derecho de apelación, puedes pedir en el mismo correo la revisión de nuestra respuesta.",
        "Puedes darte de baja de los correos promocionales con las instrucciones que se indiquen. Podemos seguir enviando comunicaciones necesarias de facturación, seguridad y del proyecto.",
      ],
    },
    {
      heading: "11. Sitios y servicios de terceros",
      paragraphs: [
        "El sitio y los flujos del proyecto pueden enlazar o usar plataformas de terceros. Su recogida y tratamiento se rigen por sus propias políticas. Revísalas antes de enviar información o conectar cuentas.",
      ],
    },
    {
      heading: "12. Privacidad de menores",
      paragraphs: [
        "Los servicios están pensados para empresas y adultos que buscan servicios profesionales. No recogemos a sabiendas información personal de menores de 13 años a través de nuestro propio sitio. Si crees que un menor nos dio información personal, contáctanos para revisarlo y atenderlo.",
      ],
    },
    {
      heading: "13. Tratamiento internacional",
      paragraphs: [
        "La información puede tratarse en los lugares donde operamos nosotros o nuestros proveedores. Las leyes de privacidad pueden diferir. Cuando la ley exija resguardos para transferencias internacionales, esos requisitos se aplican.",
      ],
    },
    {
      heading: "14. Cambios de esta política",
      paragraphs: [
        "Podemos actualizar esta política para reflejar cambios en los servicios, las prácticas o los requisitos aplicables. La versión vigente estará en esta página. Cuando haga falta, daremos un aviso adicional o pediremos consentimiento para cambios materiales.",
      ],
    },
    {
      heading: "15. Contacto",
      paragraphs: [`Para preguntas o solicitudes de privacidad, contacta a ${contactEs}`],
    },
  ],
};

const termsEn: PolicyDoc = {
  title: "Terms, billing & refunds",
  description: "Website terms, payment and billing, and cancellation and refunds for Over Drive IO.",
  sections: [
    {
      heading: "Website terms of use",
      part: true,
      paragraphs: [
        "These Website Terms of Use, Payment & Billing Policy, and Cancellation & Refund Policy apply to Over Drive IO (“Over Drive,” “we,” “us,” or “our”) and www.overdriveio.com. “Client” refers to a person or business purchasing our services.",
      ],
    },
    {
      heading: "1. Website use and project agreements",
      paragraphs: [
        "These terms explain the conditions for using our website and purchasing services when incorporated into an accepted proposal or agreement. Before ordering, review the applicable terms. Project obligations arise through an accepted proposal, signed agreement, or other documented acceptance. Browsing alone does not authorize charges.",
      ],
    },
    {
      heading: "2. Order of precedence",
      paragraphs: [
        "Applicable mandatory law controls. A signed project agreement or statement of work controls over these general policies where they conflict. A later change to this website does not retroactively change an existing project agreement without the parties’ agreement.",
      ],
    },
    {
      heading: "3. Eligibility and authority",
      paragraphs: [
        "You must be at least 18 and legally able to enter into the applicable agreement to purchase services. If acting for a business, you represent that you have authority to bind it. Provide accurate contact, billing, and project information.",
      ],
    },
    {
      heading: "4. Services and scope",
      paragraphs: [
        "We provide website, dashboard, CRM, app, software, branding, design, and related support services as specified in each proposal. Website examples and starting prices are illustrative. Only the deliverables expressly included in your accepted scope are included in your project price.",
      ],
    },
    {
      heading: "5. Permitted and prohibited use",
      paragraphs: [
        "Use our website and services lawfully. Do not attempt unauthorized access, distribute malware, disrupt services, submit fraudulent information, infringe others’ rights, or use our systems for unlawful activity. Do not copy or commercially exploit our website content without permission or another lawful basis.",
      ],
    },
    {
      heading: "6. Website content and third-party services",
      paragraphs: [
        "Our website content, branding, graphics, and other materials belong to us or their licensors. Third-party links and platforms are governed by their own terms and policies. We do not control third-party availability, pricing, account decisions, or security practices.",
      ],
    },
    {
      heading: "7. Client materials and permissions",
      paragraphs: [
        "You retain ownership of materials you provide and grant us permission to use, reproduce, adapt, and share them with authorized personnel and providers as reasonably necessary to perform your project. You are responsible for having the necessary rights and permissions and for checking the accuracy and legality of your content.",
      ],
    },
    {
      heading: "8. Deliverable ownership and licensing",
      paragraphs: [
        "The project agreement should identify ownership and licensing of final deliverables. Unless otherwise agreed in writing, upon full payment we assign to the client the rights we own in custom final deliverables created specifically for that project. Pre-existing tools, reusable components, working files not included in scope, and third-party materials are excluded. For our retained components embedded in paid final deliverables, we grant a perpetual, nonexclusive license to use, modify, and transfer them as part of those deliverables. Third-party licenses continue to apply.",
      ],
    },
    {
      heading: "9. Client accounts and access",
      paragraphs: [
        "Clients retain ownership and recovery control of their domains, hosting, repositories, databases, and payment accounts unless otherwise agreed. Use team invitations and appropriate permissions where available. Clients enter their own payment information directly with providers. We use authorized access to perform agreed services and coordinate removal of developer access at handoff or termination.",
      ],
    },
    {
      heading: "10. Timing, feedback, and revisions",
      paragraphs: [
        "A 3–5 business-day turnaround applies only to qualifying agreed scopes and begins after receipt of the signed agreement, deposit, complete content, and required access. Larger projects receive a separate timeline. Client delays, new requirements, or third-party issues may shift delivery. Three consolidated revision rounds within scope are included unless your proposal states otherwise. Additional rounds are $25 each. New features or scope changes require an approved separate quote. A defect is a failure to meet the agreed specification, rather than a new preference or feature. Applicable defect remedies remain governed by the agreement and law.",
      ],
    },
    {
      heading: "11. Privacy, confidentiality, and portfolio use",
      paragraphs: [
        "Our Privacy Policy explains handling of personal information. We use nonpublic client information for project and business administration purposes and share it only as reasonably necessary or legally required. Public portfolio use of client project screenshots, logos, or testimonials requires client permission unless already authorized in the project agreement.",
      ],
    },
    {
      heading: "12. Warranties, liability, and disputes",
      paragraphs: [
        "We do not guarantee revenue, search rankings, uninterrupted availability, or business outcomes. General website information is provided as available. No term excludes liability or rights that cannot lawfully be excluded, including remedies for our failure to meet binding project commitments. Any project-specific warranty, liability limit, governing law, or dispute procedure must be set out in the applicable agreement. Contact us about concerns. Doing so does not waive legal remedies or dispute rights.",
      ],
    },
    {
      heading: "13. Updates and contact",
      paragraphs: [
        `We may revise these website terms prospectively, with additional notice where required. Existing project terms remain subject to the order of precedence above. Questions: ${contactEn}`,
      ],
    },
    {
      heading: "Payment & billing policy",
      part: true,
      paragraphs: [
        "Your accepted proposal or project agreement identifies the price, scope, milestones, and any recurring services. Starting prices are not a promise that every project qualifies. Applicable taxes and separately billed costs will be identified before the related purchase or commitment.",
      ],
    },
    {
      heading: "Deposit and final balance",
      paragraphs: [
        "Unless your signed agreement states otherwise, a 50% deposit is required before onboarding and development begin. The deposit is an advance payment credited toward your project, not an automatic forfeiture. The remaining 50% is due after final approval and before launch or final handoff. Any different milestone schedule must be agreed in writing. Deposit refunds are addressed in the cancellation and refund policy.",
      ],
    },
    {
      heading: "Accepted payment methods",
      paragraphs: [
        "We accept Zelle, Stripe through the Over Drive online portal, Cash App, PayPal, and Venmo, as identified on your invoice. Use only payment instructions provided through our official invoice or verified communication. Contact us to verify unexpected changes to payment instructions.",
      ],
    },
    {
      heading: "Invoices, third-party costs, and extra work",
      paragraphs: [
        "Pay invoices by the stated due date. No additional service, recurring charge, or scope increase is authorized solely by possession of your payment details. We obtain the applicable authorization before charging. Payments are subject to provider processing and verification.",
        "Domains, business email, hosting, databases, paid software, premium assets, API usage, and other subscriptions are separate unless expressly included. Clients normally pay these providers directly. We will obtain approval before committing client funds to additional third-party purchases. Provider renewals and usage charges follow the provider’s terms.",
        "Three revision rounds within the approved scope are included unless otherwise agreed. Submit each round as one consolidated list. Each additional round is $25 and requires approval before work begins. New pages, functionality, integrations, redesigns, or other scope changes require a separate written quote or change order.",
      ],
    },
    {
      heading: "Recurring services and overdue payments",
      paragraphs: [
        "If purchased, recurring services must specify the amount or calculation method, billing frequency, renewal terms, and cancellation method before enrollment. Recurring billing requires affirmative authorization. We provide applicable notices and cancellation controls required by law. Cancelling Over Drive services does not automatically cancel a client’s direct provider subscriptions.",
        "If an undisputed invoice becomes overdue, we may pause affected work or withhold launch of unpaid deliverables after written notice and a reasonable opportunity to resolve the balance. We do not impose late fees unless disclosed and agreed in advance and permitted by law. We will not delete client data or take ownership of client accounts as a collection measure.",
        "Report billing questions to admin@overdriveio.com with your invoice number and the amount in question. We will review the records and explain or correct charges as appropriate. Pay any undisputed portion when due. Nothing in these terms restricts lawful payment disputes, chargebacks, complaints, or other statutory remedies.",
        "Launch and final delivery are subject to receipt of amounts due for the applicable deliverables. We coordinate transfer of paid deliverables and authorized account access. Client-owned accounts and materials remain the client’s property. Ongoing maintenance and support are included only to the extent stated in the project agreement.",
      ],
    },
    {
      heading: "Cancellation & refund policy",
      part: true,
      paragraphs: [
        "Email admin@overdriveio.com with your name, business name, invoice or project reference, and a clear cancellation request. You do not need to provide a reason. For online subscriptions, use any available portal cancellation control; email is also accepted. We will acknowledge the request and confirm the applicable cancellation and billing outcome.",
      ],
    },
    {
      heading: "Before work begins and after work begins",
      paragraphs: [
        "If no work has begun and no approved nonrecoverable expenses have been committed, payments for the cancelled project are refundable in full. If approved expenses have already been committed, we will provide an itemized explanation and deduct only amounts properly chargeable under your agreement and applicable law.",
        "We stop further avoidable work and expenses upon receiving your cancellation request. The refund is based on payments received minus the reasonable value of completed authorized work and approved nonrecoverable expenses, without double counting. Completed work is valued using agreed milestones or rates. If no allocation or rate was agreed, we provide a reasonable itemized assessment tied to the accepted scope. No undisclosed cancellation penalty or retroactive hourly rate applies.",
        "We return any amount paid above the properly earned amount. If completed authorized work and approved expenses exceed payments received, only amounts supported by the agreement and applicable law remain payable. We will not charge the entire remaining project price merely because you cancel. You may request supporting records and raise a dispute about the calculation.",
      ],
    },
    {
      heading: "Completed work, third parties, and recurring services",
      paragraphs: [
        "After completion, approval, and delivery, a change of preference or decision not to use the work does not by itself create a refund entitlement. This does not limit remedies for nonperformance, material defects, misrepresentation, or other applicable legal rights. Report specification failures so we can review an appropriate correction, replacement, refund, or other remedy under the agreement and law.",
        "Provider charges may be nonrefundable under that provider’s terms. We disclose relevant nonrecoverable expenses before committing them on your behalf. Any recoveries we obtain for expenses charged to you will be credited or returned appropriately. For subscriptions in your own accounts, request cancellation or refunds directly from the provider unless we agree to assist.",
        "You may cancel recurring Over Drive services through the available portal control or by email. Unless a different lawful arrangement was clearly agreed, cancellation stops the next renewal and access continues through the paid period. Advance payments for unused future billing periods are refundable. Partial-period treatment follows the disclosed plan terms and applicable law. No additional cancellation fee applies unless expressly agreed and lawful.",
      ],
    },
    {
      heading: "Inactive projects, cancellation by Over Drive, and refund timing",
      paragraphs: [
        "If essential materials, access, or feedback are missing, we may pause the project and notify you of the effect on scheduling. We do not automatically confiscate the deposit because of inactivity. Before administratively closing an inactive project, we provide written notice and at least 10 business days to respond. Any closure is reconciled using the completed-work calculation above. Restart scope, scheduling, and pricing must be agreed before resuming.",
        "We may terminate for material breach, nonpayment, unlawful requests, or circumstances that prevent delivery. Where reasonably capable of correction, we provide notice and a reasonable opportunity to resolve the issue. If we cancel for reasons not caused by client breach, we refund unearned payments and coordinate delivery of paid work and client materials. Any other termination remains subject to the agreement, this policy, and applicable rights.",
        "We aim to review a complete request within 5 business days and initiate an approved refund within 10 business days after determining the amount, or sooner where required by law. Provider posting times vary. Refunds normally return to the original payment method. Any alternative must be verified and agreed. We do not require an extra payment to release a refund.",
        "These policies do not limit mandatory consumer protections, cancellation rights, remedies for breach, or lawful payment disputes. Any legally required refund or cancellation right applies even if a general provision here would otherwise say differently.",
        contactEn,
      ],
    },
  ],
};

const termsEs: PolicyDoc = {
  title: "Términos, facturación y reembolsos",
  description: "Términos del sitio, pagos y facturación, y cancelación y reembolsos de Over Drive IO.",
  sections: [
    {
      heading: "Términos de uso del sitio",
      part: true,
      paragraphs: [
        "Estos términos de uso, la política de pagos y facturación, y la política de cancelación y reembolsos aplican a Over Drive IO (“Over Drive”, “nosotros” o “nuestro”) y a www.overdriveio.com. “Cliente” es la persona o empresa que compra nuestros servicios.",
      ],
    },
    {
      heading: "1. Uso del sitio y acuerdos del proyecto",
      paragraphs: [
        "Estos términos explican las condiciones para usar el sitio y comprar servicios cuando se incorporan a una propuesta o un acuerdo aceptado. Antes de pedir, revisa los términos aplicables. Las obligaciones del proyecto nacen con una propuesta aceptada, un acuerdo firmado u otra aceptación documentada. Navegar el sitio no autoriza cargos.",
      ],
    },
    {
      heading: "2. Orden de prevalencia",
      paragraphs: [
        "La ley obligatoria aplicable prevalece. Un acuerdo de proyecto o un enunciado de trabajo firmado prevalece sobre estas políticas generales cuando haya conflicto. Un cambio posterior de este sitio no modifica de forma retroactiva un acuerdo de proyecto vigente sin el acuerdo de las partes.",
      ],
    },
    {
      heading: "3. Elegibilidad y autoridad",
      paragraphs: [
        "Debes tener al menos 18 años y capacidad legal para celebrar el acuerdo aplicable si vas a comprar servicios. Si actúas por una empresa, declaras que tienes autoridad para obligarla. Da datos de contacto, facturación y proyecto que sean correctos.",
      ],
    },
    {
      heading: "4. Servicios y alcance",
      paragraphs: [
        "Prestamos sitios, paneles, CRMs, apps, software, marca, diseño y soporte relacionado según cada propuesta. Los ejemplos del sitio y los precios iniciales son ilustrativos. Solo los entregables incluidos de forma expresa en el alcance aceptado forman parte del precio del proyecto.",
      ],
    },
    {
      heading: "5. Uso permitido y prohibido",
      paragraphs: [
        "Usa el sitio y los servicios de forma lícita. No intentes un acceso no autorizado, no distribuyas malware, no interrumpas los servicios, no envíes información fraudulenta, no infrinjas derechos de otros y no uses los sistemas para una actividad ilícita. No copies ni explotes comercialmente el contenido del sitio sin permiso u otra base lícita.",
      ],
    },
    {
      heading: "6. Contenido del sitio y servicios de terceros",
      paragraphs: [
        "El contenido, la marca, los gráficos y otros materiales del sitio nos pertenecen o pertenecen a sus licenciantes. Los enlaces y las plataformas de terceros se rigen por sus propios términos y políticas. No controlamos la disponibilidad, el precio, las decisiones de cuenta ni las prácticas de seguridad de terceros.",
      ],
    },
    {
      heading: "7. Materiales y permisos del cliente",
      paragraphs: [
        "Conservas la propiedad de los materiales que entregas y nos das permiso para usarlos, reproducirlos, adaptarlos y compartirlos con el personal y los proveedores autorizados en lo razonablemente necesario para hacer el proyecto. Eres responsable de tener los derechos y permisos necesarios y de revisar la exactitud y la legalidad de tu contenido.",
      ],
    },
    {
      heading: "8. Propiedad y licencia de los entregables",
      paragraphs: [
        "El acuerdo del proyecto debe identificar la propiedad y la licencia de los entregables finales. Salvo pacto escrito distinto, al pago completo cedemos al cliente los derechos que tengamos sobre los entregables finales a medida creados específicamente para ese proyecto. Quedan fuera las herramientas previas, los componentes reutilizables, los archivos de trabajo no incluidos en el alcance y los materiales de terceros. Para los componentes que conservemos e incorporemos en entregables finales pagados, otorgamos una licencia perpetua y no exclusiva para usarlos, modificarlos y transferirlos como parte de esos entregables. Las licencias de terceros siguen aplicando.",
      ],
    },
    {
      heading: "9. Cuentas y acceso del cliente",
      paragraphs: [
        "El cliente conserva la propiedad y la recuperación de sus dominios, hosting, repositorios, bases de datos y cuentas de pago, salvo pacto distinto. Usa invitaciones de equipo y permisos adecuados cuando existan. El cliente ingresa su propia información de pago directamente con los proveedores. Usamos el acceso autorizado para prestar los servicios acordados y coordinamos el retiro del acceso del desarrollador en la entrega o al terminar.",
      ],
    },
    {
      heading: "10. Plazos, comentarios y revisiones",
      paragraphs: [
        "Un plazo de 3 a 5 días hábiles aplica solo a alcances acordados que califiquen, y empieza cuando recibimos el acuerdo firmado, el depósito, el contenido completo y los accesos necesarios. Los proyectos más grandes tienen su propio calendario. Los retrasos del cliente, los requisitos nuevos o los problemas de terceros pueden mover la entrega. Van incluidas tres rondas de revisión consolidadas dentro del alcance, salvo que la propuesta diga otra cosa. Cada ronda extra cuesta $25. Las funciones nuevas o los cambios de alcance requieren una cotización aparte aprobada. Un defecto es un incumplimiento de la especificación acordada, no una preferencia o función nueva. Los remedios del defecto se rigen por el acuerdo y la ley.",
      ],
    },
    {
      heading: "11. Privacidad, confidencialidad y portafolio",
      paragraphs: [
        "La política de privacidad explica el tratamiento de la información personal. Usamos la información no pública del cliente para administrar el proyecto y el negocio, y la compartimos solo cuando sea razonablemente necesario o lo exija la ley. El uso público en portafolio de capturas, logos o testimonios del cliente requiere su permiso, salvo que el acuerdo del proyecto ya lo autorice.",
      ],
    },
    {
      heading: "12. Garantías, responsabilidad y disputas",
      paragraphs: [
        "No garantizamos ingresos, posiciones de búsqueda, disponibilidad ininterrumpida ni resultados de negocio. La información general del sitio se ofrece tal como está disponible. Ningún término excluye una responsabilidad o un derecho que no pueda excluirse legalmente, incluidos los remedios por no cumplir compromisos vinculantes del proyecto. Cualquier garantía, límite de responsabilidad, ley aplicable o procedimiento de disputa propio del proyecto debe constar en el acuerdo aplicable. Contáctanos si hay una inquietud. Hacerlo no renuncia a remedios legales ni a derechos de disputa.",
      ],
    },
    {
      heading: "13. Actualizaciones y contacto",
      paragraphs: [
        `Podemos revisar estos términos del sitio hacia el futuro, con aviso adicional cuando haga falta. Los términos de un proyecto vigente siguen sujetos al orden de prevalencia. Preguntas: ${contactEs}`,
      ],
    },
    {
      heading: "Política de pagos y facturación",
      part: true,
      paragraphs: [
        "La propuesta o el acuerdo aceptado identifica el precio, el alcance, los hitos y cualquier servicio recurrente. Los precios iniciales no prometen que todo proyecto califique. Los impuestos aplicables y los costos facturados aparte se identifican antes de la compra o el compromiso relacionado.",
      ],
    },
    {
      heading: "Depósito y saldo final",
      paragraphs: [
        "Salvo que el acuerdo firmado diga otra cosa, se requiere un depósito del 50% antes de iniciar la incorporación y el desarrollo. El depósito es un anticipo acreditado al proyecto, no una pérdida automática. El 50% restante se debe después de la aprobación final y antes del lanzamiento o la entrega final. Cualquier calendario de hitos distinto debe acordarse por escrito. Los reembolsos del depósito se tratan en la política de cancelación y reembolsos.",
      ],
    },
    {
      heading: "Métodos de pago aceptados",
      paragraphs: [
        "Aceptamos Zelle, Stripe a través del portal en línea de Over Drive, Cash App, PayPal y Venmo, según la factura. Usa solo las instrucciones de pago de nuestra factura oficial o de una comunicación verificada. Contáctanos para verificar cambios inesperados en las instrucciones de pago.",
      ],
    },
    {
      heading: "Facturas, costos de terceros y trabajo extra",
      paragraphs: [
        "Paga las facturas en la fecha indicada. Tener tus datos de pago no autoriza por sí solo un servicio adicional, un cargo recurrente ni un aumento de alcance. Obtenemos la autorización aplicable antes de cobrar. Los pagos están sujetos al procesamiento y la verificación del proveedor.",
        "Dominios, correo del negocio, hosting, bases de datos, software de pago, recursos premium, uso de API y otras suscripciones van aparte salvo que se incluyan de forma expresa. El cliente normalmente paga a esos proveedores directamente. Pedimos aprobación antes de comprometer fondos del cliente en compras adicionales de terceros. Las renovaciones y los cargos por uso siguen los términos del proveedor.",
        "Van incluidas tres rondas de revisión dentro del alcance aprobado, salvo pacto distinto. Cada ronda se envía como una lista consolidada. Cada ronda extra cuesta $25 y requiere aprobación antes de empezar. Páginas nuevas, funciones, integraciones, rediseños u otros cambios de alcance requieren una cotización escrita o una orden de cambio.",
      ],
    },
    {
      heading: "Servicios recurrentes y pagos vencidos",
      paragraphs: [
        "Si se contratan, los servicios recurrentes deben indicar el monto o el método de cálculo, la frecuencia, la renovación y la forma de cancelar antes de la inscripción. El cobro recurrente requiere una autorización afirmativa. Damos los avisos y controles de cancelación que exija la ley. Cancelar los servicios de Over Drive no cancela automáticamente las suscripciones directas del cliente con un proveedor.",
        "Si una factura no disputada se vence, podemos pausar el trabajo afectado o retener el lanzamiento de entregables no pagados después de un aviso escrito y una oportunidad razonable de resolver el saldo. No cobramos recargos por mora salvo que se hayan informado y aceptado de antemano y la ley lo permita. No borramos datos del cliente ni tomamos la propiedad de sus cuentas como medida de cobro.",
        "Envía las preguntas de facturación a admin@overdriveio.com con el número de factura y el monto en cuestión. Revisamos los registros y explicamos o corregimos los cargos según corresponda. Paga la parte no disputada cuando venza. Nada en estos términos limita disputas de pago lícitas, contracargos, quejas u otros remedios legales.",
        "El lanzamiento y la entrega final dependen de recibir los montos debidos por los entregables aplicables. Coordinamos la transferencia de los entregables pagados y el acceso autorizado a las cuentas. Las cuentas y los materiales del cliente siguen siendo de su propiedad. El mantenimiento y el soporte continuos se incluyen solo en la medida que indique el acuerdo del proyecto.",
      ],
    },
    {
      heading: "Política de cancelación y reembolsos",
      part: true,
      paragraphs: [
        "Escribe a admin@overdriveio.com con tu nombre, el nombre del negocio, la referencia de la factura o del proyecto y una solicitud clara de cancelación. No hace falta dar un motivo. Para suscripciones en línea, usa el control de cancelación del portal si existe; el correo también se acepta. Confirmamos la solicitud y el resultado de cancelación y facturación que aplique.",
      ],
    },
    {
      heading: "Antes de empezar y después de empezar",
      paragraphs: [
        "Si no ha empezado el trabajo y no hay gastos no recuperables aprobados y comprometidos, los pagos del proyecto cancelado se reembolsan por completo. Si ya se comprometieron gastos aprobados, damos una explicación detallada y descontamos solo los montos que se puedan cobrar correctamente según el acuerdo y la ley aplicable.",
        "Al recibir la cancelación detenemos el trabajo y los gastos evitables que aún no se hayan hecho. El reembolso se calcula con los pagos recibidos menos el valor razonable del trabajo autorizado ya hecho y los gastos no recuperables aprobados, sin contar dos veces. El trabajo hecho se valora con los hitos o las tarifas acordadas. Si no hubo un reparto o una tarifa, damos una evaluación detallada y razonable ligada al alcance aceptado. No se aplica una penalidad de cancelación no informada ni una tarifa por hora retroactiva.",
        "Devolvemos lo pagado por encima del monto correctamente devengado. Si el trabajo autorizado hecho y los gastos aprobados superan lo recibido, solo queda por pagar lo que sostengan el acuerdo y la ley aplicable. No cobramos todo el precio restante del proyecto solo porque canceles. Puedes pedir los registros de apoyo y disputar el cálculo.",
      ],
    },
    {
      heading: "Trabajo terminado, terceros y servicios recurrentes",
      paragraphs: [
        "Después de terminar, aprobar y entregar, un cambio de preferencia o la decisión de no usar el trabajo no crea por sí solo un derecho de reembolso. Esto no limita los remedios por incumplimiento, defectos materiales, declaraciones falsas u otros derechos legales. Informa los fallos de especificación para que revisemos una corrección, un reemplazo, un reembolso u otro remedio según el acuerdo y la ley.",
        "Los cargos de un proveedor pueden no ser reembolsables según los términos de ese proveedor. Informamos los gastos no recuperables relevantes antes de comprometerlos en tu nombre. Las recuperaciones que obtengamos por gastos cobrados a ti se acreditan o se devuelven como corresponda. Para suscripciones en tus propias cuentas, pide la cancelación o el reembolso directamente al proveedor, salvo que acordemos ayudar.",
        "Puedes cancelar los servicios recurrentes de Over Drive por el control del portal o por correo. Salvo un arreglo lícito distinto y claro, la cancelación detiene la siguiente renovación y el acceso continúa durante el período pagado. Los anticipos de períodos futuros no usados son reembolsables. El trato de un período parcial sigue los términos informados del plan y la ley aplicable. No hay una tarifa extra de cancelación salvo que se haya aceptado de forma expresa y sea lícita.",
      ],
    },
    {
      heading: "Proyectos inactivos, cancelación por Over Drive y plazos de reembolso",
      paragraphs: [
        "Si faltan materiales, accesos o comentarios esenciales, podemos pausar el proyecto y avisarte el efecto en el calendario. No confiscamos el depósito de forma automática por inactividad. Antes de cerrar administrativamente un proyecto inactivo, damos aviso escrito y al menos 10 días hábiles para responder. El cierre se concilia con el cálculo del trabajo hecho. El alcance, el calendario y el precio de un reinicio deben acordarse antes de reanudar.",
        "Podemos terminar por incumplimiento material, falta de pago, solicitudes ilícitas o circunstancias que impidan la entrega. Cuando el problema pueda corregirse de forma razonable, damos aviso y una oportunidad razonable de resolverlo. Si cancelamos por causas que no sean un incumplimiento del cliente, reembolsamos los pagos no devengados y coordinamos la entrega del trabajo pagado y de los materiales del cliente. Cualquier otra terminación sigue sujeta al acuerdo, a esta política y a los derechos aplicables.",
        "Buscamos revisar una solicitud completa en 5 días hábiles e iniciar un reembolso aprobado en 10 días hábiles después de determinar el monto, o antes si la ley lo exige. Los tiempos de abono del proveedor varían. Los reembolsos normalmente vuelven al método de pago original. Cualquier alternativa debe verificarse y acordarse. No exigimos un pago extra para liberar un reembolso.",
        "Estas políticas no limitan protecciones obligatorias del consumidor, derechos de cancelación, remedios por incumplimiento ni disputas de pago lícitas. Cualquier derecho de reembolso o cancelación exigido por la ley aplica aunque una cláusula general diga otra cosa.",
        contactEs,
      ],
    },
  ],
};

const supportEn: PolicyDoc = {
  title: "Onboarding, maintenance & support",
  description: "How Over Drive IO starts a project and how maintenance and support are requested.",
  sections: [
    {
      heading: "Onboarding policy",
      part: true,
      paragraphs: [
        "This policy describes how Over Drive IO (“Over Drive,” “we,” “us,” or “our”) begins website, dashboard, CRM, app, software, branding, and related projects. It applies when incorporated into your accepted proposal or project agreement. Your signed agreement controls over conflicting general provisions, subject to applicable law.",
      ],
    },
    {
      heading: "1. Review and sign your agreement",
      paragraphs: [
        "Review and sign your project agreement electronically or in person. Confirm the selected services, deliverables, exclusions, pricing, payment schedule, and project contact before development begins. Any changes to the approved scope must be documented and approved.",
      ],
    },
    {
      heading: "2. Submit your 50% deposit",
      paragraphs: [
        "Unless your agreement provides otherwise, a 50% deposit is required to begin onboarding and reserve development scheduling. Accepted methods are Zelle, Stripe through the Over Drive online portal, Cash App, PayPal, and Venmo, as shown on your invoice. The deposit is credited toward your project. Cancellation and refunds follow our Cancellation & Refund Policy.",
      ],
    },
    {
      heading: "3. Provide domain and business email details",
      paragraphs: [
        "Submit your preferred domain and whether it is new or already registered. Domain availability and provider pricing must be confirmed before purchase. If you already own a domain, provide authorized access or coordinate the necessary settings. Do not transfer ownership to the developer.",
        "State how many business email accounts you need and list each requested address, such as info@yourbusiness.com or sales@yourbusiness.com. Specify which accounts require separate mailboxes and which may be aliases or forwarding addresses. Provider capabilities and fees vary.",
      ],
    },
    {
      heading: "4. Identify your project contact",
      paragraphs: [
        "Provide your business name, the primary contact’s name and email address, and an optional phone number. Identify who can approve designs, scope changes, invoices, and launch. The primary contact should consolidate feedback from all decision-makers.",
      ],
    },
    {
      heading: "5. Create a dedicated project Gmail",
      paragraphs: [
        "Create a new Gmail account dedicated to project administration and provider notifications. Keep ownership, recovery email, recovery phone, and multifactor authentication under your control. Coordinate developer access through supported team invitations, delegated access, or another agreed secure method. Do not send passwords or recovery codes through ordinary email or intake forms.",
      ],
    },
    {
      heading: "6. Set up client-owned service accounts",
      paragraphs: [
        "With your authorization, we help configure the services required for the agreed project, which may include Vercel, GitHub, Supabase, Stripe, domain registrars, business email, or other platforms. Only services needed for your scope will be used. You accept the applicable provider terms and retain ownership and administrative access. Some services require a business-domain email or a separate identity verification process.",
      ],
    },
    {
      heading: "7. Activate billing and complete verification",
      paragraphs: [
        "Log in directly to the required platforms, complete any identity or business verification, and enter your own payment method for paid services. We do not need your full card details or payment account recovery codes. Domains, email, hosting, databases, premium assets, API usage, and third-party subscriptions are billed separately unless expressly included. We obtain approval before committing additional expenses on your behalf.",
      ],
    },
    {
      heading: "8. Submit complete content and references",
      paragraphs: [
        "Provide your logos, website copy, business descriptions, biographies, images, service details, contact information, and any required documents. Include preferred colors, examples, and concept ideas. Submit materials in one organized folder and identify the final approved versions.",
        "You are responsible for the accuracy of submitted content and for permission to use images, logos, fonts, and other materials. Tell us before uploading personal, confidential, or regulated information so an appropriate transfer method and scope can be agreed.",
      ],
    },
    {
      heading: "9. Confirm project readiness",
      paragraphs: [
        "Development scheduling begins once we have the signed agreement, cleared deposit, complete required materials, essential account access, and necessary approvals. We confirm any missing items and the expected schedule. Onboarding assistance does not expand the agreed project scope.",
      ],
    },
    {
      heading: "10. Turnaround and client response",
      paragraphs: [
        "Allow 3–5 business days for qualifying projects within the agreed scope after all readiness requirements are met. Larger or more complex projects receive a separate timeline. Business days are Monday through Friday, excluding holidays observed by Over Drive. Delayed content, feedback, verification, payments, or third-party service issues can shift delivery. We communicate material schedule changes.",
      ],
    },
    {
      heading: "11. Review and revision rounds",
      paragraphs: [
        "Unless your proposal states otherwise, your project includes three revision rounds within the approved scope. Each round is one consolidated list of requested changes. Each additional round costs $25 and requires approval before work begins. New pages, features, integrations, redesigns, or other scope changes require a separate quote.",
        "Corrections required to meet the agreed specification are treated separately from preference changes and new functionality. Send clear feedback through the agreed project channel. Silence does not automatically constitute final approval.",
      ],
    },
    {
      heading: "12. Delays and inactive projects",
      paragraphs: [
        "If required information or approvals are missing, we may pause work and explain the effect on delivery. Before administratively closing an inactive project, we provide written notice and at least 10 business days to respond. Closure does not automatically forfeit your deposit. Payments are reconciled under the Cancellation & Refund Policy. Any restart schedule, revised scope, or additional fee must be agreed before work resumes.",
      ],
    },
    {
      heading: "13. Approval, final payment, and launch",
      paragraphs: [
        "Review the final project and confirm written approval before publication. Unless otherwise agreed, the remaining 50% balance is due after approval and before launch or final handoff. We coordinate deployment, domain settings, and access according to the accepted scope. Provider approval, DNS propagation, and other external processes may affect availability.",
      ],
    },
    {
      heading: "14. Handoff and access",
      paragraphs: [
        "We provide the agreed final deliverables and coordinate access to client-owned accounts. Your agreement identifies ownership, licenses, and any included documentation or training. Confirm that your recovery settings and billing details are current. Developer access is removed or adjusted based on any ongoing support arrangement. Do not revoke access mid-task without coordinating any resulting interruption.",
      ],
    },
    {
      heading: "15. Related policies and questions",
      paragraphs: [
        `Payment, cancellation, refunds, ownership, and other project terms remain governed by the applicable agreement and related Over Drive policies. Onboarding questions may be sent to admin@overdriveio.com or discussed at 347.822.0528. ${contactEn}`,
      ],
    },
    {
      heading: "Maintenance & support policy",
      part: true,
      paragraphs: [
        "This policy explains how support is requested and how ongoing maintenance is arranged. A one-time project purchase does not include unlimited or indefinite maintenance. Any included support period, recurring service, response commitment, or service-level agreement must be specified in your accepted proposal or support plan.",
      ],
    },
    {
      heading: "Included support and work outside the plan",
      paragraphs: [
        "Your agreement should identify whether post-launch defect correction is included and for how long. This general policy does not establish a fixed free support period. A covered defect is a reproducible failure of delivered work to meet the agreed specification under the supported conditions. We review reported issues to determine the appropriate correction or other remedy under your agreement and applicable law.",
        "Depending on the plan purchased, maintenance may include dependency updates, security patches, configuration checks, uptime monitoring, performance reviews, content updates, database checks, backups, or technical assistance. Only expressly listed services and allowances are included. Monitoring and backups are not continuous or guaranteed unless specifically contracted.",
        "New features, redesigns, additional pages, new integrations, migrations, extensive content entry, training, and work caused by unauthorized changes or third-party platform changes may require a separate quote. We explain proposed charges and obtain approval before billable work. The $25 additional revision-round price applies to qualifying project revisions. It is not a flat rate for all future maintenance or technical incidents.",
      ],
    },
    {
      heading: "How to request support",
      paragraphs: [
        "Email admin@overdriveio.com or use the support channel provided in your plan. Include your business and project name, affected URL or feature, steps to reproduce the issue, screenshots with sensitive information removed, and the business impact. For an outage or suspected security incident, clearly identify the urgency. Do not include passwords, card details, recovery codes, or unnecessary customer data.",
        "Support hours, response targets, escalation methods, and any emergency coverage are defined in the purchased plan. Unless expressly contracted, support is handled during our regular business operations and is not a 24/7 emergency service. A response target is not a guarantee of resolution. Resolution depends on severity, access, complexity, and third-party cooperation.",
        "We prioritize requests based on the applicable plan, impact, security implications, and available capacity. We may request logs, access, testing, or clarification before proceeding. Where practical, changes are tested before production deployment. Maintenance windows, downtime, and rollback arrangements are coordinated as appropriate to the work.",
      ],
    },
    {
      heading: "Client responsibilities and third-party platforms",
      paragraphs: [
        "Keep subscriptions, domain registrations, billing methods, and recovery information current. Maintain appropriate account permissions and multifactor authentication, provide timely approvals, and notify us about changes made by other developers or administrators. You remain responsible for business content, lawful data use, and your own provider accounts. We cannot perform tasks that require unavailable access or unapproved expenses.",
        "Hosting, email, databases, payment processing, APIs, and other platforms are operated by independent providers. Their outages, pricing, feature changes, account restrictions, and verification processes may affect your project. We assist only to the extent included in your plan or separately approved. No general promise of uninterrupted uptime or third-party restoration is made.",
      ],
    },
    {
      heading: "Backups and security incidents",
      paragraphs: [
        "A backup service must specify what is backed up, frequency, retention, storage location, access, and restoration responsibilities. Do not assume a deployment or repository is a complete database or file backup. Restoration may be limited by the available backup and provider capabilities. Recovery objectives and testing must be expressly agreed. No zero-data-loss guarantee is implied. Keep independent copies of essential business records where appropriate.",
        "Notify us promptly of suspected compromise affecting a supported project. If authorized, we can help investigate, revoke access, restore configurations, or coordinate with providers within the applicable scope. Additional incident response may require a separate engagement. We do not guarantee that any system is immune to attack. Applicable notification duties and legal obligations remain with the responsible parties and are not displaced by this policy.",
      ],
    },
    {
      heading: "Maintenance billing, cancellation, and handoff",
      part: true,
      paragraphs: [
        "Recurring maintenance requires a clearly described plan, billing frequency, price or calculation method, and affirmative authorization. Usage allowances, overages, and paid provider costs must be disclosed. Changes to your plan or additional work require agreement. The Payment & Billing Policy governs invoice questions and payments.",
        "Cancel through an available portal control or by emailing admin@overdriveio.com. Cancellation and refund treatment follow the disclosed plan and Cancellation & Refund Policy, subject to applicable law. Cancelling Over Drive support does not automatically cancel your direct provider subscriptions. For overdue undisputed charges, we may pause affected support after written notice and a reasonable opportunity to resolve the balance. We do not delete client data or take ownership of client accounts to collect payment.",
        "At the end of support, we coordinate removal or adjustment of developer access and delivery of any included handoff materials. Confirm who will manage renewals, monitoring, updates, backups, and security going forward. Export or migration assistance beyond the agreed handoff scope may be quoted separately. Retention and deletion of information follow the Privacy Policy, agreement, and applicable law.",
        "These policies do not exclude mandatory legal protections or remedies for failure to meet binding commitments. Existing agreements are not changed retroactively by an update to the website. Changes to an active support plan must follow its agreed change process and any required notices.",
        contactEn,
      ],
    },
  ],
};

const supportEs: PolicyDoc = {
  title: "Incorporación, mantenimiento y soporte",
  description: "Cómo Over Drive IO inicia un proyecto y cómo se piden el mantenimiento y el soporte.",
  sections: [
    {
      heading: "Política de incorporación",
      part: true,
      paragraphs: [
        "Esta política describe cómo Over Drive IO (“Over Drive”, “nosotros” o “nuestro”) inicia proyectos de sitios, paneles, CRMs, apps, software, marca y servicios relacionados. Aplica cuando se incorpora a la propuesta o al acuerdo de proyecto aceptado. El acuerdo firmado prevalece sobre las cláusulas generales en conflicto, sujeto a la ley aplicable.",
      ],
    },
    {
      heading: "1. Revisar y firmar el acuerdo",
      paragraphs: [
        "Revisa y firma el acuerdo del proyecto en línea o en persona. Confirma los servicios, los entregables, las exclusiones, el precio, el calendario de pagos y el contacto del proyecto antes de que empiece el desarrollo. Cualquier cambio al alcance aprobado debe documentarse y aprobarse.",
      ],
    },
    {
      heading: "2. Enviar el depósito del 50%",
      paragraphs: [
        "Salvo que el acuerdo diga otra cosa, se requiere un depósito del 50% para iniciar la incorporación y reservar el calendario de desarrollo. Los métodos aceptados son Zelle, Stripe a través del portal en línea de Over Drive, Cash App, PayPal y Venmo, según la factura. El depósito se acredita al proyecto. La cancelación y los reembolsos siguen la política de cancelación y reembolsos.",
      ],
    },
    {
      heading: "3. Dominio y correo del negocio",
      paragraphs: [
        "Indica el dominio que prefieres y si es nuevo o ya está registrado. La disponibilidad y el precio del proveedor deben confirmarse antes de la compra. Si ya tienes el dominio, da un acceso autorizado o coordina los ajustes necesarios. No transfieras la propiedad al desarrollador.",
        "Indica cuántas cuentas de correo del negocio necesitas y lista cada dirección, por ejemplo info@tunegocio.com o sales@tunegocio.com. Especifica cuáles necesitan un buzón propio y cuáles pueden ser alias o reenvíos. Las capacidades y las tarifas del proveedor varían.",
      ],
    },
    {
      heading: "4. Contacto del proyecto",
      paragraphs: [
        "Da el nombre del negocio, el nombre y el correo del contacto principal, y un teléfono opcional. Identifica quién puede aprobar diseños, cambios de alcance, facturas y el lanzamiento. El contacto principal debe reunir los comentarios de quienes deciden.",
      ],
    },
    {
      heading: "5. Crear un Gmail del proyecto",
      paragraphs: [
        "Crea una cuenta de Gmail nueva dedicada a la administración del proyecto y a los avisos de los proveedores. Conserva la propiedad, el correo de recuperación, el teléfono de recuperación y la autenticación multifactor bajo tu control. Coordina el acceso del desarrollador con invitaciones de equipo, acceso delegado u otro método seguro acordado. No envíes contraseñas ni códigos de recuperación por correo ordinario o por formularios de ingreso.",
      ],
    },
    {
      heading: "6. Cuentas de servicio del cliente",
      paragraphs: [
        "Con tu autorización, ayudamos a configurar los servicios que el proyecto acordado necesite, que pueden incluir Vercel, GitHub, Supabase, Stripe, registradores de dominio, correo del negocio u otras plataformas. Solo se usan los servicios necesarios para el alcance. Aceptas los términos del proveedor y conservas la propiedad y el acceso administrativo. Algunos servicios exigen un correo del dominio del negocio o una verificación de identidad aparte.",
      ],
    },
    {
      heading: "7. Activar la facturación y la verificación",
      paragraphs: [
        "Entra directamente a las plataformas necesarias, completa la verificación de identidad o de negocio e ingresa tu propio método de pago para los servicios de pago. No necesitamos el número completo de tu tarjeta ni los códigos de recuperación de la cuenta de pago. Dominios, correo, hosting, bases de datos, recursos premium, uso de API y suscripciones de terceros se cobran aparte salvo que se incluyan de forma expresa. Pedimos aprobación antes de comprometer gastos adicionales en tu nombre.",
      ],
    },
    {
      heading: "8. Enviar el contenido y las referencias",
      paragraphs: [
        "Entrega logos, textos del sitio, descripciones del negocio, biografías, imágenes, detalles de servicios, datos de contacto y los documentos necesarios. Incluye colores preferidos, ejemplos e ideas. Envía los materiales en una carpeta ordenada e identifica las versiones finales aprobadas.",
        "Eres responsable de la exactitud del contenido y del permiso para usar imágenes, logos, fuentes y otros materiales. Avísanos antes de subir información personal, confidencial o regulada para acordar un método de envío y un alcance adecuados.",
      ],
    },
    {
      heading: "9. Confirmar que el proyecto está listo",
      paragraphs: [
        "El calendario de desarrollo empieza cuando tenemos el acuerdo firmado, el depósito acreditado, los materiales requeridos completos, el acceso esencial a las cuentas y las aprobaciones necesarias. Confirmamos lo que falte y el calendario esperado. La ayuda de incorporación no amplía el alcance acordado.",
      ],
    },
    {
      heading: "10. Plazo y respuesta del cliente",
      paragraphs: [
        "Calcula de 3 a 5 días hábiles para los proyectos que califiquen dentro del alcance acordado, después de cumplir los requisitos de preparación. Los proyectos más grandes o complejos tienen su propio calendario. Los días hábiles son de lunes a viernes, sin los días festivos que observe Over Drive. El contenido, los comentarios, la verificación, los pagos o los servicios de terceros que se retrasen pueden mover la entrega. Comunicamos los cambios materiales del calendario.",
      ],
    },
    {
      heading: "11. Revisión y rondas",
      paragraphs: [
        "Salvo que la propuesta diga otra cosa, el proyecto incluye tres rondas de revisión dentro del alcance aprobado. Cada ronda es una lista consolidada de cambios. Cada ronda extra cuesta $25 y requiere aprobación antes de empezar. Páginas, funciones, integraciones, rediseños u otros cambios de alcance nuevos requieren una cotización aparte.",
        "Las correcciones necesarias para cumplir la especificación acordada se tratan aparte de los cambios de preferencia y de las funciones nuevas. Envía comentarios claros por el canal acordado del proyecto. El silencio no constituye una aprobación final automática.",
      ],
    },
    {
      heading: "12. Retrasos y proyectos inactivos",
      paragraphs: [
        "Si falta información o una aprobación necesaria, podemos pausar el trabajo y explicar el efecto en la entrega. Antes de cerrar administrativamente un proyecto inactivo, damos aviso escrito y al menos 10 días hábiles para responder. El cierre no hace perder el depósito de forma automática. Los pagos se concilian según la política de cancelación y reembolsos. Cualquier calendario de reinicio, alcance revisado o tarifa adicional debe acordarse antes de reanudar.",
      ],
    },
    {
      heading: "13. Aprobación, pago final y lanzamiento",
      paragraphs: [
        "Revisa el proyecto final y confirma la aprobación por escrito antes de publicarlo. Salvo pacto distinto, el saldo del 50% se debe después de la aprobación y antes del lanzamiento o la entrega final. Coordinamos la publicación, los ajustes de dominio y el acceso según el alcance aceptado. La aprobación del proveedor, la propagación de DNS y otros procesos externos pueden afectar la disponibilidad.",
      ],
    },
    {
      heading: "14. Entrega y acceso",
      paragraphs: [
        "Entregamos los entregables finales acordados y coordinamos el acceso a las cuentas del cliente. El acuerdo identifica la propiedad, las licencias y la documentación o la capacitación incluidas. Confirma que la recuperación y los datos de facturación estén al día. El acceso del desarrollador se retira o se ajusta según el soporte que continúe. No revoques el acceso a mitad de una tarea sin coordinar la interrupción que eso cause.",
      ],
    },
    {
      heading: "15. Políticas relacionadas y preguntas",
      paragraphs: [
        `Los pagos, la cancelación, los reembolsos, la propiedad y los demás términos del proyecto siguen rigiéndose por el acuerdo aplicable y las políticas relacionadas de Over Drive. Las preguntas de incorporación pueden enviarse a admin@overdriveio.com o comentarse al 347.822.0528. ${contactEs}`,
      ],
    },
    {
      heading: "Política de mantenimiento y soporte",
      part: true,
      paragraphs: [
        "Esta política explica cómo se pide soporte y cómo se organiza el mantenimiento continuo. La compra de un proyecto único no incluye mantenimiento ilimitado ni indefinido. Cualquier período de soporte incluido, servicio recurrente, compromiso de respuesta o acuerdo de nivel de servicio debe constar en la propuesta aceptada o en el plan de soporte.",
      ],
    },
    {
      heading: "Soporte incluido y trabajo fuera del plan",
      paragraphs: [
        "El acuerdo debe indicar si la corrección de defectos después del lanzamiento está incluida y por cuánto tiempo. Esta política general no crea un período fijo de soporte gratuito. Un defecto cubierto es un fallo reproducible del trabajo entregado respecto de la especificación acordada, en las condiciones soportadas. Revisamos lo informado para determinar la corrección u otro remedio según el acuerdo y la ley aplicable.",
        "Según el plan comprado, el mantenimiento puede incluir actualizaciones de dependencias, parches de seguridad, revisiones de configuración, monitoreo de disponibilidad, revisiones de rendimiento, cambios de contenido, revisiones de base de datos, respaldos o asistencia técnica. Solo entran los servicios y los cupos listados de forma expresa. El monitoreo y los respaldos no son continuos ni están garantizados salvo que se contraten de forma específica.",
        "Funciones nuevas, rediseños, páginas adicionales, integraciones nuevas, migraciones, carga extensa de contenido, capacitación y el trabajo causado por cambios no autorizados o por cambios de una plataforma de terceros pueden requerir una cotización aparte. Explicamos los cargos propuestos y pedimos aprobación antes del trabajo facturable. El precio de $25 por ronda extra de revisión aplica a las revisiones del proyecto que califiquen. No es una tarifa fija para todo el mantenimiento futuro ni para los incidentes técnicos.",
      ],
    },
    {
      heading: "Cómo pedir soporte",
      paragraphs: [
        "Escribe a admin@overdriveio.com o usa el canal de soporte de tu plan. Incluye el negocio y el nombre del proyecto, la URL o la función afectada, los pasos para reproducir el problema, capturas sin información sensible y el impacto en el negocio. En una caída o un posible incidente de seguridad, indica con claridad la urgencia. No incluyas contraseñas, datos de tarjeta, códigos de recuperación ni datos de clientes que no hagan falta.",
        "El horario de soporte, los objetivos de respuesta, la escalación y cualquier cobertura de emergencia se definen en el plan comprado. Salvo contrato expreso, el soporte se atiende en nuestras operaciones regulares y no es un servicio de emergencia 24/7. Un objetivo de respuesta no garantiza la resolución. La resolución depende de la gravedad, el acceso, la complejidad y la cooperación de terceros.",
        "Priorizamos las solicitudes según el plan, el impacto, las implicaciones de seguridad y la capacidad disponible. Podemos pedir registros, acceso, pruebas o aclaraciones antes de seguir. Cuando sea práctico, los cambios se prueban antes de publicarlos en producción. Las ventanas de mantenimiento, el tiempo fuera y el plan de reversión se coordinan según el trabajo.",
      ],
    },
    {
      heading: "Responsabilidades del cliente y plataformas de terceros",
      paragraphs: [
        "Mantén al día las suscripciones, los registros de dominio, los métodos de facturación y la información de recuperación. Conserva permisos adecuados y autenticación multifactor, da las aprobaciones a tiempo y avísanos de los cambios hechos por otros desarrolladores o administradores. Sigues siendo responsable del contenido del negocio, del uso lícito de los datos y de tus propias cuentas de proveedor. No podemos hacer tareas que requieran un acceso que no esté disponible o gastos no aprobados.",
        "El hosting, el correo, las bases de datos, los pagos, las API y otras plataformas los operan proveedores independientes. Sus caídas, precios, cambios de funciones, restricciones de cuenta y procesos de verificación pueden afectar el proyecto. Ayudamos solo en la medida incluida en el plan o aprobada aparte. No hay una promesa general de disponibilidad ininterrumpida ni de restauración de un tercero.",
      ],
    },
    {
      heading: "Respaldos e incidentes de seguridad",
      paragraphs: [
        "Un servicio de respaldo debe indicar qué se respalda, la frecuencia, la conservación, el lugar de almacenamiento, el acceso y las responsabilidades de restauración. No des por hecho que una publicación o un repositorio es un respaldo completo de la base de datos o de los archivos. La restauración puede estar limitada por el respaldo disponible y por las capacidades del proveedor. Los objetivos de recuperación y las pruebas deben acordarse de forma expresa. No se implica una garantía de cero pérdida de datos. Conserva copias independientes de los registros esenciales del negocio cuando corresponda.",
        "Avísanos pronto de una posible vulneración que afecte un proyecto con soporte. Si estamos autorizados, podemos ayudar a investigar, revocar accesos, restaurar configuraciones o coordinar con los proveedores dentro del alcance aplicable. Una respuesta adicional al incidente puede requerir un encargo aparte. No garantizamos que un sistema sea inmune a un ataque. Los deberes de aviso y las obligaciones legales siguen en las partes responsables y esta política no los sustituye.",
      ],
    },
    {
      heading: "Facturación del mantenimiento, cancelación y entrega",
      part: true,
      paragraphs: [
        "El mantenimiento recurrente requiere un plan descrito con claridad, una frecuencia de cobro, un precio o un método de cálculo, y una autorización afirmativa. Deben informarse los cupos de uso, los excedentes y los costos de proveedores de pago. Los cambios del plan o el trabajo adicional requieren acuerdo. La política de pagos y facturación rige las preguntas de factura y los pagos.",
        "Cancela por un control del portal o escribiendo a admin@overdriveio.com. La cancelación y el reembolso siguen el plan informado y la política de cancelación y reembolsos, sujetos a la ley aplicable. Cancelar el soporte de Over Drive no cancela automáticamente tus suscripciones directas con un proveedor. Si hay cargos vencidos y no disputados, podemos pausar el soporte afectado después de un aviso escrito y una oportunidad razonable de resolver el saldo. No borramos datos del cliente ni tomamos la propiedad de sus cuentas para cobrar.",
        "Al terminar el soporte, coordinamos el retiro o el ajuste del acceso del desarrollador y la entrega de los materiales de traspaso incluidos. Confirma quién administrará renovaciones, monitoreo, actualizaciones, respaldos y seguridad en adelante. La ayuda de exportación o migración que pase del traspaso acordado puede cotizarse aparte. La conservación y la eliminación de información siguen la política de privacidad, el acuerdo y la ley aplicable.",
        "Estas políticas no excluyen protecciones legales obligatorias ni remedios por no cumplir compromisos vinculantes. Un acuerdo vigente no cambia de forma retroactiva por una actualización del sitio. Los cambios de un plan de soporte activo deben seguir su proceso de cambio acordado y los avisos que hagan falta.",
        contactEs,
      ],
    },
  ],
};

export function policyDocs(locale: Locale) {
  const es = locale === "es";
  return {
    privacy: es ? privacyEs : privacyEn,
    terms: es ? termsEs : termsEn,
    support: es ? supportEs : supportEn,
  };
}
