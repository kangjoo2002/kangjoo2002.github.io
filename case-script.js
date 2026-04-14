const caseTitle = document.querySelector("#case-title");
const caseProject = document.querySelector("#case-project");
const caseSummary = document.querySelector("#case-summary");
const caseActions = document.querySelector("#case-actions");
const caseMetrics = document.querySelector("#case-metrics");
const caseSections = document.querySelector("#case-sections");
const caseRelated = document.querySelector("#case-related");
const caseRelatedGrid = document.querySelector("#case-related-grid");
const metaDescription = document.querySelector('meta[name="description"]');
const ogTitle = document.querySelector('meta[property="og:title"]');
const ogDescription = document.querySelector('meta[property="og:description"]');
const twitterTitle = document.querySelector('meta[name="twitter:title"]');
const twitterDescription = document.querySelector('meta[name="twitter:description"]');
const analytics = window.portfolioAnalytics;

const params = new URLSearchParams(window.location.search);
const slug = params.get("case");
const caseStudies = Array.isArray(window.CASE_STUDIES) ? window.CASE_STUDIES : [];
const selectedCase = caseStudies.find((item) => item.slug === slug);

const createElement = (tagName, className, text) => {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (typeof text === "string") {
    element.textContent = text;
  }

  return element;
};

const renderEmptyState = () => {
  document.title = "Case Not Found | Juhyeong Kang";

  if (caseProject) {
    caseProject.textContent = "Case Study";
  }

  if (caseTitle) {
    caseTitle.textContent = "요청한 사례를 찾지 못했습니다.";
  }

  if (caseSummary) {
    caseSummary.textContent = "메인 페이지에서 다시 사례를 선택해 주세요.";
  }

  if (caseActions) {
    const backLink = createElement("a", "button button-primary", "사례 목록으로 돌아가기");
    backLink.href = "./index.html#cases";
    caseActions.append(backLink);
  }

  if (caseMetrics) {
    caseMetrics.replaceChildren();
    const emptyCard = createElement("article", "empty-state");
    const heading = createElement("h1", "", "유효하지 않은 slug입니다.");
    const body = createElement(
      "p",
      "",
      "주소가 바뀌었거나 아직 사이트 내부 상세 페이지로 등록되지 않은 사례일 수 있습니다.",
    );
    emptyCard.append(heading, body);
    caseMetrics.append(emptyCard);
  }
};

if (!selectedCase) {
  renderEmptyState();
  analytics?.track("case_not_found", {
    requested_case_slug: slug || "(empty)",
  });
} else {
  const pageTitle = `${selectedCase.title} | ${selectedCase.project} | Juhyeong Kang`;
  document.title = pageTitle;

  if (metaDescription) {
    metaDescription.setAttribute("content", selectedCase.summary);
  }

  if (ogTitle) {
    ogTitle.setAttribute("content", pageTitle);
  }

  if (ogDescription) {
    ogDescription.setAttribute("content", selectedCase.summary);
  }

  if (twitterTitle) {
    twitterTitle.setAttribute("content", pageTitle);
  }

  if (twitterDescription) {
    twitterDescription.setAttribute("content", selectedCase.summary);
  }

  if (caseProject) {
    caseProject.textContent = `${selectedCase.project} Case Study`;
  }

  if (caseTitle) {
    caseTitle.textContent = selectedCase.title;
  }

  if (caseSummary) {
    caseSummary.textContent = selectedCase.summary;
  }

  if (caseActions) {
    const sourceLink = createElement("a", "button button-primary", "GitHub 원문 보기");
    sourceLink.href = selectedCase.sourceUrl;
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener noreferrer";

    const repoLink = createElement("a", "button button-secondary", "프로젝트 저장소");
    repoLink.href = selectedCase.repoUrl;
    repoLink.target = "_blank";
    repoLink.rel = "noopener noreferrer";

    const homeLink = createElement("a", "button button-secondary", "메인으로 돌아가기");
    homeLink.href = "./index.html#cases";

    caseActions.append(sourceLink, repoLink, homeLink);
  }

  if (caseMetrics) {
    selectedCase.metrics.forEach((metric) => {
      const card = createElement("article", "case-meta-card");
      const title = createElement("dt", "", metric.label);
      const value = createElement("dd", "", metric.value);
      const list = createElement("dl");

      list.append(title, value);
      card.append(list);
      caseMetrics.append(card);
    });
  }

  if (caseSections) {
    selectedCase.sections.forEach((section) => {
      const card = createElement("article", "case-section-card");
      const heading = createElement("h2", "", section.heading);
      card.append(heading);

      (section.paragraphs || []).forEach((paragraph) => {
        card.append(createElement("p", "", paragraph));
      });

      if (Array.isArray(section.bullets) && section.bullets.length > 0) {
        const bulletList = createElement("ul", "case-bullets");

        section.bullets.forEach((bullet) => {
          bulletList.append(createElement("li", "", bullet));
        });

        card.append(bulletList);
      }

      caseSections.append(card);
    });
  }

  if (caseRelated && caseRelatedGrid) {
    const relatedCases = caseStudies
      .filter((item) => item.project === selectedCase.project && item.slug !== selectedCase.slug)
      .slice(0, 3);

    if (relatedCases.length > 0) {
      caseRelated.hidden = false;

      relatedCases.forEach((item) => {
        const card = createElement("article", "case-related-card");
        const chipRow = createElement("div", "case-chip-row");
        chipRow.append(createElement("span", "", item.project));

        const heading = createElement("h3", "", item.title);
        const summary = createElement("p", "", item.summary);
        const link = createElement("a", "", "이 사례 보기");
        link.href = `./case.html?case=${item.slug}`;

        card.append(chipRow, heading, summary, link);
        caseRelatedGrid.append(card);
      });
    }
  }

  analytics?.track("view_case", {
    case_slug: selectedCase.slug,
    project_name: selectedCase.project,
  });
}
