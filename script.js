document.documentElement.classList.add("js");

const filterButtons = Array.from(document.querySelectorAll(".filter-button"));
const caseCards = Array.from(document.querySelectorAll(".case-card"));
const caseGroups = Array.from(document.querySelectorAll("[data-case-group]"));
const archiveLinks = Array.from(document.querySelectorAll(".archive-link"));
const caseArchive = document.querySelector(".case-archive");
const navLinks = Array.from(document.querySelectorAll(".nav a"));
const sections = Array.from(document.querySelectorAll("main section[id]"));
const revealTargets = Array.from(document.querySelectorAll(".reveal"));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const analytics = window.portfolioAnalytics;
let activeProjectFilter = "all";

const setActiveNav = (sectionId) => {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === sectionId;
    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const applyFilters = () => {
  filterButtons.forEach((button) => {
    const isActive = activeProjectFilter === button.dataset.filterValue;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  caseCards.forEach((card) => {
    const tags = (card.dataset.tags || "").split(" ");
    const shouldShow = activeProjectFilter === "all" || tags.includes(activeProjectFilter);
    card.classList.toggle("is-hidden", !shouldShow);
  });

  caseGroups.forEach((group) => {
    const visibleCardCount = Array.from(group.querySelectorAll(".case-card")).filter(
      (card) => !card.classList.contains("is-hidden"),
    ).length;

    group.classList.toggle("is-hidden", visibleCardCount === 0);
  });

  let visibleArchiveLinkCount = 0;

  archiveLinks.forEach((link) => {
    const tags = (link.dataset.tags || "").split(" ");
    const shouldShow = activeProjectFilter === "all" || tags.includes(activeProjectFilter);
    link.classList.toggle("is-hidden", !shouldShow);

    if (shouldShow) {
      visibleArchiveLinkCount += 1;
    }
  });

  if (caseArchive) {
    caseArchive.classList.toggle("is-hidden", visibleArchiveLinkCount === 0);
  }
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeProjectFilter = button.dataset.filterValue || "all";
    applyFilters();
    analytics?.track("case_filter_select", {
      filter_value: activeProjectFilter,
    });
  });
});

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        setActiveNav(`#${entry.target.id}`);
      });
    },
    {
      rootMargin: "-35% 0px -45% 0px",
      threshold: 0.1,
    },
  );

  sections.forEach((section) => sectionObserver.observe(section));
} else if (sections[0]) {
  setActiveNav(`#${sections[0].id}`);
}

if (!("IntersectionObserver" in window) || prefersReducedMotion) {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12,
    },
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
}

applyFilters();
