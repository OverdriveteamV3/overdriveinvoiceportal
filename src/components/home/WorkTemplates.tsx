import type { WorkStudy } from "@/lib/work-copy";

const OCTOBER_LEAD = 4;
const OCTOBER_DAYS = 31;
const SELECTED_DAY = 27;

function Chrome({ url }: { url: string }) {
  return (
    <div className="wt-chrome">
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <em>{url}</em>
    </div>
  );
}

function PropertyTemplate({ study }: { study: Extract<WorkStudy, { kind: "property" }> }) {
  return (
    <div className="wt wt-property">
      <Chrome url={study.url} />
      <header>
        <strong>{study.brand}</strong>
        <nav>
          {study.links.map((link, index) => (
            <span key={link} className={index === 0 ? "is-on" : ""}>
              {link}
            </span>
          ))}
        </nav>
      </header>
      <form>
        <span>{study.search}</span>
        <b>{study.searchButton}</b>
      </form>
      <div className="wt-listings">
        {study.listings.map((listing, index) => (
          <article key={listing.place} className={`tone-${index}`}>
            <div />
            <p>{listing.price}</p>
            <span>{listing.specs}</span>
            <em>{listing.place}</em>
          </article>
        ))}
      </div>
    </div>
  );
}

function DashboardTemplate({ study }: { study: Extract<WorkStudy, { kind: "dashboard" }> }) {
  return (
    <div className="wt wt-dashboard">
      <Chrome url={study.url} />
      <div className="wt-app">
        <aside>
          {study.nav.map((item, index) => (
            <span key={item} className={index === 0 ? "is-on" : ""}>
              {item}
            </span>
          ))}
        </aside>
        <div>
          <strong>{study.screenTitle}</strong>
          <div className="wt-stats">
            {study.stats.map(([label, value, delta]) => (
              <p key={label}>
                <span>{label}</span>
                {value}
                <em>{delta}</em>
              </p>
            ))}
          </div>
          <svg viewBox="0 0 360 88" role="img" aria-label={study.chart}>
            <path d="M8 20H352M8 48H352M8 76H352" />
            <path d="M8 72L40 64L72 58L104 61L136 42L168 48L200 28L232 34L264 18L296 24L328 10L352 14" />
          </svg>
          <table>
            <thead>
              <tr>
                {study.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {study.rows.map(([name, stage, value]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>
                    <i className={stage === "Active" || stage === "Activo" ? "is-live" : ""}>{stage}</i>
                  </td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BookingTemplate({ study }: { study: Extract<WorkStudy, { kind: "booking" }> }) {
  const cells = [
    ...Array.from({ length: OCTOBER_LEAD }, () => ""),
    ...Array.from({ length: OCTOBER_DAYS }, (_, index) => String(index + 1)),
  ];

  return (
    <div className="wt wt-booking">
      <Chrome url={study.url} />
      <div className="wt-book">
        <div>
          <strong>{study.month}</strong>
          <div className="wt-week">
            {study.weekdays.map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>
          <div className="wt-days">
            {cells.map((day, index) => (
              <span key={index} className={day === String(SELECTED_DAY) ? "is-on" : ""}>
                {day}
              </span>
            ))}
          </div>
        </div>
        <div>
          <strong>{study.screenTitle}</strong>
          <span className="wt-service">{study.service}</span>
          <div className="wt-times">
            {study.times.map((time, index) => (
              <span key={time} className={index === study.selected ? "is-on" : ""}>
                {time}
              </span>
            ))}
          </div>
          <b>{study.confirm}</b>
        </div>
      </div>
    </div>
  );
}

function PortalTemplate({ study }: { study: Extract<WorkStudy, { kind: "portal" }> }) {
  return (
    <div className="wt wt-portal">
      <Chrome url={study.url} />
      <header>
        <div>
          <strong>{study.project}</strong>
          <span>{study.progressLabel} {study.progress}</span>
        </div>
        <em>{study.status}</em>
      </header>
      <div className="wt-track" aria-hidden="true">
        <i />
      </div>
      <ol>
        {study.steps.map(([name, state]) => (
          <li key={name} className={state === "Active" || state === "Activo" ? "is-live" : ""}>
            <b>{name}</b>
            <span>{state}</span>
          </li>
        ))}
      </ol>
      <div className="wt-portal-grid">
        <div>
          <span>{study.filesLabel}</span>
          {study.files.map(([name, meta]) => (
            <p key={name}>
              {name}
              <em>{meta}</em>
            </p>
          ))}
        </div>
        <div>
          <span>{study.invoiceLabel}</span>
          <p>
            {study.invoice}
            <em>{study.amount}</em>
          </p>
        </div>
      </div>
    </div>
  );
}

export function WorkTemplate({ study }: { study: WorkStudy }) {
  if (study.kind === "property") return <PropertyTemplate study={study} />;
  if (study.kind === "dashboard") return <DashboardTemplate study={study} />;
  if (study.kind === "booking") return <BookingTemplate study={study} />;
  return <PortalTemplate study={study} />;
}

export function WorkTemplateStyles() {
  return (
    <style>{`
      .wt {
        height: 468px;
        overflow: hidden;
        background: #fff;
        color: #151f24;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        line-height: 1.35;
      }
      .wt * { box-sizing: border-box; }
      .wt-chrome {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 28px;
        padding: 0 12px;
        background: #f3f5f7;
        border-bottom: 1px solid #e7ebef;
      }
      .wt-chrome span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #d5dbe1;
      }
      .wt-chrome span:first-child { background: #f8f959; }
      .wt-chrome em {
        margin-left: 8px;
        color: #56616d;
        font-size: 11px;
        font-style: normal;
      }
      .wt-property header,
      .wt-portal header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
      }
      .wt-property header strong { font-size: 16px; letter-spacing: 1px; }
      .wt-property nav { display: flex; gap: 14px; color: #56616d; font-weight: 700; }
      .wt-property nav .is-on { color: #0780f7; }
      .wt-property form {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: 0 16px;
        padding: 10px 10px 10px 14px;
        border: 1px solid #e7ebef;
        border-radius: 8px;
        color: #8ea0ae;
      }
      .wt-property form b {
        padding: 8px 14px;
        border-radius: 6px;
        background: #0780f7;
        color: #fff;
      }
      .wt-listings {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        padding: 16px;
      }
      .wt-listings article { min-width: 0; }
      .wt-listings article div {
        height: 148px;
        border-radius: 8px;
        background:
          linear-gradient(#ffffff55, #ffffff00 40%),
          linear-gradient(160deg, #d7e4ea, #8aa4b3 55%, #315866);
      }
      .wt-listings .tone-1 div {
        background:
          linear-gradient(#ffffff33, #ffffff00 42%),
          linear-gradient(160deg, #efe6d4, #c4a882 50%, #6d5a42);
      }
      .wt-listings .tone-2 div {
        background:
          linear-gradient(#ffffff33, #ffffff00 42%),
          linear-gradient(160deg, #e7eef2, #9eb4a8 48%, #35584a);
      }
      .wt-listings p { margin: 8px 0 0; font-size: 16px; font-weight: 800; }
      .wt-listings span,
      .wt-listings em { display: block; color: #56616d; font-size: 11px; font-style: normal; }
      .wt-app { display: grid; grid-template-columns: 132px minmax(0, 1fr); height: calc(100% - 28px); }
      .wt-dashboard aside {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 14px 10px;
        background: #151f24;
        color: #fff;
      }
      .wt-dashboard aside span { padding: 8px 10px; border-radius: 6px; color: #b7c3cc; }
      .wt-dashboard aside .is-on { background: #0780f7; color: #fff; }
      .wt-dashboard .wt-app > div { padding: 14px 14px 0; }
      .wt-dashboard strong { font-size: 18px; }
      .wt-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
      .wt-stats p {
        margin: 0;
        padding: 10px;
        border: 1px solid #e7ebef;
        border-radius: 8px;
        font-family: Impact, "Arial Narrow", sans-serif;
        font-size: 26px;
        line-height: 1;
      }
      .wt-stats span,
      .wt-stats em {
        display: block;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 11px;
        font-style: normal;
        font-weight: 700;
      }
      .wt-stats span { margin-bottom: 6px; color: #56616d; }
      .wt-stats em { margin-top: 6px; color: #0780f7; }
      .wt-dashboard svg { display: block; width: 100%; height: 88px; margin-top: 8px; }
      .wt-dashboard svg path:first-child { stroke: #e7ebef; fill: none; }
      .wt-dashboard svg path:last-child { stroke: #0780f7; stroke-width: 2.5; fill: none; }
      .wt-dashboard table { width: 100%; margin-top: 8px; border-collapse: collapse; }
      .wt-dashboard th {
        padding: 6px 0;
        border-bottom: 1px solid #e7ebef;
        color: #8ea0ae;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.6px;
        text-align: left;
        text-transform: uppercase;
      }
      .wt-dashboard td { padding: 8px 8px 8px 0; border-bottom: 1px solid #e7ebef; font-size: 12px; }
      .wt-dashboard i {
        display: inline-block;
        padding: 2px 7px;
        border-radius: 999px;
        background: #f3f5f7;
        font-style: normal;
        font-size: 11px;
        font-weight: 700;
      }
      .wt-dashboard i.is-live { background: #0780f7; color: #fff; }
      .wt-book { display: grid; grid-template-columns: 1.15fr 0.85fr; height: calc(100% - 28px); }
      .wt-book > div { padding: 16px; }
      .wt-book > div + div { border-left: 1px solid #e7ebef; }
      .wt-booking strong { font-size: 16px; }
      .wt-week,
      .wt-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; margin-top: 10px; text-align: center; }
      .wt-week span { color: #8ea0ae; font-size: 10px; font-weight: 800; }
      .wt-days span { height: 28px; border-radius: 6px; line-height: 28px; }
      .wt-days span.is-on { background: #0780f7; color: #fff; font-weight: 800; }
      .wt-service { display: block; margin: 8px 0 12px; color: #56616d; }
      .wt-times { display: grid; gap: 8px; }
      .wt-times span {
        padding: 8px 10px;
        border: 1px solid #e7ebef;
        border-radius: 8px;
        font-weight: 700;
      }
      .wt-times span.is-on { border-color: #0780f7; background: #0780f7; color: #fff; }
      .wt-book b {
        display: block;
        margin-top: 12px;
        padding: 10px;
        border-radius: 8px;
        background: #f8f959;
        text-align: center;
      }
      .wt-portal header strong { display: block; font-size: 18px; }
      .wt-portal header span { color: #56616d; }
      .wt-portal header em {
        padding: 4px 8px;
        border-radius: 999px;
        background: #0780f7;
        color: #fff;
        font-size: 11px;
        font-style: normal;
        font-weight: 800;
      }
      .wt-track { height: 8px; margin: 0 16px; border-radius: 999px; background: #e7ebef; }
      .wt-track i { display: block; width: 68%; height: 100%; border-radius: inherit; background: #0780f7; }
      .wt-portal ol {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin: 14px 16px;
        padding: 0;
        list-style: none;
      }
      .wt-portal li { padding: 10px; border-radius: 8px; background: #f8fafa; }
      .wt-portal li.is-live { background: #151f24; color: #fff; }
      .wt-portal li b,
      .wt-portal li span { display: block; }
      .wt-portal li span { margin-top: 2px; color: #56616d; font-size: 11px; }
      .wt-portal li.is-live span { color: #f8f959; }
      .wt-portal-grid {
        display: grid;
        grid-template-columns: 1.4fr 0.8fr;
        gap: 12px;
        padding: 0 16px;
      }
      .wt-portal-grid span {
        display: block;
        margin-bottom: 6px;
        color: #8ea0ae;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.6px;
        text-transform: uppercase;
      }
      .wt-portal-grid p {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin: 0;
        padding: 8px 0;
        border-top: 1px solid #e7ebef;
        font-weight: 700;
      }
      .wt-portal-grid em { color: #56616d; font-size: 11px; font-style: normal; font-weight: 600; }
    `}</style>
  );
}
