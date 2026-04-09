document.documentElement.classList.add("js");

const filterButtons = Array.from(document.querySelectorAll(".filter-button"));
const caseCards = Array.from(document.querySelectorAll(".case-card"));
const navLinks = Array.from(document.querySelectorAll(".nav a"));
const sections = Array.from(document.querySelectorAll("main section[id]"));
const revealTargets = Array.from(document.querySelectorAll(".reveal"));

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { filter } = button.dataset;

    filterButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");

    caseCards.forEach((card) => {
      const tags = (card.dataset.tags || "").split(" ");
      const shouldShow = filter === "all" || tags.includes(filter);
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const sectionId = `#${entry.target.id}`;

      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === sectionId);
      });
    });
  },
  {
    rootMargin: "-35% 0px -45% 0px",
    threshold: 0.1,
  },
);

sections.forEach((section) => sectionObserver.observe(section));

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
