
// ==========================================
// GYM TRACKER - DATENSPEICHERUNG
// ==========================================

// Eindeutiger Name für unsere gespeicherten Trainings
const STORAGE_KEY = "gym-tracker-workouts";


// ==========================================
// FUNKTION: TRAININGS LADEN
// ==========================================

function loadWorkouts() {

    // Daten aus dem Browser-Speicher abrufen
    const savedData = localStorage.getItem(STORAGE_KEY);

    // Wenn keine Daten vorhanden sind, leere Liste zurückgeben
    if (savedData === null) {
        return [];
    }

    // Gespeicherten JSON-Text zurück in JavaScript-Daten umwandeln
    return JSON.parse(savedData);
}


// ==========================================
// FUNKTION: TRAINING SPEICHERN
// ==========================================

function saveWorkoutToStorage(workout) {

    // Bisherige Trainingseinheiten laden
    const workouts = loadWorkouts();

    // Neues Training zur bestehenden Liste hinzufügen
    workouts.push(workout);

    // Liste in einen JSON-Text umwandeln
    const jsonData = JSON.stringify(workouts);

    // Gesamte Liste im Browser speichern
    localStorage.setItem(STORAGE_KEY, jsonData);
}


// ==========================================
// TRAININGSPLÄNE SPEICHERN UND LADEN
// ==========================================

// Eigener Speicherschlüssel für Trainingspläne
const PLANS_STORAGE_KEY = "gym-tracker-plans";


// Lädt alle gespeicherten Trainingspläne
function loadPlans() {

    // Daten aus dem Browser abrufen
    const savedData = localStorage.getItem(PLANS_STORAGE_KEY);

    // Wenn noch keine Pläne existieren: leere Liste
    if (savedData === null) {
        return [];
    }

    // JSON-Text wieder in JavaScript-Daten umwandeln
    return JSON.parse(savedData);
}


// Speichert einen neuen Trainingsplan
function savePlanToStorage(plan) {

    // Bisherige Trainingspläne laden
    const plans = loadPlans();

    // Neuen Plan zur Liste hinzufügen
    plans.push(plan);

    // Gesamte Liste dauerhaft speichern
    localStorage.setItem(
        PLANS_STORAGE_KEY,
        JSON.stringify(plans)
    );
}


// ==========================================
// FUNKTION: TRAININGSPLAN AKTUALISIEREN
// ==========================================

function updatePlanInStorage(updatedPlan) {

    // Alle gespeicherten Trainingspläne laden
    const plans = loadPlans();

    // Den bestehenden Trainingsplan anhand seiner ID suchen
    const index = plans.findIndex(function(plan) {
        return plan.id === updatedPlan.id;
    });

    // Fehler ausgeben, wenn der Plan nicht existiert
    if (index === -1) {
        throw new Error("Trainingsplan nicht gefunden.");
    }

    // Bestehenden Plan durch den aktualisierten Plan ersetzen
    plans[index] = updatedPlan;

    // Aktualisierte Liste dauerhaft speichern
    localStorage.setItem(
        PLANS_STORAGE_KEY,
        JSON.stringify(plans)
    );
}


// ==========================================
// FUNKTION: TRAININGSPLAN LÖSCHEN
// ==========================================

function deletePlanFromStorage(planId) {

    // Alle gespeicherten Trainingspläne laden
    const plans = loadPlans();

    // Gesuchten Plan anhand seiner ID finden
    const planExists = plans.some(function(plan) {
        return plan.id === planId;
    });

    // Fehler melden, falls der Plan nicht existiert
    if (!planExists) {
        throw new Error("Trainingsplan nicht gefunden.");
    }

    // Alle Pläne behalten, außer den ausgewählten
    const updatedPlans = plans.filter(function(plan) {
        return plan.id !== planId;
    });

    // Aktualisierte Liste dauerhaft speichern
    localStorage.setItem(
        PLANS_STORAGE_KEY,
        JSON.stringify(updatedPlans)
    );
}


// ==========================================
// FUNKTION: GESPEICHERTES TRAINING LÖSCHEN
// ==========================================

function deleteWorkoutFromStorage(workoutId) {

    // Alle bisher gespeicherten Trainings laden
    const workouts = loadWorkouts();

    // Prüfen, ob das Training überhaupt existiert
    const workoutExists = workouts.some(function(workout) {
        return workout.id === workoutId;
    });

    if (!workoutExists) {
        throw new Error("Training nicht gefunden.");
    }

    // Alle Trainings außer dem ausgewählten behalten
    const updatedWorkouts = workouts.filter(function(workout) {
        return workout.id !== workoutId;
    });

    // Neue Liste im Browser speichern
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedWorkouts)
    );
}


// ==========================================
// EINZELNE ÜBUNG AUS EINEM TRAINING LÖSCHEN
// ==========================================

function deleteExerciseFromWorkout(workoutId, exerciseIndex) {

    // Alle gespeicherten Trainings laden
    const workouts = loadWorkouts();

    // Gesuchtes Training anhand seiner ID finden
    const workout = workouts.find(function(item) {
        return item.id === workoutId;
    });

    if (!workout) {
        throw new Error("Training nicht gefunden.");
    }

    // Prüfen, ob die ausgewählte Übung existiert
    if (
        !Number.isInteger(exerciseIndex) ||
        exerciseIndex < 0 ||
        exerciseIndex >= workout.exercises.length
    ) {
        throw new Error("Übung nicht gefunden.");
    }

    // Verhindern, dass die letzte Übung entfernt wird
    if (workout.exercises.length === 1) {
        throw new Error(
            "Die letzte Übung kann nicht entfernt werden. Lösche stattdessen das gesamte Training."
        );
    }

    // Nur die ausgewählte Übung entfernen
    workout.exercises.splice(exerciseIndex, 1);

    // Aktualisierte Trainings dauerhaft speichern
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(workouts)
    );
}


// ==========================================
// FUNKTION: GESPEICHERTEN SATZ AKTUALISIEREN
// ==========================================

function updateSetInStorage(workoutId, exerciseIndex, setIndex, weight, reps) {

    // 1. Neue Werte überprüfen
    if (
        !Number.isFinite(weight) ||
        weight < 0 ||
        !Number.isInteger(reps) ||
        reps < 1
    ) {
        throw new Error("Ungültiges Gewicht oder Wiederholungszahl.");
    }

    // 2. Alle gespeicherten Trainingseinheiten laden
    const workouts = loadWorkouts();

    // 3. Gewünschtes Training anhand seiner ID finden
    const workout = workouts.find(function(item) {
        return item.id === workoutId;
    });

    if (!workout) {
        throw new Error("Training nicht gefunden.");
    }

    // 4. Gewünschte Übung finden
    const exercise = workout.exercises[exerciseIndex];

    if (!exercise) {
        throw new Error("Übung nicht gefunden.");
    }

    // 5. Gewünschten Satz finden
    const set = exercise.sets[setIndex];

    if (!set) {
        throw new Error("Satz nicht gefunden.");
    }

    // 6. Werte des gefundenen Satzes aktualisieren
    set.weight = weight;
    set.reps = reps;

    // 7. Alle Trainingseinheiten wieder dauerhaft speichern
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(workouts)
    );
}


// ==========================================
// AUTOMATISCHE ZWISCHENSPEICHERUNG
// ==========================================

// Eigener Speicherplatz für ein laufendes Training
const DRAFT_STORAGE_KEY = "gym-tracker-draft";


// Laufendes Training zwischenspeichern
function saveWorkoutDraft(draft) {

    // JavaScript-Objekt in JSON umwandeln und speichern
    localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify(draft)
    );
}


// Zwischengespeichertes Training laden
function loadWorkoutDraft() {

    const savedData = localStorage.getItem(DRAFT_STORAGE_KEY);

    // Noch keine Zwischenspeicherung vorhanden
    if (savedData === null) {
        return null;
    }

    // JSON zurück in ein JavaScript-Objekt umwandeln
    return JSON.parse(savedData);
}


// Zwischenspeicherung entfernen
function clearWorkoutDraft() {

    localStorage.removeItem(DRAFT_STORAGE_KEY);
}

// ==========================================
// SATZ EINES GRUPPENTRAININGS AKTUALISIEREN
// ==========================================

function updateGroupSetInStorage(
    workoutId,
    personIndex,
    exerciseIndex,
    setIndex,
    weight,
    reps
) {

    // 1. Neue Trainingswerte überprüfen
    if (
        !Number.isFinite(weight) ||
        weight < 0 ||
        !Number.isInteger(reps) ||
        reps < 1
    ) {
        throw new Error("Ungültiges Gewicht oder Wiederholungszahl.");
    }

    // 2. Gespeicherte Trainings laden
    const workouts = loadWorkouts();

    // 3. Gesuchtes Training finden
    const workout = workouts.find(function(item) {
        return item.id === workoutId;
    });

    if (!workout) {
        throw new Error("Training nicht gefunden.");
    }

    // 4. Prüfen, ob es ein Gruppentraining ist
    if (!Array.isArray(workout.participants)) {
        throw new Error("Kein Gruppentraining gefunden.");
    }

    // 5. Richtige Person finden
    const person = workout.participants[personIndex];

    if (!person) {
        throw new Error("Person nicht gefunden.");
    }

    // 6. Richtige Übung finden
    const exercise = person.exercises[exerciseIndex];

    if (!exercise) {
        throw new Error("Übung nicht gefunden.");
    }

    // 7. Richtigen Satz finden
    const set = exercise.sets[setIndex];

    if (!set) {
        throw new Error("Satz nicht gefunden.");
    }

    // 8. Nur die Werte dieses Satzes verändern
    set.weight = weight;
    set.reps = reps;

    // 9. Aktualisierte Trainings speichern
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(workouts)
    );
}

// ==========================================
// ÜBUNG EINER PERSON AUS GRUPPENTRAINING LÖSCHEN
// ==========================================

function deleteGroupExerciseFromWorkout(
    workoutId,
    personIndex,
    exerciseIndex
) {

    // 1. Gespeicherte Trainings laden
    const workouts = loadWorkouts();

    // 2. Das richtige Training suchen
    const workout = workouts.find(function(item) {
        return item.id === workoutId;
    });

    if (!workout) {
        throw new Error("Training nicht gefunden.");
    }

    // 3. Überprüfen, ob es ein Gruppentraining ist
    if (!Array.isArray(workout.participants)) {
        throw new Error("Kein Gruppentraining gefunden.");
    }

    // 4. Die richtige Person auswählen
    const person = workout.participants[personIndex];

    if (!person) {
        throw new Error("Person nicht gefunden.");
    }

    // 5. Überprüfen, ob die Übung vorhanden ist
    if (
        !Number.isInteger(exerciseIndex) ||
        exerciseIndex < 0 ||
        exerciseIndex >= person.exercises.length
    ) {
        throw new Error("Übung nicht gefunden.");
    }

    // 6. Letzte Übung einer Person schützen
    if (person.exercises.length === 1) {
        throw new Error(
            "Die letzte Übung einer Person kann nicht gelöscht werden."
        );
    }

    // 7. Nur die ausgewählte Übung entfernen
    person.exercises.splice(exerciseIndex, 1);

    // 8. Aktualisierte Trainings speichern
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(workouts)
    );
}
