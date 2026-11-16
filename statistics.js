// ==========================================
// GYM TRACKER – TRAININGSSTATISTIKEN
// ==========================================

// Vorhandene HTML-Elemente verwenden.
const statisticsPersonSelect = document.getElementById("statistics-person");
const exerciseSelect = document.getElementById("exercise-select");
const chartContainer = document.getElementById("chart-container");
const chartTitle = document.getElementById("chart-title");
const chartDescription = document.getElementById("chart-description");
const statisticsStatus = document.getElementById("statistics-status");
const setSelection = document.getElementById("set-selection");
const setNumberSelect = document.getElementById("set-number");
const statTabs = document.querySelectorAll(".stat-tab");

let activeStatistic = "max";
const SVG_NS = "http://www.w3.org/2000/svg";

// ==========================================
// HILFSFUNKTIONEN
// ==========================================

function normalizeStatisticsName(name) {
    return typeof name === "string" ? name.trim().toLocaleLowerCase("de-DE") : "";
}

function formatStatisticsValue(value) {
    return Number(value).toLocaleString("de-DE", {
        maximumFractionDigits: 2
    });
}

function formatStatisticsDate(date) {
    return new Date(date).toLocaleDateString("de-DE");
}

function isValidStatisticsSet(set) {
    return set && Number.isFinite(set.weight) && set.weight >= 0 &&
        Number.isInteger(set.reps) && set.reps >= 1;
}

function createSVGElement(tag, attributes = {}, text = null) {
    const element = document.createElementNS(SVG_NS, tag);

    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, String(value));
    }

    if (text !== null) {
        element.textContent = String(text);
    }

    return element;
}

// ==========================================
// PERSONEN EINMAL BEIM START LADEN
// ==========================================

function loadStatisticsPersons() {
    const previousPerson = statisticsPersonSelect.value;
    const names = new Map([["ich", "Ich"]]);

    for (const workout of loadWorkouts()) {
        if (!Array.isArray(workout?.participants)) {
            continue;
        }

        for (const person of workout.participants) {
            const name = typeof person?.name === "string" ? person.name.trim() : "";
            const key = normalizeStatisticsName(name);

            if (key && !names.has(key)) {
                names.set(key, name);
            }
        }
    }

    statisticsPersonSelect.replaceChildren();

    for (const name of names.values()) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        statisticsPersonSelect.appendChild(option);
    }

    const oldKey = normalizeStatisticsName(previousPerson);
    const oldName = names.get(oldKey);
    statisticsPersonSelect.value = oldName || "Ich";
}

// ==========================================
// TRAININGSVERLAUF DER GEWÄHLTEN PERSON
// ==========================================

function getPersonWorkouts() {
    const selectedPerson = normalizeStatisticsName(statisticsPersonSelect.value);
    const results = [];

    for (const workout of loadWorkouts()) {
        if (!workout || !Number.isFinite(Date.parse(workout.date))) {
            continue;
        }

        let personExercises = null;

        if (Array.isArray(workout.participants)) {
            const person = workout.participants.find(item =>
                normalizeStatisticsName(item?.name) === selectedPerson
            );

            if (person) {
                personExercises = person.exercises;
            }
        } else if (selectedPerson === "ich") {
            // Ältere Einzeltrainings gehören immer zu "Ich".
            personExercises = workout.exercises;
        }

        if (Array.isArray(personExercises)) {
            results.push({
                date: workout.date,
                exercises: personExercises
            });
        }
    }

    return results.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// ==========================================
// ÜBUNGEN DER GEWÄHLTEN PERSON ANZEIGEN
// ==========================================

function loadStatisticsExercises() {
    const previousExercise = normalizeStatisticsName(exerciseSelect.value);
    const names = new Map();

    for (const workout of getPersonWorkouts()) {
        for (const exercise of workout.exercises) {
            const name = typeof exercise?.name === "string" ? exercise.name.trim() : "";
            const key = normalizeStatisticsName(name);

            if (key && !names.has(key)) {
                names.set(key, name);
            }
        }
    }

    exerciseSelect.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Übung auswählen";
    exerciseSelect.appendChild(placeholder);

    const sortedNames = [...names.values()].sort((a, b) =>
        a.localeCompare(b, "de-DE")
    );

    for (const name of sortedNames) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        exerciseSelect.appendChild(option);
    }

    // Eine Übung nur beibehalten, wenn die neue Person sie auch trainiert hat.
    exerciseSelect.value = names.get(previousExercise) || "";
}

// ==========================================
// VERFÜGBARE SATZNUMMERN ANZEIGEN
// ==========================================

function updateSetSelection(exerciseName, workouts) {
    const previousValue = setNumberSelect.value;
    const key = normalizeStatisticsName(exerciseName);
    let maxSets = 0;

    for (const workout of workouts) {
        for (const exercise of workout.exercises) {
            if (normalizeStatisticsName(exercise?.name) === key &&
                Array.isArray(exercise.sets)) {
                maxSets = Math.max(maxSets, exercise.sets.length);
            }
        }
    }

    setNumberSelect.replaceChildren();

    for (let number = 1; number <= maxSets; number++) {
        const option = document.createElement("option");
        option.value = String(number);
        option.textContent = `Satz ${number}`;
        setNumberSelect.appendChild(option);
    }

    if ([...setNumberSelect.options].some(option => option.value === previousValue)) {
        setNumberSelect.value = previousValue;
    }

    return maxSets;
}

// ==========================================
// VIER STATISTIKARTEN BERECHNEN
// ==========================================

function calculateStatisticsData(workouts, exerciseName, statistic, setNumber) {
    const key = normalizeStatisticsName(exerciseName);
    const results = [];
    const setIndex = setNumber - 1;

    for (const workout of workouts) {
        const matchingExercises = workout.exercises.filter(exercise =>
            normalizeStatisticsName(exercise?.name) === key &&
            Array.isArray(exercise.sets)
        );

        if (matchingExercises.length === 0) {
            continue;
        }

        let value;
        let actualWeight;

        if (statistic === "max") {
            const weights = matchingExercises.flatMap(exercise =>
                exercise.sets.filter(isValidStatisticsSet).map(set => set.weight)
            );

            if (weights.length === 0) {
                continue;
            }
            value = Math.max(...weights);

        } else if (statistic === "volume") {
            const sets = matchingExercises.flatMap(exercise =>
                exercise.sets.filter(isValidStatisticsSet)
            );

            if (sets.length === 0) {
                continue;
            }
            value = Number(sets.reduce((sum, set) =>
                sum + set.weight * set.reps, 0
            ).toFixed(2));

        } else if (statistic === "set" || statistic === "reps") {
            // Dieselbe Satzposition aus den verschiedenen Trainings vergleichen.
            const exercise = matchingExercises.find(item =>
                isValidStatisticsSet(item.sets[setIndex])
            );

            if (!exercise) {
                continue;
            }

            const set = exercise.sets[setIndex];
            value = statistic === "reps" ? set.reps : set.weight;
            actualWeight = set.weight;

        } else {
            continue;
        }

        results.push({ date: workout.date, value, actualWeight });
    }

    return results;
}

// ==========================================
// DIAGRAMM ZEICHNEN
// ==========================================

function drawChart(data) {
    chartContainer.replaceChildren();

    if (data.length === 0) {
        statisticsStatus.textContent = "Keine Trainingsdaten für diese Auswertung vorhanden.";
        return;
    }

    // Der vorhandene CSS-Code enthält noch einen alten weißen Hintergrund.
    // Farbvariablen sorgen schon jetzt für eine lesbare Dark-Mode-Darstellung.
    chartContainer.style.backgroundColor = "var(--color-surface)";
    chartContainer.style.borderColor = "var(--color-border)";

    const unit = activeStatistic === "reps" ? "Wdh." : "kg";
    const width = Math.max(650, 130 + data.length * 75);
    const height = 350;
    const left = 72;
    const right = 34;
    const top = 40;
    const bottom = 65;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    const values = data.map(item => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    let lowerBound;
    let upperBound;

    if (activeStatistic === "reps") {
        // Mindestens vier Einheiten Höhe für unterscheidbare ganzzahlige Achsen.
        lowerBound = Math.max(0, Math.floor(minValue - 1));
        upperBound = Math.max(Math.ceil(maxValue + 1), lowerBound + 4);
    } else {
        const padding = Math.max(2, (maxValue - minValue) * 0.15);
        lowerBound = Math.max(0, minValue - padding);
        upperBound = maxValue + padding;
    }

    const range = upperBound - lowerBound;
    const getY = value => top + (upperBound - value) / range * plotHeight;

    const svg = createSVGElement("svg", {
        viewBox: `0 0 ${width} ${height}`,
        role: "img",
        "aria-label": `${chartTitle.textContent}: ${data.length} Messwerte im zeitlichen Verlauf`
    });

    // Auf kleinen Displays bleibt die Schrift lesbar: horizontal scrollen.
    svg.style.display = "block";
    svg.style.width = "100%";
    svg.style.minWidth = `${width}px`;
    svg.style.height = "auto";

    svg.appendChild(createSVGElement("title", {}, chartTitle.textContent));
    svg.appendChild(createSVGElement("desc", {}, chartDescription.textContent));

    // Horizontale Hilfslinien und Y-Achse.
    for (let i = 0; i <= 4; i++) {
        const value = lowerBound + (range / 4) * i;
        const y = getY(value);

        svg.appendChild(createSVGElement("line", {
            x1: left, y1: y, x2: width - right, y2: y,
            stroke: "var(--color-border)", "stroke-width": 1
        }));

        const tick = activeStatistic === "reps"
            ? String(Math.round(value))
            : formatStatisticsValue(value);

        svg.appendChild(createSVGElement("text", {
            x: left - 12, y: y + 4,
            "text-anchor": "end", "font-size": 12,
            fill: "var(--color-text-secondary)"
        }, `${tick} ${unit}`));
    }

    // Messpunkte chronologisch auf der X-Achse verteilen.
    const points = data.map((item, index) => ({
        ...item,
        x: data.length === 1
            ? left + plotWidth / 2
            : left + index * plotWidth / (data.length - 1),
        y: getY(item.value)
    }));

    svg.appendChild(createSVGElement("polyline", {
        points: points.map(point => `${point.x},${point.y}`).join(" "),
        fill: "none", stroke: "var(--color-primary)",
        "stroke-width": 3, "stroke-linecap": "round",
        "stroke-linejoin": "round"
    }));

    const dateLabelStep = Math.max(1, Math.ceil(data.length / 7));
    const valueLabelStep = Math.max(1, Math.ceil(data.length / 10));

    points.forEach((point, index) => {
        const dateText = formatStatisticsDate(point.date);
        let detail = `${dateText}: ${formatStatisticsValue(point.value)} ${unit}`;

        if (activeStatistic === "reps") {
            detail += ` bei ${formatStatisticsValue(point.actualWeight)} kg`;
        }

        const circle = createSVGElement("circle", {
            cx: point.x, cy: point.y, r: 5,
            fill: "var(--color-primary)", tabindex: 0,
            "aria-label": detail
        });
        circle.appendChild(createSVGElement("title", {}, detail));
        svg.appendChild(circle);

        // Nicht alle Werte gleichzeitig beschriften, wenn es sehr viele gibt.
        if (index % valueLabelStep === 0 || index === points.length - 1) {
            svg.appendChild(createSVGElement("text", {
                x: point.x, y: point.y - 13,
                "text-anchor": "middle", "font-size": 12,
                "font-weight": "bold", fill: "var(--color-primary)"
            }, `${formatStatisticsValue(point.value)} ${unit}`));
        }

        if (index % dateLabelStep === 0 || index === points.length - 1) {
            svg.appendChild(createSVGElement("text", {
                x: point.x, y: height - bottom + 27,
                "text-anchor": "middle", "font-size": 11,
                fill: "var(--color-text-secondary)"
            }, new Date(point.date).toLocaleDateString("de-DE", {
                day: "2-digit", month: "2-digit"
            })));
        }
    });

    chartContainer.appendChild(svg);

    // Werte zusätzlich als Liste: hilfreich auf iPhone und für Screenreader.
    const details = document.createElement("details");
    details.style.marginTop = "16px";
    details.style.color = "var(--color-text)";

    const summary = document.createElement("summary");
    summary.textContent = `Alle Messwerte anzeigen (${data.length})`;
    summary.style.cursor = "pointer";
    details.appendChild(summary);

    const list = document.createElement("ul");
    list.style.paddingLeft = "20px";

    for (const item of data) {
        const entry = document.createElement("li");
        entry.textContent = `${formatStatisticsDate(item.date)}: ` +
            `${formatStatisticsValue(item.value)} ${unit}` +
            (activeStatistic === "reps"
                ? ` bei ${formatStatisticsValue(item.actualWeight)} kg`
                : "");
        list.appendChild(entry);
    }

    details.appendChild(list);
    chartContainer.appendChild(details);
}

// ==========================================
// STATISTIK AKTUALISIEREN
// ==========================================

function updateStatistics() {
    chartContainer.replaceChildren();
    statisticsStatus.textContent = "";

    const exerciseName = exerciseSelect.value;
    const needsSet = activeStatistic === "set" || activeStatistic === "reps";
    setSelection.hidden = !needsSet;

    // Beschreibung passend zum ausgewählten Reiter setzen.
    const descriptions = {
        max: ["Maximales Gewicht",
            "Das höchste verwendete Gewicht pro Trainingseinheit – unabhängig von der Wiederholungszahl."],
        set: ["Satzgewicht",
            "Vergleich des Gewichts derselben Satzposition über mehrere Trainingseinheiten."],
        reps: ["Wiederholungen",
            "Wiederholungen derselben Satzposition. Das verwendete Gewicht kann unterschiedlich sein."],
        volume: ["Trainingsvolumen",
            "Summe aus Gewicht × Wiederholungen über alle Sätze der ausgewählten Übung pro Trainingseinheit."]
    };

    const description = descriptions[activeStatistic] || descriptions.max;
    chartTitle.textContent = description[0];
    chartDescription.textContent = description[1];

    if (!exerciseName) {
        statisticsStatus.textContent = "Bitte wähle zuerst eine Übung aus.";
        return;
    }

    try {
        const workouts = getPersonWorkouts();
        let setNumber = 1;

        if (needsSet) {
            const availableSets = updateSetSelection(exerciseName, workouts);

            if (availableSets === 0) {
                statisticsStatus.textContent = "Für diese Übung wurden keine Sätze gefunden.";
                return;
            }

            setNumber = Number(setNumberSelect.value);
            chartTitle.textContent = activeStatistic === "set"
                ? `Gewichtsentwicklung – Satz ${setNumber}`
                : `Wiederholungsentwicklung – Satz ${setNumber}`;
        }

        const data = calculateStatisticsData(
            workouts, exerciseName, activeStatistic, setNumber
        );

        drawChart(data);
    } catch (error) {
        console.error("Statistikfehler:", error);
        statisticsStatus.textContent = "Statistik konnte nicht geladen werden.";
    }
}

// ==========================================
// EVENTS UND INITIALISIERUNG
// ==========================================

statisticsPersonSelect.addEventListener("change", function() {
    // Wichtig: Personenauswahl NICHT erneut aufbauen.
    try {
        loadStatisticsExercises();
        updateStatistics();
    } catch (error) {
        console.error("Personenwechsel fehlgeschlagen:", error);
        chartContainer.replaceChildren();
        statisticsStatus.textContent = "Trainingsdaten konnten nicht geladen werden.";
    }
});

exerciseSelect.addEventListener("change", updateStatistics);
setNumberSelect.addEventListener("change", updateStatistics);

statTabs.forEach(tab => {
    tab.addEventListener("click", function() {
        activeStatistic = tab.dataset.stat;

        statTabs.forEach(item => {
            const active = item === tab;
            item.classList.toggle("active", active);
            item.setAttribute("aria-pressed", String(active));
        });

        updateStatistics();
    });
});

try {
    loadStatisticsPersons();
    loadStatisticsExercises();

    statTabs.forEach(tab => {
        tab.setAttribute("aria-pressed", String(tab.dataset.stat === activeStatistic));
    });

    updateStatistics();
} catch (error) {
    console.error("Statistik konnte nicht initialisiert werden:", error);
    statisticsStatus.textContent = "Trainingsdaten konnten nicht geladen werden.";
}