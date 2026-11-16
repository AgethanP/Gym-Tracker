// ==========================================
// GYM TRACKER – GEMEINSAME NAVIGATION
// ==========================================

// In einem eigenen Bereich ausführen, damit keine Variablen
// mit den JavaScript-Dateien anderer Seiten kollidieren.
(function () {
    "use strict";

    // Eine bereits vorhandene Navigation nicht doppelt einfügen.
    if (document.querySelector(".home-navigation")) {
        return;
    }

    // Auf GitHub Pages funktionieren relative Dateinamen auch dann,
    // wenn die App in einem Unterordner veröffentlicht ist.
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    // Diese Unterseiten gehören zum Bereich „Mehr“.
    const moreSubpages = new Set([
        "calendar.html",
        "plan-create.html",
        "backup.html"
    ]);

    const activePage = moreSubpages.has(currentPage)
        ? "more.html"
        : currentPage;

    // Die fünf Hauptbereiche bleiben unverändert.
    const links = [
        { page: "index.html", name: "Home", icon: "house" },
        { page: "training.html", name: "Training", icon: "dumbbell" },
        { page: "history.html", name: "Historie", icon: "history" },
        { page: "statistics.html", name: "Statistik", icon: "chart" },
        { page: "more.html", name: "Mehr", icon: "more" }
    ];

    // Feste SVG-Symbole: keine externen Bibliotheken erforderlich.
    const icons = {
        house: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
        dumbbell: '<path d="M6.5 6.5 17.5 17.5"/><path d="m3 7 4-4M17 21l4-4"/><path d="m3 12 9-9M12 21l9-9"/>',
        history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        chart: '<path d="M4 20V12M10 20V7M16 20V10M22 20V4"/>',
        more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
    };

    const navigation = document.createElement("nav");
    navigation.className = "home-navigation";
    navigation.setAttribute("aria-label", "Hauptnavigation");

    for (const link of links) {
        const item = document.createElement("a");
        item.href = link.page;

        if (link.page === activePage) {
            item.classList.add("active");

            if (link.page === currentPage) {
                // Die verlinkte Seite ist selbst geöffnet.
                item.setAttribute("aria-current", "page");
            } else {
                // Eine Unterseite von „Mehr“ ist geöffnet.
                item.setAttribute("aria-label", "Mehr – aktueller Bereich");
            }
        }

        item.innerHTML = `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true"
                 focusable="false"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="1.8"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                ${icons[link.icon]}
            </svg>
            <span>${link.name}</span>
        `;

        navigation.appendChild(item);
    }

    document.body.appendChild(navigation);
})();