"use strict";

// ==========================================
// GYM TRACKER – TRAININGSPLÄNE ERSTELLEN
// ==========================================
// Kompatibel mit plan-create.html und storage.js.
// Gespeicherte Pläne behalten ihr bisheriges Format:
// { id, name, exercises: ["Übung 1", "Übung 2"] }

const planExercises = document.getElementById("plan-exercises");
const planNameInput = document.getElementById("plan-name");
const addExerciseButton = document.getElementById("add-plan-exercise");
const savePlanButton = document.getElementById("save-plan");
const planStatus = document.getElementById("plan-status");

const editPlanId = new URLSearchParams(window.location.search).get("edit");
let editingPlan = null;
let planExerciseCount = 0;

// Statusmeldungen auch für Screenreader bereitstellen.
planStatus.setAttribute("role", "status");
planStatus.setAttribute("aria-live", "polite");


// ==========================================
// STATUSMELDUNGEN
// ==========================================

function showPlanStatus(message, isError = false) {
    planStatus.textContent = message;
    planStatus.style.color = message
        ? (isError ? "var(--color-danger)" : "var(--color-success)")
        : "";
}

function clearPlanStatus() {
    showPlanStatus("");
}


// ==========================================
// ÜBUNGSFELD HINZUFÜGEN
// ==========================================

function addPlanExercise(exerciseName = "") {
    // Eine fortlaufende Nummer verhindert doppelte HTML-IDs,
    // auch wenn zuvor andere Übungen entfernt wurden.
    planExerciseCount++;
    const inputId = `plan-exercise-${planExerciseCount}`;

    const exercise = document.createElement("div");
    exercise.className = "plan-exercise";

    const label = document.createElement("label");
    label.htmlFor = inputId;
    label.textContent = "Übung:";

    const input = document.createElement("input");
    input.type = "text";
    input.id = inputId;
    input.placeholder = "z. B. Bankdrücken";
    input.autocomplete = "off";
    input.value = exerciseName;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-plan-exercise";
    removeButton.textContent = "Entfernen";
    removeButton.setAttribute("aria-label", "Übung aus dem Trainingsplan entfernen");

    removeButton.addEventListener("click", function() {
        exercise.remove();
        clearPlanStatus();
    });

    exercise.append(label, input, removeButton);
    planExercises.appendChild(exercise);
    clearPlanStatus();

    return input;
}

addExerciseButton.addEventListener("click", function() {
    const input = addPlanExercise();
    input.focus();
});

// Eine alte Fehlermeldung entfernen, sobald die Eingabe korrigiert wird.
planNameInput.addEventListener("input", clearPlanStatus);
planExercises.addEventListener("input", clearPlanStatus);


// ==========================================
// EINGABEN PRÜFEN
// ==========================================

function readPlanInputs() {
    const planName = planNameInput.value.trim();

    if (!planName) {
        showPlanStatus("Bitte gib einen Namen für den Trainingsplan ein.", true);
        planNameInput.focus();
        return null;
    }

    const exerciseInputs = planExercises.querySelectorAll(
        '.plan-exercise input[type="text"]'
    );

    if (exerciseInputs.length === 0) {
        showPlanStatus("Bitte füge mindestens eine Übung hinzu.", true);
        return null;
    }

    const exerciseNames = [];

    for (const input of exerciseInputs) {
        const name = input.value.trim();

        if (!name) {
            showPlanStatus("Bitte fülle alle Übungsfelder aus.", true);
            input.focus();
            return null;
        }

        exerciseNames.push(name);
    }

    // Doppelte Übungsnamen bleiben erlaubt, falls ein Plan
    // dieselbe Übung bewusst mehrfach enthalten soll.
    return { name: planName, exercises: exerciseNames };
}


// ==========================================
// NEUE PLAN-ID ERZEUGEN
// ==========================================

function createPlanId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    // Ersatz für Browser ohne crypto.randomUUID().
    // Diese ID dient nur der lokalen Zuordnung, nicht der Sicherheit.
    return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}


// ==========================================
// TRAININGSPLAN SPEICHERN
// ==========================================

function savePlan() {
    // Bei einem ungültigen Bearbeitungslink oder laufenden
    // Speichervorgang keine weiteren Änderungen zulassen.
    if (savePlanButton.disabled) {
        return;
    }

    const inputData = readPlanInputs();
    if (!inputData) {
        return;
    }

    savePlanButton.disabled = true;

    try {
        const plan = {
            id: editingPlan ? editingPlan.id : createPlanId(),
            name: inputData.name,
            exercises: inputData.exercises
        };

        if (editingPlan) {
            updatePlanInStorage(plan);
        } else {
            savePlanToStorage(plan);
        }

        // Bisheriges Verhalten: Nach dem Speichern zur Startseite.
        window.location.href = "index.html";
    } catch (error) {
        console.error("Trainingsplan konnte nicht gespeichert werden:", error);
        showPlanStatus("Trainingsplan konnte nicht gespeichert werden. Bitte versuche es erneut.", true);
        savePlanButton.disabled = false;
    }
}

savePlanButton.addEventListener("click", savePlan);


// ==========================================
// VORHANDENEN TRAININGSPLAN BEARBEITEN
// ==========================================

function loadPlanForEditing() {
    // Ohne Bearbeitungs-ID beginnen wir mit einem leeren Übungsfeld.
    if (editPlanId === null) {
        addPlanExercise();
        return;
    }

    try {
        const plans = loadPlans();
        const plan = plans.find(item => item && item.id === editPlanId);

        if (!plan ||
            typeof plan.name !== "string" || !plan.name.trim() ||
            !Array.isArray(plan.exercises) ||
            plan.exercises.length === 0 ||
            !plan.exercises.every(
                name => typeof name === "string" && name.trim()
            )) {
            throw new Error("Trainingsplan nicht gefunden oder beschädigt.");
        }

        editingPlan = plan;
        planNameInput.value = plan.name;

        // Jede gespeicherte Übung mit dem richtigen Namen anzeigen.
        planExercises.replaceChildren();
        for (const name of plan.exercises) {
            addPlanExercise(name);
        }

        const heading = document.querySelector(".plan-create-header h1");
        if (heading) {
            heading.textContent = "Trainingsplan bearbeiten";
        }

        document.title = "Trainingsplan bearbeiten – Gym Tracker";
        savePlanButton.textContent = "Änderungen speichern";
        clearPlanStatus();
    } catch (error) {
        console.error("Trainingsplan konnte nicht geladen werden:", error);
        savePlanButton.disabled = true;
        addExerciseButton.disabled = true;
        showPlanStatus(
            "Dieser Trainingsplan konnte nicht geladen werden. Bitte öffne ihn erneut über die Startseite.",
            true
        );
    }
}

// ==========================================
// SEITE STARTEN
// ==========================================

loadPlanForEditing();