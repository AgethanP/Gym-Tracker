
// ==========================================
// GYM TRACKER - TRAININGSPLAN ERSTELLEN
// ==========================================

// HTML-Bereich für die Übungen finden
const planExercises = document.getElementById("plan-exercises");

// Zähler für eindeutige Eingabefeld-IDs
let planExerciseCount = 0;


// ==========================================
// FUNKTION: ÜBUNG HINZUFÜGEN
// ==========================================

function addPlanExercise() {

    // Eindeutige Nummer erhöhen
    planExerciseCount++;

    // Neuen HTML-Bereich erstellen
    const exercise = document.createElement("div");
    exercise.className = "plan-exercise";

    // Eingabefeld und Entfernen-Button erstellen
    exercise.innerHTML = `
        <label for="plan-exercise-${planExerciseCount}">
            Übung:
        </label>

        <input
            type="text"
            id="plan-exercise-${planExerciseCount}"
            placeholder="z. B. Bankdrücken"
        >

        <button type="button" class="remove-plan-exercise">
            Entfernen
        </button>
    `;

    // Übung auf der Webseite anzeigen
    planExercises.appendChild(exercise);
}


// ==========================================
// EVENT: ÜBUNG HINZUFÜGEN
// ==========================================

document.getElementById("add-plan-exercise")
    .addEventListener("click", addPlanExercise);


// ==========================================
// EVENT: ÜBUNG ENTFERNEN
// ==========================================

planExercises.addEventListener("click", function(event) {

    // Nur auf den Entfernen-Button reagieren
    if (!event.target.classList.contains("remove-plan-exercise")) {
        return;
    }

    // Die zugehörige Übung finden
    const exercise = event.target.closest(".plan-exercise");

    // Übung entfernen
    exercise.remove();
});


// ==========================================
// SEITE INITIALISIEREN
// ==========================================

// Beim Öffnen direkt ein Übungsfeld anzeigen
addPlanExercise();


// ==========================================
// FUNKTION: TRAININGSPLAN SPEICHERN
// ==========================================

function savePlan() {

    // Namen des Trainingsplans auslesen
    const planName = document.getElementById("plan-name")
        .value.trim();

    // Statusbereich für Fehlermeldungen
    const status = document.getElementById("plan-status");

    // Prüfen, ob ein Planname eingegeben wurde
    if (planName === "") {
        status.textContent = "Bitte gib einen Namen für den Trainingsplan ein.";
        return;
    }

    // Alle Übungsnamen sammeln
    const exerciseNames = [];

    const exerciseInputs = document.querySelectorAll(
        ".plan-exercise input"
    );

    // Jede eingegebene Übung überprüfen
    for (const input of exerciseInputs) {

        const name = input.value.trim();

        if (name === "") {
            status.textContent = "Bitte fülle alle Übungsfelder aus.";
            return;
        }

        exerciseNames.push(name);
    }

    // Mindestens eine Übung muss vorhanden sein
    if (exerciseNames.length === 0) {
        status.textContent = "Bitte füge mindestens eine Übung hinzu.";
        return;
    }

    
    // ==========================================
    // PLAN ERSTELLEN ODER AKTUALISIEREN
    // ==========================================

    // Beim Bearbeiten die bestehende ID beibehalten.
    // Bei einem neuen Plan eine neue ID erzeugen.
    const plan = {
        id: editingPlan ? editingPlan.id : crypto.randomUUID(),
        name: planName,
        exercises: exerciseNames
    };

    try {

        if (editingPlan) {

            // Vorhandenen Trainingsplan aktualisieren
            updatePlanInStorage(plan);

        } else {

            // Neuen Trainingsplan erstellen
            savePlanToStorage(plan);
        }

    } catch (error) {
        console.error("Fehler beim Speichern:", error);
        status.textContent =
            "Trainingsplan konnte nicht gespeichert werden.";
        return;
    }


    // Nach erfolgreicher Speicherung zur Startseite wechseln
    window.location.href = "index.html";
}


// ==========================================
// EVENT: TRAININGSPLAN SPEICHERN
// ==========================================

document.getElementById("save-plan")
    .addEventListener("click", savePlan);


// ==========================================
// TRAININGSPLAN ZUM BEARBEITEN LADEN
// ==========================================

// ID aus der URL auslesen
const urlParams = new URLSearchParams(window.location.search);
const editPlanId = urlParams.get("edit");

// Enthält den Plan, der gerade bearbeitet wird
let editingPlan = null;


function loadPlanForEditing() {

    // Ohne edit-Parameter bleibt die Seite im Erstellungsmodus
    if (!editPlanId) {
        return;
    }

    try {
        // Gespeicherte Pläne laden und den passenden suchen
        const plans = loadPlans();

        editingPlan = plans.find(function(plan) {
            return plan.id === editPlanId;
        });

        if (!editingPlan) {
            throw new Error("Trainingsplan nicht gefunden.");
        }

        // Seitentitel anpassen
        document.querySelector("h1").textContent =
            "Trainingsplan bearbeiten";

        // Bestehenden Namen einsetzen
        document.getElementById("plan-name").value =
            editingPlan.name;

        // Das anfängliche leere Übungsfeld entfernen
        planExercises.replaceChildren();

        // Gespeicherte Übungen wieder als Eingabefelder erstellen
        for (const exerciseName of editingPlan.exercises) {

            addPlanExercise();

            // Zuletzt hinzugefügtes Eingabefeld auswählen
            const inputs = planExercises.querySelectorAll("input");
            const lastInput = inputs[inputs.length - 1];

            lastInput.value = exerciseName;
        }

        // Text des Speichern-Buttons anpassen
        document.getElementById("save-plan").textContent =
            "Änderungen speichern";

    } catch (error) {
        console.error("Fehler beim Laden des Trainingsplans:", error);

        document.getElementById("plan-status").textContent =
            "Trainingsplan konnte nicht geladen werden.";

        // Verhindern, dass ein nicht gefundener Plan gespeichert wird
        document.getElementById("save-plan").disabled = true;
    }
}


// Beim Öffnen prüfen, ob ein Trainingsplan bearbeitet wird
loadPlanForEditing();
