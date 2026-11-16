// ==========================================
// GYM TRACKER – LIGHT / DARK MODE
// ==========================================

(() => {
    "use strict";

    const THEME_STORAGE_KEY = "gym-tracker-theme";
    const themeToggle = document.getElementById("theme-toggle");
    const themeIcon = document.getElementById("theme-icon");
    const themeLabel = document.getElementById("theme-label");

    // Systemeinstellung lesen, falls keine eigene Auswahl gespeichert ist.
    const systemThemeQuery = typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;

    function getSystemTheme() {
        return systemThemeQuery && systemThemeQuery.matches ? "dark" : "light";
    }

    function getSavedTheme() {
        try {
            const value = localStorage.getItem(THEME_STORAGE_KEY);
            return value === "light" || value === "dark" ? value : null;
        } catch (error) {
            console.warn("Farbschema konnte nicht gelesen werden:", error);
            return null;
        }
    }

    // Ohne eigene Auswahl folgt die App der Systemeinstellung.
    let savedTheme = getSavedTheme();
    let currentTheme = savedTheme || getSystemTheme();

    function applyTheme(theme) {
        currentTheme = theme;

        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.style.colorScheme = theme;

        // Der Umschalter steht auf „Mehr“ und „Datensicherung“.
        // Alle anderen Seiten erhalten trotzdem das gespeicherte Farbschema.
        if (themeToggle) {
            const nextTheme = theme === "dark" ? "light" : "dark";
            themeToggle.setAttribute(
                "aria-label",
                `${nextTheme === "dark" ? "Dark" : "Light"} Mode aktivieren`
            );
            themeToggle.setAttribute("title", "Farbschema wechseln");
        }

        if (themeIcon) {
            themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
        }

        if (themeLabel) {
            themeLabel.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
        }
    }

    function saveTheme(theme) {
        savedTheme = theme;

        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (error) {
            // Auch bei gesperrtem Browserspeicher bleibt der Wechsel
            // mindestens für die aktuelle Seite funktionsfähig.
            console.warn("Farbschema konnte nicht gespeichert werden:", error);
        }
    }

    // Ein vorhandener Button schaltet zwischen Hell und Dunkel um.
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const nextTheme = currentTheme === "dark" ? "light" : "dark";
            applyTheme(nextTheme);
            saveTheme(nextTheme);
        });
    }

    // Änderungen in einem zweiten Browser-Tab übernehmen.
    window.addEventListener("storage", event => {
        if (event.key !== THEME_STORAGE_KEY && event.key !== null) {
            return;
        }

        savedTheme = getSavedTheme();
        applyTheme(savedTheme || getSystemTheme());
    });

    // Ohne eigene Auswahl auch spätere Systemwechsel übernehmen.
    if (systemThemeQuery) {
        const onSystemThemeChange = () => {
            if (savedTheme === null) {
                applyTheme(getSystemTheme());
            }
        };

        if (typeof systemThemeQuery.addEventListener === "function") {
            systemThemeQuery.addEventListener("change", onSystemThemeChange);
        } else if (typeof systemThemeQuery.addListener === "function") {
            systemThemeQuery.addListener(onSystemThemeChange);
        }
    }

    // Farbschema beim Öffnen anwenden.
    applyTheme(currentTheme);
})();