(() => {
  const measurementId = "G-LMM1RVJ5VX";
  const isConfigured =
    /^G-[A-Z0-9]+$/.test(measurementId);

  const analytics = {
    isEnabled: false,
    track: () => {},
  };

  window.portfolioAnalytics = analytics;

  if (!isConfigured) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.append(script);

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    anonymize_ip: true,
  });

  analytics.isEnabled = true;
  analytics.track = (eventName, params = {}) => {
    if (!eventName || typeof eventName !== "string") {
      return;
    }

    window.gtag("event", eventName, params);
  };
})();
