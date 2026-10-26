
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

    // Neuen Bereich für einen Satz erstellen
    const set = document.createElement("div");
    set.className = "set";

    // Satznummer, Eingabefelder und Entfernen-Button
    set.innerHTML = `

        <!-- Kopfzeile mit Satznummer und Löschen-Button -->
        <div class="set-header">

            <h4>Satz ${setNumber}</h4>

            <button type="button" class="remove-set">
                Entfernen
            </button>

        </div>

        <!-- Gewicht und Wiederholungen nebeneinander -->
        <div class="set-inputs">

            <div class="set-field">

                <label for="weight-${exerciseNumber}-${setNumber}">
                    Gewicht (kg)
                </label>

                <input type="number"
                       id="weight-${exerciseNumber}-${setNumber}"
                       min="0"
                       step="0.5"
                       inputmode="decimal"
                       placeholder="0">

            </div>

            <div class="set-field">

                <label for="reps-${exerciseNumber}-${setNumber}">
                    Wiederholungen
                </label>

                <input type="number"
                       id="reps-${exerciseNumber}-${setNumber}"
                       min="1"
                       step="1"
                       inputmode="numeric"
                       placeholder="0">

            </div>

        </div>
    `;

    return set;
}


// ==========================================
// FUNKTION: NEUE ÜBUNG HINZUFÜGEN
// ==========================================

function addExercise() {

    // Anzahl der Übungen erhöhen
    exerciseCount ++ ;

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


function saveWorkout() {
    // Prüfen, ob die Teilnehmer bestätigt wurden
    if (!participantsLocked) {

        showSaveStatus(
            "Bitte bestätige zuerst die Teilnehmer.",
            true
        );

        return;
    }
    // Aktuell sichtbare Eingaben ebenfalls übernehmen
    savePersonInputs();

    // Prüfen, ob alleine oder mit Freunden trainiert wird
    const mode = document.querySelector(
        'input[name="training-mode"]:checked'
    ).value;

    // Teilnehmerliste zusammenstellen
    const participants = ["Ich"];

    if (mode === "friends") {

        const names = [...friendNames.querySelectorAll("input")]
            .map(input => input.value.trim());

        // Jeder Freund benötigt einen Namen
        if (names.some(name => name === "")) {
            showSaveStatus("Bitte gib alle Freundesnamen ein.", true);
            return;
        }

        // Namen müssen eindeutig sein
        const normalizedNames = ["ich", ...names.map(
            name => name.toLowerCase()
        )];

        if (new Set(normalizedNames).size !== normalizedNames.length) {
            showSaveStatus("Bitte verwende unterschiedliche Namen.", true);
            return;
        }

        participants.push(...names);
    }

    // Hier sammeln wir die fertigen Teilnehmerdaten
    const participantsData = [];

    // Jede Person einzeln verarbeiten
    for (const person of participants) {

        const personExercises = participantWorkouts[person] || [];

        // Mindestens eine Übung erforderlich
        if (personExercises.length === 0) {
            showSaveStatus(
                `Bitte füge für ${person} mindestens eine Übung hinzu.`,
                true
            );
            return;
        }

        const exercisesData = [];

        for (const exercise of personExercises) {

            const name = exercise.name.trim();

            if (name === "") {
                showSaveStatus(
                    `Bitte gib für ${person} alle Übungsnamen ein.`,
                    true
                );
                return;
            }

            if (exercise.sets.length === 0) {
                showSaveStatus(
                    `${person}: Jede Übung benötigt mindestens einen Satz.`,
                    true
                );
                return;
            }

            const setsData = [];

            for (const set of exercise.sets) {

                const weight = Number(set.weight);
                const reps = Number(set.reps);

                // Ungültige Eingaben verhindern
                if (
                    set.weight === "" ||
                    set.reps === "" ||
                    !Number.isFinite(weight) ||
                    weight < 0 ||
                    !Number.isInteger(reps) ||
                    reps < 1
                ) {
                    showSaveStatus(
                        `Bitte überprüfe die Trainingswerte von ${person}.`,
                        true
                    );
                    return;
                }

                setsData.push({
                    weight: weight,
                    reps: reps
                });
            }

            exercisesData.push({
                name: name,
                sets: setsData
            });
        }

        // Übungen eindeutig einer Person zuordnen
        participantsData.push({
            name: person,
            exercises: exercisesData
        });
    }

    // Ein gemeinsames Training erstellen
    const workout = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),

        // Einzeltraining bleibt mit der alten Struktur kompatibel
        ...(mode === "solo"
            ? { exercises: participantsData[0].exercises }
            : { participants: participantsData })
    };

    // Training dauerhaft speichern
    try {
        saveWorkoutToStorage(workout);
    } catch (error) {
        console.error("Fehler beim Speichern:", error);
        showSaveStatus("Training konnte nicht gespeichert werden.", true);
        return;
    }

    // Erfolgreich abgeschlossenen Entwurf entfernen
    try {
        clearWorkoutDraft();
        showDraftStatus("Training abgeschlossen");
    } catch (error) {
        console.error("Entwurf konnte nicht entfernt werden:", error);
    }

    showSaveStatus("Training erfolgreich gespeichert!");
    // ==========================================
    // DOPPELTES SPEICHERN VERHINDERN
    // ==========================================

    // Speichern-Button nach erfolgreichem Speichern deaktivieren
    const saveButton = document.getElementById("save-workout");

    saveButton.disabled = true;
    saveButton.textContent = "Training abgeschlossen ✓";
    // Button für ein neues Training sichtbar machen
    const newWorkoutButton = document.getElementById("new-workout");
    newWorkoutButton.hidden = false;
    updateSavedCount();
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

function showLastExercise(exerciseName, container) {

    // Bisherige Anzeige entfernen
    container.replaceChildren();

    const searchName = exerciseName.trim().toLowerCase();

    if (searchName === "") {
        return;
    }

    let workouts;

    try {
        workouts = loadWorkouts();
    } catch (error) {
        console.error("Fehler beim Laden:", error);
        container.textContent =
            "Letzte Trainingswerte konnten nicht geladen werden.";
        return;
    }

    // Aktuell ausgewählte Person bestimmen
    const personName =
        typeof activePerson !== "undefined" ? activePerson : "Ich";

    // Neueste Trainings zuerst durchsuchen
    const sortedWorkouts = [...workouts].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    for (const workout of sortedWorkouts) {

        let personExercises = [];

        if (Array.isArray(workout.participants)) {

            // Gemeinsames Training:
            // Nur die Übungen der ausgewählten Person verwenden
            const person = workout.participants.find(
                participant => participant.name === personName
            );

            if (!person) {
                continue;
            }

            personExercises = person.exercises || [];

        } else {

            // Alte Einzeltrainings gehören ausschließlich "Ich"
            if (personName !== "Ich") {
                continue;
            }

            personExercises = workout.exercises || [];
        }

        // Passende Übung suchen
        const previousExercise = personExercises.find(
            exercise =>
                exercise.name.trim().toLowerCase() === searchName
        );

        if (!previousExercise) {
            continue;
        }

        // Überschrift anzeigen
        const heading = document.createElement("h4");
        heading.textContent = "Letztes Training";
        container.appendChild(heading);

        // Trainingsdatum anzeigen
        const date = document.createElement("p");
        date.textContent = new Date(workout.date)
            .toLocaleDateString("de-DE");

        container.appendChild(date);

        // Sätze anzeigen
        previousExercise.sets.forEach(function(set, index) {

            const setInfo = document.createElement("p");

            setInfo.textContent =
                `Satz ${index + 1}: ${set.weight} kg × ${set.reps} Wiederholungen`;

            container.appendChild(setInfo);
        });

        return;
    }

    container.textContent =
        "Noch keine Trainingswerte für diese Person und Übung vorhanden.";
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
// ÜBUNGSVORSCHLÄGE LADEN
// EINZEL- UND GRUPPENTRAININGS
// ==========================================

function loadExerciseSuggestions() {

    // Vorschlagsliste aus HTML auswählen
    const datalist =
        document.getElementById("exercise-suggestions");

    // Alte Vorschläge entfernen
    datalist.replaceChildren();

    let workouts;

    try {
        workouts = loadWorkouts();
    } catch (error) {
        console.error("Fehler beim Laden:", error);
        return;
    }

    // Hier sammeln wir alle Übungsnamen
    const exerciseNames = new Set();

    // Hilfsfunktion: Übungsnamen einer Liste übernehmen
    function collectNames(exerciseList) {

        for (const exercise of exerciseList) {

            const name = exercise.name.trim();

            if (name === "") {
                continue;
            }

            // Groß-/Kleinschreibung beim Vergleich ignorieren
            const exists = [...exerciseNames].some(
                savedName =>
                    savedName.toLowerCase() === name.toLowerCase()
            );

            if (!exists) {
                exerciseNames.add(name);
            }
        }
    }

    // Alle gespeicherten Trainings durchgehen
    for (const workout of workouts) {

        if (Array.isArray(workout.participants)) {

            // Gemeinsames Training:
            // Übungen aller Teilnehmer berücksichtigen
            for (const person of workout.participants) {
                collectNames(person.exercises || []);
            }

        } else {

            // Bisheriges Einzeltraining
            collectNames(workout.exercises || []);
        }
    }

    // Übungsnamen alphabetisch sortieren
    const sortedNames = [...exerciseNames].sort(
        (a, b) => a.localeCompare(b, "de")
    );

    // Vorschläge als HTML-Optionen einfügen
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
    // Übungszähler zurücksetzen
    exerciseCount = 0;
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


// ==========================================
// LAUFENDES TRAINING AUTOMATISCH SICHERN
// ==========================================

// Statusmeldung für die Zwischenspeicherung
function showDraftStatus(message) {

    const status = document.getElementById("draft-status");

    if (status) {
        status.textContent = message;
    }
}

function collectWorkoutDraft() {

    const draftExercises = [];

    // Eingaben der aktuell sichtbaren Person sammeln
    for (const exercise of exercises.querySelectorAll(".exercise")) {

        const name = exercise.querySelector('input[type="text"]').value;

        const sets = [];

        for (const set of exercise.querySelectorAll(".set")) {

            sets.push({
                weight: set.querySelector('input[id^="weight-"]').value,
                reps: set.querySelector('input[id^="reps-"]').value
            });
        }

        draftExercises.push({
            name: name,
            sets: sets
        });
    }

    // Wenn die Mehrpersonen-Funktion aktiv ist,
    // die aktuelle Person ebenfalls aktualisieren.
    if (typeof activePerson !== "undefined") {
        participantWorkouts[activePerson] = draftExercises;
    }

    return {
        // Zugehörigen Trainingsplan merken
        planId: new URLSearchParams(window.location.search).get("plan"),
        // Merken, ob die Teilnehmer bereits bestätigt wurden
        participantsLocked: participantsLocked,
        // Aktuell ausgewählte Person merken
        activePerson: activePerson,

        // Trainingsart merken
        mode: document.querySelector(
            'input[name="training-mode"]:checked'
        ).value,

        // Namen der Freunde merken
        friendNames: [...friendNames.querySelectorAll("input")]
            .map(input => input.value),

        // Trainingsdaten aller Personen sichern
        participantWorkouts: structuredClone(participantWorkouts),

        // Bisheriges Datenfeld für Einzeltrainings beibehalten
        exercises: draftExercises
    };
}

// ==========================================
// ZWISCHENSPEICHERUNG AUSFÜHREN
// ==========================================

function autoSaveWorkout() {

    try {

        // Aktuelle Formulardaten sichern
        const draft = collectWorkoutDraft();

        saveWorkoutDraft(draft);

        showDraftStatus("Automatisch zwischengespeichert");

    } catch (error) {

        console.error("Zwischenspeicherung fehlgeschlagen:", error);

        showDraftStatus("Zwischenspeicherung fehlgeschlagen");
    }
}


// ==========================================
// LAUFENDES TRAINING WIEDERHERSTELLEN
// ==========================================

function restoreWorkoutDraft() {

    let draft;

    try {
        draft = loadWorkoutDraft();
    } catch (error) {
        console.error("Fehler beim Laden:", error);
        showDraftStatus("Zwischenspeicherung konnte nicht geladen werden");
        return;
    }

    // Ohne gespeicherten Entwurf nichts wiederherstellen
    if (!draft || !Array.isArray(draft.exercises)) {
        return;
    }

    // Trainingsplan-ID der aktuellen Seite ermitteln
    const currentPlanId =
        new URLSearchParams(window.location.search).get("plan");

    // Entwurf nur beim passenden Trainingsplan laden
    if ((draft.planId || null) !== currentPlanId) {
        showDraftStatus("Ein Entwurf eines anderen Trainings ist gespeichert");
        return;
    }
    
    // ==========================================
    // TRAININGSART UND FREUNDE WIEDERHERSTELLEN
    // ==========================================

    // Gespeicherte Trainingsart wieder auswählen
    const savedMode = draft.mode === "friends" ? "friends" : "solo";

    document.querySelector(
        `input[name="training-mode"][value="${savedMode}"]`
    ).checked = true;

    // Gespeicherte Freundesnamen laden
    if (savedMode === "friends") {

        const savedNames = Array.isArray(draft.friendNames)
            ? draft.friendNames
            : [];

        // Anzahl der Freunde wieder einstellen
        friendCount.value = String(
            Math.max(1, Math.min(savedNames.length, 5))
        );

        // Passende Namensfelder erstellen
        updateTrainingMode();

        // Namen in die Felder eintragen
        friendNames.querySelectorAll("input").forEach(
            function(input, index) {
                input.value = savedNames[index] || "";
            }
        );

    } else {

        // Beim Einzeltraining Freundesfelder ausblenden
        updateTrainingMode();
    }

    // Zuletzt ausgewählte Person wieder aktivieren
    activePerson = draft.activePerson || "Ich";

    // Teilnehmer-Buttons aktualisieren
    updatePersonTabs();

    // Gespeicherte Teilnehmerdaten wiederherstellen
    if (draft.participantWorkouts) {

        // Bereits vorhandene Daten entfernen
        for (const person of Object.keys(participantWorkouts)) {
            delete participantWorkouts[person];
        }

        // Alle gespeicherten Personen übernehmen
        Object.assign(
            participantWorkouts,
            draft.participantWorkouts
        );
    }
    // Bisheriges Formular entfernen
    exercises.replaceChildren();
    // Übungszähler zurücksetzen
    exerciseCount = 0;
    // Jede gespeicherte Übung wieder erstellen
    for (const savedExercise of draft.exercises) {

        // Bestehende Funktion zum Erstellen einer Übung nutzen
        addExercise();

        const exerciseElements = exercises.querySelectorAll(".exercise");
        const exercise = exerciseElements[exerciseElements.length - 1];

        // Gespeicherten Übungsnamen einsetzen
        const nameInput = exercise.querySelector('input[type="text"]');
        nameInput.value = savedExercise.name;

        // Letzte Trainingswerte bei Bedarf anzeigen
        const lastWorkoutInfo = exercise.querySelector(".last-workout-info");
        showLastExercise(savedExercise.name, lastWorkoutInfo);

        // Bereits vorhandene Sätze entfernen
        const setsContainer = exercise.querySelector(".sets");
        setsContainer.replaceChildren();

        // Gespeicherte Sätze wiederherstellen
        for (const savedSet of savedExercise.sets) {

            const exerciseNumber = exercise.dataset.number;
            const setNumber = setsContainer.querySelectorAll(".set").length + 1;

            const set = createSet(exerciseNumber, setNumber);

            // Gespeicherte Werte in die Eingabefelder einsetzen
            set.querySelector('input[id^="weight-"]').value = savedSet.weight;
            set.querySelector('input[id^="reps-"]').value = savedSet.reps;

            setsContainer.appendChild(set);
        }
    }

    showDraftStatus("Laufendes Training wiederhergestellt");
    // Gesperrte Teilnehmer erst nach vollständiger
    // Wiederherstellung der Trainingsdaten erneut sperren.
    if (draft.participantsLocked === true) {
    lockParticipants(false);
}
}


// ==========================================
// AUTOMATISCHE SPEICHERUNG AKTIVIEREN
// ==========================================

// Bei Änderungen an Eingabefeldern speichern
exercises.addEventListener("input", autoSaveWorkout);

// Auch Änderungen an Übungen und Sätzen erfassen
exercises.addEventListener("click", function(event) {

    if (
        event.target.classList.contains("add-set") ||
        event.target.classList.contains("remove-set") ||
        event.target.classList.contains("remove-exercise")
    ) {
        // Erst nach den bestehenden Klick-Funktionen speichern
        queueMicrotask(autoSaveWorkout);
    }
});

// Button zum Hinzufügen einer Übung
document.getElementById("add-exercise")
    .addEventListener("click", function() {
        queueMicrotask(autoSaveWorkout);
    });

// ==========================================
// SCHRITT 18.2 – FREUNDE AUSWÄHLEN
// ==========================================

// Benötigte HTML-Elemente auswählen
const trainingModeInputs =
    document.querySelectorAll('input[name="training-mode"]');

const friendsSection = document.getElementById("friends-section");
const friendCount = document.getElementById("friend-count");
const friendNames = document.getElementById("friend-names");


// ------------------------------------------
// NAMENSFELDER ERSTELLEN
// ------------------------------------------

function updateFriendInputs() {

    // Bereits eingegebene Namen merken
    const previousNames = [...friendNames.querySelectorAll("input")]
        .map(input => input.value);

    // Bisherige Eingabefelder entfernen
    friendNames.replaceChildren();

    // Anzahl der Freunde auslesen
    const count = Number(friendCount.value);

    // Für jeden Freund ein eigenes Eingabefeld erstellen
    for (let i = 0; i < count; i++) {

        const field = document.createElement("div");
        field.className = "friend-field";

        const label = document.createElement("label");
        label.htmlFor = `friend-${i}`;
        label.textContent = `Name von Freund ${i + 1}`;

        const input = document.createElement("input");
        input.type = "text";
        input.id = `friend-${i}`;
        input.placeholder = `Freund ${i + 1}`;

        // Namen beibehalten, wenn sich die Anzahl ändert
        input.value = previousNames[i] || "";

        field.appendChild(label);
        field.appendChild(input);

        friendNames.appendChild(field);
        // Teilnehmer-Buttons aktualisieren
        updatePersonTabs();
    }
    
}


// ------------------------------------------
// ALLEINE ODER MIT FREUNDEN
// ------------------------------------------

function updateTrainingMode() {

    const selectedMode = document.querySelector(
        'input[name="training-mode"]:checked'
    ).value;

    // Freunde-Eingaben nur im gemeinsamen Training anzeigen
    friendsSection.hidden = selectedMode !== "friends";

    if (selectedMode === "friends") {
        updateFriendInputs();
    }
}


// Bei Änderung der Trainingsart reagieren
trainingModeInputs.forEach(input => {
    input.addEventListener("change", updateTrainingMode);
});

// Bei Änderung der Freundesanzahl Felder aktualisieren
friendCount.addEventListener("change", updateFriendInputs);

// Ausgangszustand festlegen
updateTrainingMode();

// ==========================================
// SCHRITT 18.3.2 – TEILNEHMER ANZEIGEN
// ==========================================

// Container für die Teilnehmer-Buttons
const personTabs = document.getElementById("person-tabs");

// Aktuell ausgewählte Person
let activePerson = "Ich";

// ==========================================
// TRAININGSDATEN PRO PERSON
// ==========================================

// Hier merken wir uns die Eingaben jeder Person.
// Die Daten bleiben zunächst nur während der laufenden Sitzung erhalten.
const participantWorkouts = {};



// Teilnehmer-Buttons aktualisieren
function updatePersonTabs() {

    // Prüfen, ob alleine oder mit Freunden trainiert wird
    const mode = document.querySelector(
        'input[name="training-mode"]:checked'
    ).value;

    // Standardmäßig ist nur der Nutzer dabei
    const participants = ["Ich"];

    // Beim gemeinsamen Training Freunde ergänzen
    if (mode === "friends") {

        const inputs = friendNames.querySelectorAll("input");

        inputs.forEach(function(input, index) {

            // Eingetragenen Namen verwenden
            const name = input.value.trim();

            // Ohne Namen vorläufige Bezeichnung verwenden
            participants.push(name || `Freund ${index + 1}`);
        });
    }

    // Bisherige Buttons entfernen
    personTabs.replaceChildren();

    // Für jede Person einen Button erstellen
    participants.forEach(function(person) {

        const button = document.createElement("button");

        button.type = "button";
        button.className = "person-tab";
        button.textContent = person;

        // Aktuell ausgewählte Person hervorheben
        if (person === activePerson) {
            button.classList.add("active");
        }
                
        button.addEventListener("click", function() {

            // Bei einem Klick auf die bereits aktive Person
            // muss nichts gewechselt werden.
            if (activePerson === person) {
                return;
            }

            // Aktuelle Eingaben sichern
            savePersonInputs();

            // Neue Person auswählen
            activePerson = person;

            // Eingaben der neuen Person anzeigen
            loadPersonInputs(activePerson);

            // Teilnehmer-Buttons aktualisieren
            updatePersonTabs();
        });

        personTabs.appendChild(button);
    });

    // Falls eine Person entfernt wurde, zu "Ich" wechseln
    if (!participants.includes(activePerson)) {
        activePerson = "Ich";
        updatePersonTabs();
    }
}


// Wenn ein Freundesname geändert wird,
// Teilnehmer-Buttons direkt aktualisieren
friendNames.addEventListener("input", updatePersonTabs);

// Wenn die Trainingsart geändert wird,
// Teilnehmerliste aktualisieren
trainingModeInputs.forEach(function(input) {
    input.addEventListener("change", updatePersonTabs);
});

// Beim Laden der Seite Teilnehmer anzeigen
updatePersonTabs();
// ==========================================
// EINGABEN DER AKTUELLEN PERSON MERKEN
// ==========================================

function savePersonInputs() {

    // Unsere bestehende Funktion sammelt alle Übungsdaten,
    // auch wenn Gewicht oder Wiederholungen noch leer sind.
    const draft = collectWorkoutDraft();

    // Daten der aktuellen Person zuordnen
    participantWorkouts[activePerson] = draft.exercises;
}


// ==========================================
// EINGABEN EINER PERSON ANZEIGEN
// ==========================================

function loadPersonInputs(person) {

    // Bisherige Übungen aus der Ansicht entfernen
    exercises.replaceChildren();

    // Übungszähler zurücksetzen
    exerciseCount = 0;

    // Gespeicherte Eingaben der gewählten Person abrufen
    const savedExercises = participantWorkouts[person];

    // Neue Person ohne Eingaben: leere Übung anzeigen
    if (!savedExercises) {
        addExercise();
        return;
    }

    // Alle Übungen der ausgewählten Person wiederherstellen
    for (const savedExercise of savedExercises) {

        addExercise();

        // Zuletzt erstellte Übung auswählen
        const exerciseElements = exercises.querySelectorAll(".exercise");
        const exercise = exerciseElements[exerciseElements.length - 1];

        // Übungsnamen wiederherstellen
        const nameInput = exercise.querySelector('input[type="text"]');
        nameInput.value = savedExercise.name;

        // Letzte Trainingswerte anzeigen
        const lastInfo = exercise.querySelector(".last-workout-info");
        showLastExercise(savedExercise.name, lastInfo);

        // Automatisch erstellte Sätze entfernen
        const setsContainer = exercise.querySelector(".sets");
        setsContainer.replaceChildren();

        // Gespeicherte Sätze der Person hinzufügen
        savedExercise.sets.forEach(function(savedSet, index) {

            const set = createSet(exercise.dataset.number, index + 1);

            set.querySelector('input[id^="weight-"]').value =
                savedSet.weight;

            set.querySelector('input[id^="reps-"]').value =
                savedSet.reps;

            setsContainer.appendChild(set);
        });
    }
}

// ==========================================
// SCHRITT 18.7.1 – TEILNEHMER SPERREN
// ==========================================

// Merkt sich, ob die Teilnehmer bestätigt wurden
let participantsLocked = false;

// Benötigte HTML-Elemente
const confirmParticipantsButton =
    document.getElementById("confirm-participants");

const participantsStatus =
    document.getElementById("participants-status");


// Teilnehmerauswahl sperren
function lockParticipants(saveDraft = true) {

    // Trainingsart bestimmen
    const mode = document.querySelector(
        'input[name="training-mode"]:checked'
    ).value;

    // Bei gemeinsamem Training Namen prüfen
    if (mode === "friends") {

        const names = [...friendNames.querySelectorAll("input")]
            .map(input => input.value.trim());

        // Leere Namen verhindern
        if (names.some(name => name === "")) {
            participantsStatus.textContent =
                "Bitte gib zuerst alle Freundesnamen ein.";
            return;
        }

        // Doppelte Namen verhindern
        const normalized = ["ich", ...names.map(
            name => name.toLowerCase()
        )];

        if (new Set(normalized).size !== normalized.length) {
            participantsStatus.textContent =
                "Bitte verwende unterschiedliche Namen.";
            return;
        }
    }

    // Teilnehmer als bestätigt markieren
    participantsLocked = true;

    // Auswahl der Trainingsart sperren
    trainingModeInputs.forEach(function(input) {
        input.disabled = true;
    });

    // Freundesanzahl sperren
    friendCount.disabled = true;

    // Freundesnamen sperren
    friendNames.querySelectorAll("input").forEach(function(input) {
        input.disabled = true;
    });

    // Bestätigungsbutton deaktivieren
    confirmParticipantsButton.disabled = true;
    confirmParticipantsButton.textContent = "Teilnehmer bestätigt ✓";

    participantsStatus.textContent =
        "Teilnehmer festgelegt. Du kannst jetzt trainieren.";

    // Teilnehmer-Buttons mit den endgültigen Namen anzeigen
    updatePersonTabs();
    // Nur beim normalen Bestätigen speichern,
    // nicht während der Wiederherstellung.
    if (saveDraft) {
    autoSaveWorkout();
}
}


// Bei Klick Teilnehmer bestätigen
confirmParticipantsButton.addEventListener(
    "click",
    lockParticipants
);

// ==========================================
// APP INITIALISIEREN – ENTWURF WIEDERHERSTELLEN
// ==========================================

// Erst jetzt sind alle Variablen und Event-Listener
// für die Teilnehmerverwaltung vorbereitet.
restoreWorkoutDraft();

// ==========================================
// SCHRITT 21.2 – NEUES TRAINING STARTEN
// ==========================================

const newWorkoutButton = document.getElementById("new-workout");

newWorkoutButton.addEventListener("click", function() {

    // 1. Gespeicherten Entwurf entfernen
    // Bereits abgeschlossene Trainings bleiben erhalten.
    clearWorkoutDraft();

    // 2. Trainingsseite neu öffnen
    // Ohne ?plan=... starten wir ein freies Training.
    window.location.href = "training.html";
});
