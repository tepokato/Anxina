const centralTimeNodes = document.querySelectorAll("[data-central-time]");

if (centralTimeNodes.length) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const updateCentralTime = () => {
    const now = new Date();
    const parts = formatter.formatToParts(now);
    const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const formatted = `${lookup.year}/${lookup.month}/${lookup.day} ${lookup.hour}:${lookup.minute}`;

    centralTimeNodes.forEach((node) => {
      node.textContent = formatted;
    });
  };

  const scheduleTick = () => {
    const now = new Date();
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    window.setTimeout(() => {
      updateCentralTime();
      scheduleTick();
    }, msUntilNextMinute);
  };

  updateCentralTime();
  scheduleTick();
}
