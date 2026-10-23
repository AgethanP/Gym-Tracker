
// ==========================================
// GYM TRACKER - STATISTIKEN
// ==========================================

// HTML-Elemente auswählen
const exerciseSelect = document.getElementById("exercise-select");
const chartContainer = document.getElementById("chart-container");
const chartTitle = document.getElementById("chart-title");
const chartDescription = document.getElementById("chart-description");
const statisticsStatus = document.getElementById("statistics-status");
const setSelection = document.getElementById("set-selection");
const setNumberSelect = document.getElementById("set-number");


// Aktuell ausgewählte Statistik
let activeStatistic = "max";

// ==========================================
// ÜBUNGEN DER AUSGEWÄHLTEN PERSON LADEN
// ==========================================

function loadStatisticsExercises() {

    // Bisherige Auswahl entfernen
    exerciseSelect.replaceChildren();

    // Standardoption hinzufügen
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Übung auswählen";

    exerciseSelect.appendChild(defaultOption);

    // Nur die Trainings der gewählten Person laden
    const workouts = getPersonWorkouts();

    // Übungsnamen ohne Duplikate sammeln
    const exerciseNames = new Set();

    for (const workout of workouts) {

        for (const exercise of workout.exercises) {

            const name = exercise.name.trim();

            if (name === "") {
                continue;
            }

            // Groß- und Kleinschreibung ignorieren
            const exists = [...exerciseNames].some(
                savedName =>
                    savedName.toLowerCase() === name.toLowerCase()
            );

            if (!exists) {
                exerciseNames.add(name);
            }
        }
    }

    // Alphabetisch sortieren
    const sortedNames = [...exerciseNames].sort(
        (a, b) => a.localeCompare(b, "de")
    );

    // Übungen in die Auswahlliste einfügen
    for (const name of sortedNames) {

        const option = document.createElement("option");

        option.value = name;
        option.textContent = name;

        exerciseSelect.appendChild(option);
    }
}


// ==========================================
// TRAININGSDATEN EINER PERSON LADEN
// ==========================================

function getPersonWorkouts() {

    // Aktuell ausgewählte Person auslesen
    const selectedPerson =
        document.getElementById("statistics-person").value;

    const workouts = loadWorkouts();
    const results = [];

    for (const workout of workouts) {

        if (Array.isArray(workout.participants)) {

            // Bei Gruppentrainings die ausgewählte Person suchen
            const person = workout.participants.find(
                participant => participant.name === selectedPerson
            );

            // Nur Trainings übernehmen, an denen sie teilgenommen hat
            if (person) {
                results.push({
                    date: workout.date,
                    exercises: person.exercises || []
                });
            }

        } else if (selectedPerson === "Ich") {

            // Alte Einzeltrainings gehören nur zu "Ich"
            results.push({
                date: workout.date,
                exercises: workout.exercises || []
            });
        }
    }

    return results;
}

// ==========================================
// FUNKTION: MAXIMALES GEWICHT BERECHNEN
// ==========================================

function getMaxWeightData(exerciseName) {

    // Nur Trainings der ausgewählten Person verwenden
    const workouts = getPersonWorkouts();

    // Hier sammeln wir unsere Diagrammdaten
    const results = [];

    // Trainings chronologisch sortieren
    const sortedWorkouts = [...workouts].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    for (const workout of sortedWorkouts) {

        // Passende Übungen im Training finden
        const matchingExercises = workout.exercises.filter(
            exercise =>
                exercise.name.trim().toLowerCase() ===
                exerciseName.trim().toLowerCase()
        );

        if (matchingExercises.length === 0) {
            continue;
        }

        // Gewichte aller passenden Sätze sammeln
        const weights = matchingExercises.flatMap(
            exercise => exercise.sets.map(set => set.weight)
        );

        if (weights.length === 0) {
            continue;
        }

        // Höchstes verwendetes Gewicht ermitteln
        const maxWeight = Math.max(...weights);

        results.push({
            date: workout.date,
            weight: maxWeight
        });
    }

    return results;
}


// ==========================================
// FUNKTION: GEWICHT EINES BESTIMMTEN SATZES
// ==========================================

function getSetWeightData(exerciseName, setNumber) {

    // Nur Trainings der ausgewählten Person verwenden
    const workouts = getPersonWorkouts();

    // Liste für unsere Ergebnisse
    const results = [];

    // Satznummer in Array-Index umwandeln
    // Satz 1 = Index 0, Satz 2 = Index 1
    const setIndex = setNumber - 1;

    // Trainings nach Datum sortieren
    const sortedWorkouts = [...workouts].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Alle Trainings durchgehen
    for (const workout of sortedWorkouts) {

        // Gesuchte Übung finden
        const exercise = workout.exercises.find(
            item =>
                item.name.trim().toLowerCase() ===
                exerciseName.trim().toLowerCase()
        );

        // Falls Übung nicht vorhanden, überspringen
        if (!exercise) {
            continue;
        }

        // Gewünschten Satz auswählen
        const set = exercise.sets[setIndex];

        // Falls dieser Satz nicht existiert, überspringen
        if (!set) {
            continue;
        }

        // Gewicht und Datum speichern
        results.push({
            date: workout.date,
            weight: set.weight
        });
    }

    return results;
}

// ==========================================
// FUNKTION: WIEDERHOLUNGEN EINES SATZES LADEN
// ==========================================

function getRepetitionData(exerciseName, setNumber) {

    // Nur Trainings der ausgewählten Person verwenden
    const workouts = getPersonWorkouts();

    // Liste für unsere Ergebnisse
    const results = [];

    // Satznummer in einen Array-Index umwandeln
    // Beispiel: Satz 2 = Index 1
    const setIndex = setNumber - 1;

    // Trainingseinheiten chronologisch sortieren
    const sortedWorkouts = [...workouts].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Jede Trainingseinheit durchgehen
    for (const workout of sortedWorkouts) {

        // Passende Übung suchen
        const exercise = workout.exercises.find(
            item =>
                item.name.trim().toLowerCase() ===
                exerciseName.trim().toLowerCase()
        );

        // Training überspringen, wenn die Übung fehlt
        if (!exercise) {
            continue;
        }

        // Gewünschten Satz auswählen
        const set = exercise.sets[setIndex];

        // Training überspringen, wenn dieser Satz fehlt
        if (!set) {
            continue;
        }

        // Datum, Wiederholungen und Gewicht merken
        results.push({
            date: workout.date,
            weight: set.reps,
            actualWeight: set.weight
        });
    }

    return results;
}

// ==========================================
// FUNKTION: TRAININGSVOLUMEN BERECHNEN
// ==========================================

function getVolumeData(exerciseName) {

    // Nur Trainings der ausgewählten Person verwenden
    const workouts = getPersonWorkouts();

    // Hier sammeln wir die Ergebnisse fürs Diagramm
    const results = [];

    // Trainings chronologisch sortieren
    const sortedWorkouts = [...workouts].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Jede Trainingseinheit einzeln auswerten
    for (const workout of sortedWorkouts) {

        // Alle Übungen mit dem gesuchten Namen finden
        const matchingExercises = workout.exercises.filter(
            exercise =>
                exercise.name.trim().toLowerCase() ===
                exerciseName.trim().toLowerCase()
        );

        // Training überspringen, wenn die Übung nicht vorkam
        if (matchingExercises.length === 0) {
            continue;
        }

        // Gesamtvolumen zunächst auf 0 setzen
        let totalVolume = 0;

        // Alle passenden Übungen und ihre Sätze durchgehen
        for (const exercise of matchingExercises) {

            for (const set of exercise.sets) {

                // Satzvolumen = Gewicht × Wiederholungen
                const setVolume = set.weight * set.reps;

                // Zum bisherigen Gesamtvolumen addieren
                totalVolume += setVolume;
            }
        }

        // Ergebnis für diese Trainingseinheit speichern
        results.push({
            date: workout.date,
            weight: Number(totalVolume.toFixed(2))
        });
    }

    return results;
}



function drawChart(data) {

    // Vorheriges Diagramm entfernen
    chartContainer.replaceChildren();

    if (data.length === 0) {
        statisticsStatus.textContent =
            "Keine Trainingsdaten vorhanden.";
        return;
    }

    statisticsStatus.textContent = "";

    // ==========================================
    // EINHEIT DER AKTUELLEN STATISTIK
    // ==========================================

    
    // Einheit passend zur ausgewählten Statistik festlegen
    const unit = activeStatistic === "reps"
        ? "Wdh."
        : "kg";


    // ==========================================
    // 1. GRÖSSE UND ABSTÄNDE
    // ==========================================

    const width = 650;
    const height = 350;

    // Platz für Achsenbeschriftungen reservieren
    const left = 65;
    const right = 30;
    const top = 35;
    const bottom = 65;

    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    const svgNS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Gewichtsentwicklung nach Datum");

    // Hilfsfunktion: SVG-Element mit Attributen erstellen
    function createSVGElement(tag, attributes) {

        const element = document.createElementNS(svgNS, tag);

        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }

        return element;
    }

    // ==========================================
    // 2. WERTEBEREICH BERECHNEN
    // ==========================================

    const values = data.map(item => item.weight);

    const minWeight = Math.min(...values);
    const maxWeight = Math.max(...values);

    // Etwas Abstand oberhalb und unterhalb der Werte
    const lowerBound = Math.max(0, minWeight - 5);
    const upperBound = maxWeight + 5;
    const range = upperBound - lowerBound;

    // Gewicht in eine Y-Koordinate umrechnen
    function getY(weight) {
        return top + (upperBound - weight) / range * plotHeight;
    }

    // ==========================================
    // 3. Y-ACHSE MIT GEWICHTEN ZEICHNEN
    // ==========================================

    // Fünf Beschriftungen in gleichen Abständen
    for (let i = 0; i <= 4; i++) {

        const weight = lowerBound + (range / 4) * i;
        const y = getY(weight);

        // Horizontale Hilfslinie
        const gridLine = createSVGElement("line", {
            x1: left,
            y1: y,
            x2: width - right,
            y2: y,
            stroke: "#e5e7eb",
            "stroke-width": 1
        });

        svg.appendChild(gridLine);

        // Gewichtsbeschriftung
        const label = createSVGElement("text", {
            x: left - 12,
            y: y + 4,
            "text-anchor": "end",
            "font-size": 12,
            fill: "#555"
        });

        // Wiederholungen als ganze Zahlen darstellen
        label.textContent = activeStatistic === "reps"
            ? `${Math.round(weight)} Wdh.`
            : `${Number(weight.toFixed(1)).toLocaleString("de-DE")} kg`;


        svg.appendChild(label);
    }

    // ==========================================
    // 4. MESSPUNKTE BERECHNEN
    // ==========================================

    const points = data.map(function(item, index) {

        const x = data.length === 1
            ? left + plotWidth / 2
            : left + index * plotWidth / (data.length - 1);
        return {
            x: x,
            y: getY(item.weight),
            date: item.date,
            weight: item.weight,

            // Tatsächliches Trainingsgewicht,
            // falls die Statistik Wiederholungen zeigt
            actualWeight: item.actualWeight
        };
    });

    // ==========================================
    // 5. VERBINDUNGSLINIE ZEICHNEN
    // ==========================================

    const line = createSVGElement("polyline", {
        points: points.map(p => `${p.x},${p.y}`).join(" "),
        fill: "none",
        stroke: "#2563eb",
        "stroke-width": 3,
        "stroke-linejoin": "round"
    });

    svg.appendChild(line);

    // ==========================================
    // 6. MESSPUNKTE UND BESCHRIFTUNGEN
    // ==========================================

    // Bei vielen Trainings nur ausgewählte Datumsangaben anzeigen
    const labelStep = Math.max(1, Math.ceil(data.length / 6));

    points.forEach(function(point, index) {

        // Blauer Messpunkt
        const circle = createSVGElement("circle", {
            cx: point.x,
            cy: point.y,
            r: 5,
            fill: "#2563eb"
        });

        // Tooltip bei Mausberührung
        const tooltip = createSVGElement("title", {});

        const dateText = new Date(point.date)
            .toLocaleDateString("de-DE");

        
        // Tooltip abhängig vom Statistik-Reiter anzeigen
        if (activeStatistic === "reps") {

            tooltip.textContent =
                `${dateText}: ${point.weight} Wiederholungen ` +
                `bei ${point.actualWeight} kg`;

        } else if (activeStatistic === "volume") {

            tooltip.textContent =
                `${dateText}: ${point.weight} kg Trainingsvolumen`;

        } else {

            tooltip.textContent =
                `${dateText}: ${point.weight} kg`;
        }


        circle.appendChild(tooltip);
        svg.appendChild(circle);

        // Gewicht direkt über dem Messpunkt anzeigen
        const weightLabel = createSVGElement("text", {
            x: point.x,
            y: point.y - 12,
            "text-anchor": "middle",
            "font-size": 12,
            "font-weight": "bold",
            fill: "#1d4ed8"
        });

        // Wert mit der passenden Einheit anzeigen
        weightLabel.textContent = `${point.weight} ${unit}`;

        svg.appendChild(weightLabel);

        // Datum unter dem Diagramm anzeigen
        if (
            index % labelStep === 0 ||
            index === points.length - 1
        ) {

            const dateLabel = createSVGElement("text", {
                x: point.x,
                y: height - bottom + 25,
                "text-anchor": "middle",
                "font-size": 11,
                fill: "#555"
            });

            dateLabel.textContent = new Date(point.date)
                .toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit"
                });

            svg.appendChild(dateLabel);
        }
    });

    // ==========================================
    // 7. FERTIGES DIAGRAMM ANZEIGEN
    // ==========================================

    chartContainer.appendChild(svg);
}


// ==========================================
// FUNKTION: VERFÜGBARE SATZNUMMERN ANZEIGEN
// ==========================================

function updateSetSelection(exerciseName) {

    // Bisherige Auswahl merken
    const previousValue = setNumberSelect.value;

    // Alte Optionen entfernen
    setNumberSelect.replaceChildren();

    // Höchste Satzanzahl dieser Übung ermitteln
    let maxSets = 0;

    // Nur Trainings der ausgewählten Person verwenden
    const workouts = getPersonWorkouts();

    for (const workout of workouts) {

        for (const exercise of workout.exercises) {

            if (
                exercise.name.trim().toLowerCase() ===
                exerciseName.trim().toLowerCase()
            ) {
                maxSets = Math.max(maxSets, exercise.sets.length);
            }
        }
    }

    // Für jede Satznummer eine Auswahl erstellen
    for (let i = 1; i <= maxSets; i++) {

        const option = document.createElement("option");

        option.value = i;
        option.textContent = `Satz ${i}`;

        setNumberSelect.appendChild(option);
    }

    // Bisherige Auswahl beibehalten, wenn möglich
    if (
        [...setNumberSelect.options].some(
            option => option.value === previousValue
        )
    ) {
        setNumberSelect.value = previousValue;
    }
}

// ==========================================
// FUNKTION: STATISTIK AKTUALISIEREN
// ==========================================

function updateStatistics() {

    const exerciseName = exerciseSelect.value;

    // Bisheriges Diagramm und Meldungen entfernen
    chartContainer.replaceChildren();
    statisticsStatus.textContent = "";

    setSelection.hidden =
    activeStatistic !== "set" && activeStatistic !== "reps";

    // Ohne Übung keine Auswertung möglich
    if (!exerciseName) {
        statisticsStatus.textContent =
            "Bitte wähle zuerst eine Übung aus.";
        return;
    }

    try {

        let data = [];

        // ======================================
        // REITER: MAXIMALES GEWICHT
        // ======================================

        if (activeStatistic === "max") {

            chartTitle.textContent = "Maximales Gewicht";

            chartDescription.textContent =
                "Pro Trainingseinheit wird das höchste verwendete " +
                "Gewicht angezeigt – unabhängig von der Wiederholungszahl.";

            data = getMaxWeightData(exerciseName);
        }

        // ======================================
        // REITER: SATZGEWICHT
        // ======================================

        else if (activeStatistic === "set") {

            // Verfügbare Sätze der ausgewählten Übung laden
            updateSetSelection(exerciseName);

            const setNumber = Number(setNumberSelect.value);

            chartTitle.textContent =
                `Gewichtsentwicklung – Satz ${setNumber}`;

            chartDescription.textContent =
                `Vergleich des Gewichts von Satz ${setNumber} ` +
                "über mehrere Trainingseinheiten.";

            data = getSetWeightData(exerciseName, setNumber);
        }

                
        // ======================================
        // REITER: WIEDERHOLUNGEN
        // ======================================

        else if (activeStatistic === "reps") {

            // Verfügbare Sätze der gewählten Übung laden
            updateSetSelection(exerciseName);

            // Ausgewählte Satznummer auslesen
            const setNumber = Number(setNumberSelect.value);

            // Diagrammüberschrift festlegen
            chartTitle.textContent =
                `Wiederholungsentwicklung – Satz ${setNumber}`;

            // Erklärung für die Auswertung
            chartDescription.textContent =
                `Angezeigt werden die Wiederholungen von Satz ${setNumber} ` +
                "über mehrere Trainingseinheiten. " +
                "Das verwendete Gewicht kann dabei unterschiedlich sein.";

            // Daten für das Diagramm berechnen
            data = getRepetitionData(exerciseName, setNumber);
        }
                
        // ======================================
        // REITER: TRAININGSVOLUMEN
        // ======================================

        else if (activeStatistic === "volume") {

            // Überschrift des Diagramms
            chartTitle.textContent = "Trainingsvolumen";

            // Erklärung der Kennzahl
            chartDescription.textContent =
                "Pro Trainingseinheit wird die Summe aus Gewicht × " +
                "Wiederholungen über alle Sätze der ausgewählten " +
                "Übung angezeigt.";

            // Trainingsvolumen berechnen
            data = getVolumeData(exerciseName);
        }


        // ======================================
        // WEITERE REITER
        // ======================================

        else {

            chartTitle.textContent = "Weitere Statistik";
            chartDescription.textContent = "";

            statisticsStatus.textContent =
                "Diese Auswertung ergänzen wir im nächsten Schritt.";

            return;
        }

        // Vorhandene Diagrammfunktion wiederverwenden
        drawChart(data);

    } catch (error) {

        console.error("Statistikfehler:", error);

        statisticsStatus.textContent =
            "Statistik konnte nicht berechnet werden.";
    }
}

// ==========================================
// EVENTS: ÜBUNG UND REITER WECHSELN
// ==========================================

// Bei einer anderen Übung die Statistik neu berechnen
exerciseSelect.addEventListener("change", updateStatistics);

// Alle Statistik-Reiter finden
const tabs = document.querySelectorAll(".stat-tab");

tabs.forEach(function(tab) {

    tab.addEventListener("click", function() {

        // Ausgewählte Statistik merken
        activeStatistic = tab.dataset.stat;

        // Aktive Hervorhebung aktualisieren
        tabs.forEach(item => {
            item.classList.remove("active");
        });

        tab.classList.add("active");

        // Diagramm neu laden
        updateStatistics();
    });
});


// ==========================================
// STATISTIKSEITE INITIALISIEREN
// ==========================================

loadStatisticsExercises();

// Beim Öffnen zunächst einen Hinweis anzeigen
updateStatistics();

// ==========================================
// EVENT: ANDEREN SATZ AUSWÄHLEN
// ==========================================

// Diagramm bei einer neuen Satznummer aktualisieren
setNumberSelect.addEventListener("change", updateStatistics);

// ==========================================
// SCHRITT 18.6.1 – PERSONENAUSWAHL
// ==========================================

// Auswahlfeld für die Trainingsperson
const statisticsPersonSelect =
    document.getElementById("statistics-person");


// Alle bisher gespeicherten Personen laden
function loadStatisticsPersons() {

    // Alte Auswahl entfernen
    statisticsPersonSelect.replaceChildren();

    // "Ich" ist immer verfügbar
    const persons = new Set(["Ich"]);

    let workouts;

    try {
        workouts = loadWorkouts();
    } catch (error) {
        console.error("Personen konnten nicht geladen werden:", error);
        statisticsStatus.textContent =
            "Personen konnten nicht geladen werden.";
        return;
    }

    // Alle gemeinsamen Trainings durchsuchen
    for (const workout of workouts) {

        if (!Array.isArray(workout.participants)) {
            continue;
        }

        // Namen aus gemeinsamen Trainings übernehmen
        for (const participant of workout.participants) {

            if (typeof participant.name === "string" &&
                participant.name.trim() !== "") {

                persons.add(participant.name.trim());
            }
        }
    }

    // Auswahlmöglichkeiten erstellen
    for (const person of persons) {

        const option = document.createElement("option");

        option.value = person;
        option.textContent = person;

        statisticsPersonSelect.appendChild(option);
    }
}


// Beim Öffnen alle Personen anzeigen
loadStatisticsPersons();

// ==========================================
// BEIM PERSONENWECHSEL ÜBUNGEN AKTUALISIEREN
// ==========================================

statisticsPersonSelect.addEventListener("change", function() {

    // Übungsliste für die neue Person laden
    loadStatisticsExercises();

    // Altes Diagramm entfernen und Hinweis anzeigen
    updateStatistics();
});

