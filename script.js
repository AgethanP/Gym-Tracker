
// ==========================================
// GYM TRACKER - JAVASCRIPT
// ==========================================

// Container für unsere Übungen
const exercises = document.getElementById("exercises");

// Zähler für die Anzahl der Übungen
let exerciseCount = 0;


// ==========================================
// FUNKTION: NEUEN SATZ ERSTELLEN
// ==========================================

function createSet(exerciseNumber, setNumber) {

    // Neuen HTML-Bereich für einen Satz erstellen
    const set = document.createElement("div");
    set.className = "set";

    // Eingabefelder für Gewicht und Wiederholungen
    set.innerHTML = `
        <!-- Überschrift und Entfernen-Button für einen Satz -->
        <h4>Satz ${setNumber}</h4>

        <button type="button" class="remove-set">
            Satz entfernen
        </button>

        <label for="weight-${exerciseNumber}-${setNumber}">
            Gewicht (kg):
        </label>
        <input type="number"
               id="weight-${exerciseNumber}-${setNumber}"
               min="0" step="0.5">

        <label for="reps-${exerciseNumber}-${setNumber}">
            Wiederholungen:
        </label>
        <input type="number"
               id="reps-${exerciseNumber}-${setNumber}"
               min="1" step="1">
    `;

    // Fertigen Satz zurückgeben
    return set;
}


// ==========================================
// FUNKTION: NEUE ÜBUNG HINZUFÜGEN
// ==========================================

function addExercise() {

    // Anzahl der Übungen erhöhen
    exerciseCount++;

    // Neuen HTML-Bereich für die Übung erstellen
    const exercise = document.createElement("fieldset");
    exercise.className = "exercise";

    // Übungsnummer speichern
    exercise.dataset.number = exerciseCount;

    // Inhalt der neuen Übung
    exercise.innerHTML = `
        <legend>Übung ${exerciseCount}</legend>
        <!-- Entfernt die gesamte Übung -->
        <button type="button" class="remove-exercise">
            Übung entfernen
        </button>

        <label for="exercise-${exerciseCount}">
            Name:
        </label>
        
        <!-- Eingabefeld mit automatischen Übungsvorschlägen -->
        <input type="text"
            id="exercise-${exerciseCount}"
            list="exercise-suggestions"
            autocomplete="off"
            placeholder="Übung suchen oder eingeben">


        <div class="sets"></div>

        <button type="button" class="add-set">
            + Satz hinzufügen
        </button>
    `;
    
    // Bereich für die zuletzt gespeicherten Trainingswerte
    const lastWorkoutInfo = document.createElement("div");
    lastWorkoutInfo.className = "last-workout-info";

    // Direkt nach dem Übungsnamen einfügen
    const exerciseNameInput = exercise.querySelector('input[type="text"]');
    exerciseNameInput.after(lastWorkoutInfo);

    // Bei jeder Änderung des Übungsnamens nach alten Werten suchen
    exerciseNameInput.addEventListener("input", function() {
        showLastExercise(exerciseNameInput.value, lastWorkoutInfo);
    });

    // Übung in unsere Webseite einfügen
    exercises.appendChild(exercise);

    // Jede neue Übung bekommt automatisch einen ersten Satz
    exercise.querySelector(".sets").appendChild(
        createSet(exerciseCount, 1)
    );
}


// ==========================================
// EVENT: ÜBUNG HINZUFÜGEN
// ==========================================

// Wird ausgeführt, wenn der Button geklickt wird
document.getElementById("add-exercise")
    .addEventListener("click", addExercise);


// ==========================================
// EVENT: SATZ HINZUFÜGEN
// ==========================================

exercises.addEventListener("click", function(event) {

    // Prüfen, ob ein "Satz hinzufügen"-Button geklickt wurde
    if (!event.target.classList.contains("add-set")) {
        return;
    }

    // Die Übung finden, zu der der Button gehört
    const exercise = event.target.closest(".exercise");

    // Satz-Container dieser Übung finden
    const sets = exercise.querySelector(".sets");

    // Neue Satznummer berechnen
    const nextSet = sets.querySelectorAll(".set").length + 1;

    // Übungsnummer auslesen
    const number = exercise.dataset.number;

    // Neuen Satz bei der richtigen Übung einfügen
    sets.appendChild(createSet(number, nextSet));
});


// ==========================================
// APP STARTEN
// ==========================================

// Beim Öffnen automatisch die erste Übung anzeigen
addExercise();


// ==========================================
// FUNKTION: TRAINING SPEICHERN
// ==========================================

function saveWorkout() {
    
    // Prüfen, ob mindestens eine Übung vorhanden ist
    if (document.querySelectorAll(".exercise").length === 0) {
        showSaveStatus(
            "Bitte füge mindestens eine Übung hinzu.",
            true
        );
        return;
    }

    // Prüfen, ob jede Übung mindestens einen Satz besitzt
    for (const exercise of document.querySelectorAll(".exercise")) {

        if (exercise.querySelectorAll(".set").length === 0) {
            showSaveStatus(
                "Jede Übung muss mindestens einen Satz enthalten.",
                true
            );
            return;
        }
    }

    // Hier sammeln wir die Übungen unseres Trainings
    const exercisesData = [];

    // Alle Übungen auf der Webseite finden
    const exerciseElements = document.querySelectorAll(".exercise");

    // Jede Übung einzeln durchgehen
    for (const exerciseElement of exerciseElements) {

        // Name der Übung aus dem Eingabefeld auslesen
        const name = exerciseElement
            .querySelector('input[type="text"]')
            .value.trim();

        // Prüfen, ob ein Name eingegeben wurde
        if (name === "") {
            showSaveStatus("Bitte gib einen Übungsnamen ein.", true);
            return;
        }

        // Hier sammeln wir die Sätze dieser Übung
        const setsData = [];

        // Alle Sätze der aktuellen Übung durchgehen
        for (const setElement of exerciseElement.querySelectorAll(".set")) {

            // Gewicht und Wiederholungen auslesen
            const weightValue = setElement.querySelector(
                'input[id^="weight-"]'
            ).value;

            const repsValue = setElement.querySelector(
                'input[id^="reps-"]'
            ).value;

            // Eingaben überprüfen
            const weight = Number(weightValue);
            const reps = Number(repsValue);

            if (
                weightValue === "" ||
                repsValue === "" ||
                !Number.isFinite(weight) ||
                weight < 0 ||
                !Number.isInteger(reps) ||
                reps < 1
            ) {
                showSaveStatus(
                    "Bitte gib gültige Gewichte und Wiederholungen ein.",
                    true
                );
                return;
            }

            // Gültigen Satz zur Liste hinzufügen
            setsData.push({
                weight: weight,
                reps: reps
            });
        }

        // Übung mit ihren Sätzen speichern
        exercisesData.push({
            name: name,
            sets: setsData
        });
    }

    // Fertiges Training als JavaScript-Objekt erstellen
    const workout = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        exercises: exercisesData
    };

    // Speicherfunktion aus storage.js aufrufen
    try {
        saveWorkoutToStorage(workout);
    } catch (error) {
        console.error("Fehler beim Speichern:", error);
        showSaveStatus(
            "Training konnte nicht gespeichert werden.",
            true
        );
        return;
    }

    // Erfolgsmeldung anzeigen
    showSaveStatus("Training erfolgreich gespeichert!");

    // Anzahl der Trainings aktualisieren
    updateSavedCount();
    
    // Neue Übungen nach dem Speichern in die Vorschlagsliste übernehmen
    loadExerciseSuggestions();

}


// ==========================================
// FUNKTION: STATUSMELDUNG ANZEIGEN
// ==========================================

function showSaveStatus(message, isError = false) {

    const status = document.getElementById("save-status");

    // Meldung in der Webseite anzeigen
    status.textContent = message;

    // Fehler rot, erfolgreiche Speicherung grün darstellen
    status.style.color = isError ? "red" : "green";
}


// ==========================================
// FUNKTION: GESPEICHERTE TRAININGS ZÄHLEN
// ==========================================

function updateSavedCount() {

    try {
        // Bereits gespeicherte Trainings abrufen
        const workouts = loadWorkouts();

        // Anzahl der gespeicherten Trainings anzeigen
        document.getElementById("saved-count").textContent =
            `Gespeicherte Trainings: ${workouts.length}`;

    } catch (error) {
        console.error("Fehler beim Laden:", error);
        showSaveStatus(
            "Gespeicherte Trainings konnten nicht geladen werden.",
            true
        );
    }
}


// ==========================================
// EVENT: TRAINING SPEICHERN
// ==========================================

// Beim Klick auf den Button unsere Speicherfunktion ausführen
document.getElementById("save-workout")
    .addEventListener("click", saveWorkout);


// ==========================================
// APP INITIALISIEREN
// ==========================================

// Beim Start gespeicherte Trainings zählen
updateSavedCount();


// ==========================================
// LETZTE TRAININGSWERTE ANZEIGEN
// ==========================================

function showLastExercise(exerciseName, container) {

    // Vorherige Anzeige entfernen
    container.replaceChildren();

    // Eingaben ohne Leerzeichen am Anfang/Ende vergleichen
    const searchName = exerciseName.trim().toLowerCase();

    // Bei leerem Übungsnamen nichts anzeigen
    if (searchName === "") {
        return;
    }

    // Gespeicherte Trainings laden
    let workouts;

    try {
        workouts = loadWorkouts();
    } catch (error) {
        container.textContent = "Letzte Werte konnten nicht geladen werden.";
        console.error(error);
        return;
    }

    // Neueste Trainingseinheiten zuerst durchsuchen
    const sortedWorkouts = [...workouts].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    for (const workout of sortedWorkouts) {

        // Passende Übung innerhalb des Trainings suchen
        const previousExercise = workout.exercises.find(function(exercise) {
            return exercise.name.trim().toLowerCase() === searchName;
        });

        if (previousExercise) {

            // Überschrift erstellen
            const heading = document.createElement("h4");
            heading.textContent = "Letztes Training";

            container.appendChild(heading);

            // Datum anzeigen
            const date = document.createElement("p");
            date.textContent = new Date(workout.date)
                .toLocaleDateString("de-DE");

            container.appendChild(date);

            // Gespeicherte Sätze einzeln anzeigen
            previousExercise.sets.forEach(function(set, index) {

                const setInfo = document.createElement("p");

                setInfo.textContent =
                    `Satz ${index + 1}: ${set.weight} kg × ${set.reps} Wiederholungen`;

                container.appendChild(setInfo);
            });

            // Passenden Eintrag gefunden: Suche beenden
            return;
        }
    }

    // Es wurde bisher keine passende Übung trainiert
    container.textContent = "Noch keine Trainingswerte für diese Übung vorhanden.";
}


// ==========================================
// FUNKTION: SATZNUMMERN AKTUALISIEREN
// ==========================================

function updateSetNumbers(exercise) {

    // Alle vorhandenen Sätze der Übung finden
    const sets = exercise.querySelectorAll(".set");

    // Sätze von 1 an neu durchnummerieren
    sets.forEach(function(set, index) {

        // Neue Satznummer (index beginnt bei 0)
        const number = index + 1;

        // Überschrift aktualisieren
        set.querySelector("h4").textContent = `Satz ${number}`;
    });
}


// ==========================================
// FUNKTION: ÜBUNGSNUMMERN AKTUALISIEREN
// ==========================================

function updateExerciseNumbers() {

    // Alle noch vorhandenen Übungen finden
    const exerciseElements = exercises.querySelectorAll(".exercise");

    exerciseElements.forEach(function(exercise, index) {

        // Sichtbare Übungsnummer aktualisieren
        exercise.querySelector("legend").textContent =
            `Übung ${index + 1}`;
    });
}


// ==========================================
// EVENT: SATZ ODER ÜBUNG ENTFERNEN
// ==========================================

exercises.addEventListener("click", function(event) {

    // ======================================
    // SATZ ENTFERNEN
    // ======================================

    if (event.target.classList.contains("remove-set")) {

        // Den Satz finden, zu dem der Button gehört
        const set = event.target.closest(".set");

        // Zugehörige Übung finden
        const exercise = event.target.closest(".exercise");

        // Satz aus der Webseite entfernen
        set.remove();

        // Verbleibende Satznummern aktualisieren
        updateSetNumbers(exercise);
    }


    // ======================================
    // ÜBUNG ENTFERNEN
    // ======================================

    if (event.target.classList.contains("remove-exercise")) {

        // Die zugehörige Übung finden
        const exercise = event.target.closest(".exercise");

        // Gesamte Übung entfernen
        exercise.remove();

        // Verbleibende Übungsnummern aktualisieren
        updateExerciseNumbers();
    }
});


// ==========================================
// FUNKTION: ÜBUNGSVORSCHLÄGE LADEN
// ==========================================

function loadExerciseSuggestions() {

    // HTML-Liste für die Vorschläge auswählen
    const datalist = document.getElementById("exercise-suggestions");

    // Alte Vorschläge entfernen
    datalist.replaceChildren();

    // Bereits gespeicherte Trainings laden
    let workouts;

    try {
        workouts = loadWorkouts();
    } catch (error) {
        console.error("Übungsvorschläge konnten nicht geladen werden:", error);
        return;
    }

    // Set speichert jeden Namen nur einmal
    const exerciseNames = new Set();

    // Alle bisherigen Trainings durchgehen
    for (const workout of workouts) {

        // Alle Übungen innerhalb des Trainings durchgehen
        for (const exercise of workout.exercises) {

            // Namen ohne zusätzliche Leerzeichen übernehmen
            const name = exercise.name.trim();

            // Leere Namen ignorieren
            if (name === "") {
                continue;
            }

            // Prüfen, ob die Übung schon vorhanden ist
            const alreadyExists = [...exerciseNames].some(
                savedName => savedName.toLowerCase() === name.toLowerCase()
            );

            // Nur neue Übungsnamen hinzufügen
            if (!alreadyExists) {
                exerciseNames.add(name);
            }
        }
    }

    // Übungsnamen alphabetisch sortieren
    const sortedNames = [...exerciseNames].sort(
        (a, b) => a.localeCompare(b, "de")
    );

    // Für jeden Namen einen Vorschlag erstellen
    for (const name of sortedNames) {

        const option = document.createElement("option");

        option.value = name;

        datalist.appendChild(option);
    }
}


// ==========================================
// VORSCHLÄGE BEIM START LADEN
// ==========================================

loadExerciseSuggestions();


// ==========================================
// TRAINING AUS EINEM TRAININGSPLAN STARTEN
// ==========================================

function loadSelectedPlan() {

    // Informationen aus der aktuellen URL auslesen
    const urlParams = new URLSearchParams(window.location.search);

    // ID des ausgewählten Trainingsplans ermitteln
    const planId = urlParams.get("plan");

    // Wenn keine Plan-ID vorhanden ist:
    // normales freies Training beibehalten
    if (!planId) {
        return;
    }

    // Alle gespeicherten Trainingspläne laden
    let plans;

    try {
        plans = loadPlans();
    } catch (error) {
        console.error("Trainingspläne konnten nicht geladen werden:", error);
        showSaveStatus("Trainingsplan konnte nicht geladen werden.", true);
        return;
    }

    // Passenden Trainingsplan anhand seiner ID suchen
    const selectedPlan = plans.find(function(plan) {
        return plan.id === planId;
    });

    // Prüfen, ob der Trainingsplan existiert
    if (!selectedPlan) {
        showSaveStatus("Trainingsplan wurde nicht gefunden.", true);
        return;
    }

    // Das bisherige leere Trainingsformular entfernen
    exercises.replaceChildren();

    // Für jede Übung des Plans ein Eingabefeld erstellen
    for (const exerciseName of selectedPlan.exercises) {

        // Unsere bereits vorhandene Funktion verwenden
        addExercise();

        // Zuletzt hinzugefügte Übung auswählen
        const exerciseElements = exercises.querySelectorAll(".exercise");
        const latestExercise = exerciseElements[exerciseElements.length - 1];

        // Namen der Übung automatisch eintragen
        const nameInput = latestExercise.querySelector('input[type="text"]');
        nameInput.value = exerciseName;

        // Auch die zuletzt gespeicherten Werte anzeigen
        const lastWorkoutInfo = latestExercise.querySelector(
            ".last-workout-info"
        );

        showLastExercise(exerciseName, lastWorkoutInfo);
    }

    // Anzeigen, welcher Trainingsplan ausgewählt wurde
    const heading = document.querySelector("main h2");

    heading.textContent = `Neues Training – ${selectedPlan.name}`;
}


// ==========================================
// AUSGEWÄHLTEN TRAININGSPLAN BEIM START LADEN
// ==========================================

loadSelectedPlan();
