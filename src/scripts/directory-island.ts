/**
 * The ONE client island (D3/D5/D7/D8/E9). Progressive enhancement ONLY:
 * the grid is fully server-rendered; this script only toggles `hidden` on
 * existing nodes — it NEVER re-renders the grid from data (that would regress
 * the no-JS crawlability D4/E4 protect). Loaded once from BaseLayout.
 */
import { sendEvent } from "@lib/analytics";

function setupFilter(): void {
  const grid = document.getElementById("templateGrid");
  const search = document.getElementById("search") as HTMLInputElement | null;
  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>(".chip"));
  const resultCount = document.getElementById("resultCount");
  const emptyState = document.getElementById("emptyState");
  const resetBtn = document.getElementById("resetFilters");
  if (!grid) return;
  let activeFilter = "all";

  const cards = (): HTMLElement[] =>
    Array.from(grid.querySelectorAll<HTMLElement>(".template-card"));

  const apply = (): void => {
    const q = (search?.value ?? "").trim().toLowerCase();
    let visible = 0;
    for (const card of cards()) {
      const cats = (card.dataset.categories ?? "").split(" ");
      const hay = card.dataset.search ?? "";
      const show =
        (activeFilter === "all" || cats.includes(activeFilter)) && (!q || hay.includes(q));
      card.hidden = !show;
      if (show) visible++;
    }
    if (resultCount) resultCount.textContent = `${visible} template${visible === 1 ? "" : "s"}`;
    if (emptyState) emptyState.hidden = visible !== 0;
  };

  for (const chip of chips) {
    chip.addEventListener("click", () => {
      for (const c of chips) c.setAttribute("aria-pressed", String(c === chip));
      activeFilter = chip.dataset.filter ?? "all";
      sendEvent("template_filter_click", { filter: activeFilter });
      apply();
    });
  }
  search?.addEventListener("input", apply);
  resetBtn?.addEventListener("click", () => {
    if (search) search.value = "";
    activeFilter = "all";
    for (const c of chips) c.setAttribute("aria-pressed", String(c.dataset.filter === "all"));
    apply();
  });
  apply();
}

function setupMobileNav(): void {
  const toggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
  const links = document.querySelector<HTMLElement>(".nav-links");
  toggle?.addEventListener("click", () => {
    const open = links?.classList.toggle("open") ?? false;
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function setupCopyBeacon(): void {
  // Capture phase so the beacon fires BEFORE the link navigates (E9). The CTA
  // opens in a new tab (rel=noopener) so the source tab never unloads anyway.
  document.addEventListener(
    "click",
    (e) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-copy]");
      if (!el || !el.dataset.copy) return; // modal copy starts with empty data-copy
      sendEvent("copy_google_docs_click", {
        slug: el.dataset.copy,
        cta_location: el.closest(".detail") ? "detail" : el.closest(".modal") ? "modal" : "card",
      });
    },
    { capture: true },
  );
}

function setupModal(): void {
  const modal = document.getElementById("previewModal");
  const title = document.getElementById("modalTitle");
  const thumb = document.getElementById("modalThumb");
  const copy = document.getElementById("modalCopy") as HTMLAnchorElement | null;
  const closeBtn = document.getElementById("modalClose");
  if (!modal) return;
  let lastFocus: HTMLElement | null = null;

  const setInert = (on: boolean): void => {
    document.querySelectorAll("main, .site-header, .site-footer").forEach((el) => {
      if (on) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    });
  };

  const open = (card: HTMLElement): void => {
    lastFocus = document.activeElement as HTMLElement | null;
    // Mirror the card's OWN primary action so the modal CTA stays correct per
    // template kind: google-doc cards copy to /go/<slug>/ (new tab), builder
    // cards open /resume-builder/. Hardcoding "Copy in Google Docs" 404s on
    // builder templates, which have no /go/ entry.
    const primary = card.querySelector<HTMLAnchorElement>(".card-actions a.primary");
    const copySlug = primary?.dataset.copy ?? ""; // only google-doc cards carry data-copy
    const slug = copySlug || primary?.dataset.openBuilder || ""; // builder cards carry data-open-builder
    if (title)
      title.textContent = card.querySelector(".card-title")?.textContent?.trim() ?? "Template";
    if (thumb) {
      thumb.innerHTML = "";
      const t = card.querySelector(".thumb");
      if (t) thumb.appendChild(t.cloneNode(true));
    }
    if (copy && primary) {
      copy.href = primary.getAttribute("href") ?? "#";
      copy.textContent = primary.textContent?.trim() || "Open";
      if (primary.target) copy.target = primary.target;
      else copy.removeAttribute("target");
      // Fire the copy beacon only on the actual Google Docs path.
      if (copySlug) copy.dataset.copy = copySlug;
      else delete copy.dataset.copy;
    }
    sendEvent("template_preview_open", { slug });
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    setInert(true);
    (closeBtn as HTMLElement | null)?.focus();
  };
  const close = (): void => {
    modal.hidden = true;
    document.body.style.overflow = "";
    setInert(false);
    lastFocus?.focus();
  };

  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-preview]");
    if (!btn) return;
    const card = btn.closest<HTMLElement>(".template-card");
    if (card) {
      e.preventDefault();
      open(card);
    }
  });
  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
  modal.addEventListener("keydown", (e) => {
    if (e.key !== "Tab" || modal.hidden) return;
    const f = modal.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])',
    );
    const first = f[0];
    const last = f[f.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

setupFilter();
setupMobileNav();
setupCopyBeacon();
setupModal();
