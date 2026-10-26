
// ==========================================
// GYM TRACKER – TRAININGSKALENDER
// ==========================================

// HTML-Elemente auswählen
const calendarMonth = document.getElementById("calendar-month");
const calendarDays = document.getElementById("calendar-days");

const previousMonthButton =
    document.getElementById("previous-month");

const nextMonthButton =
    document.getElementById("next-month");

// Heutiges Datum merken
const today = new Date();

// Monat, der gerade angezeigt wird
let displayedYear = today.getFullYear();
let displayedMonth = today.getMonth();


// ==========================================
// TRAININGSDETAILS EINES TAGES ANZEIGEN
// ==========================================

function showCalendarWorkout(day) {

    const details = document.getElementById("calendar-details");
    const title = document.getElementById("calendar-details-title");
    const container = document.getElementById("calendar-workouts");

    // Ausgewählten Kalendertag erstellen
    const selectedDate = new Date(
        displayedYear,
        displayedMonth,
        day
    );

    // Überschrift mit deutschem Datum
    title.textContent = selectedDate.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

    // Alte Trainingsdetails entfernen
    container.replaceChildren();

    let workouts = [];

    try {
        workouts = loadWorkouts();
    } catch (error) {
        console.error("Fehler beim Laden der Trainings:", error);
        container.textContent = "Trainingsdaten konnten nicht geladen werden.";
        details.hidden = false;
        return;
    }

    // Trainings des ausgewählten Tages finden
    const selectedWorkouts = workouts.filter(function(workout) {

        const date = new Date(workout.date);

        return (
            !Number.isNaN(date.getTime()) &&
            date.getFullYear() === displayedYear &&
            date.getMonth() === displayedMonth &&
            date.getDate() === day
        );
    });

    // Falls kein Training vorhanden ist
    if (selectedWorkouts.length === 0) {
        container.textContent = "An diesem Tag wurde kein Training gespeichert.";
        details.hidden = false;
        return;
    }

    // Alle Trainings dieses Tages anzeigen
    for (const workout of selectedWorkouts) {

        const workoutElement = document.createElement("article");
        workoutElement.className = "calendar-workout";

        // Altes Einzeltraining oder neues Gruppentraining
        const participants = Array.isArray(workout.participants)
            ? workout.participants
            : [{ name: "Ich", exercises: workout.exercises || [] }];

        for (const person of participants) {

            const personHeading = document.createElement("h4");
            personHeading.textContent = person.name;
            workoutElement.appendChild(personHeading);

            // Übungen dieser Person anzeigen
            for (const exercise of (person.exercises || [])) {

                const exerciseHeading = document.createElement("p");
                exerciseHeading.className = "calendar-exercise-name";
                exerciseHeading.textContent = exercise.name;
                workoutElement.appendChild(exerciseHeading);

                // Gewichte und Wiederholungen anzeigen
                exercise.sets.forEach(function(set, index) {

                    const setInfo = document.createElement("p");

                    setInfo.textContent =
                        `Satz ${index + 1}: ${set.weight} kg × ${set.reps} Wiederholungen`;

                    workoutElement.appendChild(setInfo);
                });
            }
        }

        container.appendChild(workoutElement);
    }

    // Detailbereich sichtbar machen
    details.hidden = false;
}

// ==========================================
// FUNKTION: KALENDER ANZEIGEN
// ==========================================

function displayCalendar() {

    // Angezeigten Monat bestimmen
    const currentMonth = new Date(
        displayedYear,
        displayedMonth,
        1
    );

    // Monatsüberschrift erstellen
    calendarMonth.textContent =
        currentMonth.toLocaleDateString("de-DE", {
            month: "long",
            year: "numeric"
        });

    // Bisherigen Kalender leeren
    calendarDays.replaceChildren();
    // Beim Monatswechsel alte Trainingsdetails ausblenden
    document.getElementById("calendar-details").hidden = true;
    // Anzahl der Tage im Monat
    const daysInMonth = new Date(
        displayedYear,
        displayedMonth + 1,
        0
    ).getDate();

    // Wochentag des Monatsersten ermitteln
    // JavaScript: Sonntag = 0, Montag = 1
    const firstWeekday = currentMonth.getDay();

    // Umrechnen: Montag = 0, Sonntag = 6
    const emptyDays = (firstWeekday + 6) % 7;

    // Leere Felder vor dem 1. Tag hinzufügen
    for (let i = 0; i < emptyDays; i++) {

        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-empty";

        calendarDays.appendChild(emptyCell);
    }

    // ==========================================
    // GESPEICHERTE TRAININGSTAGE ERMITTELN
    // ==========================================

    // Trainingsdaten aus dem localStorage laden
    let workouts = [];

    try {
        workouts = loadWorkouts();
    } catch (error) {
        console.error("Trainingsdaten konnten nicht geladen werden:", error);
    }

    // Hier merken wir uns die Tage, an denen trainiert wurde
    const workoutDays = new Set();

    // Jedes gespeicherte Training überprüfen
    for (const workout of workouts) {

        const workoutDate = new Date(workout.date);

        // Ungültige Datumswerte überspringen
        if (Number.isNaN(workoutDate.getTime())) {
            continue;
        }

        // Nur Trainings aus dem angezeigten Monat berücksichtigen
        if (
            workoutDate.getFullYear() === displayedYear &&
            workoutDate.getMonth() === displayedMonth
        ) {
            workoutDays.add(workoutDate.getDate());
        }
    }

    // Alle Tage des Monats erstellen
    for (let day = 1; day <= daysInMonth; day++) {

        // Jeder Kalendertag wird ein anklickbarer Button
        const dayElement = document.createElement("button");

        dayElement.type = "button";
        dayElement.className = "calendar-day";
        dayElement.textContent = day;
        dayElement.addEventListener("click", function() {

            // Bisherige Markierung entfernen
            document.querySelectorAll(".calendar-day.selected")
                .forEach(function(element) {
                    element.classList.remove("selected");
                });

            // Angeklickten Tag markieren
            dayElement.classList.add("selected");

            // Trainingsdetails anzeigen
            showCalendarWorkout(day);
        });
        // Nur das tatsächliche heutige Datum hervorheben
        const isToday =
            day === today.getDate() &&
            displayedMonth === today.getMonth() &&
            displayedYear === today.getFullYear();

        if (isToday) {
            dayElement.classList.add("today");
        }
        // Falls an diesem Tag trainiert wurde,
        // einen kleinen grünen Punkt hinzufügen
        if (workoutDays.has(day)) {

            const marker = document.createElement("span");

            marker.className = "workout-marker";

            // Punkt für Screenreader beschreiben
            marker.setAttribute("aria-label", "Training absolviert");

            dayElement.appendChild(marker);
        }

        calendarDays.appendChild(dayElement);
    }
}


// ==========================================
// MONAT WECHSELN
// ==========================================

// Einen Monat zurück
previousMonthButton.addEventListener("click", function() {

    displayedMonth--;

    if (displayedMonth < 0) {
        displayedMonth = 11;
        displayedYear--;
    }

    displayCalendar();
});

// Einen Monat weiter
nextMonthButton.addEventListener("click", function() {

    displayedMonth++;

    if (displayedMonth > 11) {
        displayedMonth = 0;
        displayedYear++;
    }

    displayCalendar();
});


// Kalender beim Start anzeigen
displayCalendar();
