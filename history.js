// ==========================================
// GYM TRACKER – TRAININGSHISTORIE
// ==========================================
// Gemeinsame Darstellung für Einzel- und Gruppentrainings.
// Benötigt die vorhandenen Funktionen aus storage.js.

const historyContainer = document.getElementById("workout-history");


// ==========================================
// HILFSFUNKTIONEN
// ==========================================

function formatHistoryDate(value) {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "Unbekanntes Datum"
        : date.toLocaleDateString("de-DE");
}

function showHistoryError(error, fallbackMessage) {
    console.error(fallbackMessage, error);
    alert(error instanceof Error ? error.message : fallbackMessage);
}

// Nach einer Änderung sollen bereits aufgeklappte Trainings offen bleiben.
function getOpenWorkoutIds() {
    return new Set(
        [...historyContainer.querySelectorAll("details.history-workout[open]")]
            .map(element => element.dataset.workoutId)
    );
}


// ==========================================
// EINEN SATZ DARSTELLEN UND BEARBEITEN
// ==========================================

function createHistorySet(workout, exerciseIndex, setIndex, set, personIndex = null) {
    const setElement = document.createElement("div");
    setElement.className = "history-set";

    const setText = document.createElement("span");
    setText.textContent =
        `Satz ${setIndex + 1}: ${set.weight} kg × ${set.reps} Wiederholungen`;

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-set";
    editButton.textContent = "Bearbeiten";
    editButton.setAttribute("aria-label", `Satz ${setIndex + 1} bearbeiten`);

    editButton.addEventListener("click", function() {
        // Nicht mehrere Formulare für denselben Satz öffnen.
        if (setElement.querySelector(".set-edit-form")) {
            return;
        }

        const form = document.createElement("div");
        form.className = "set-edit-form";

        const weightInput = document.createElement("input");
        weightInput.type = "number";
        weightInput.min = "0";
        weightInput.step = "any";
        weightInput.inputMode = "decimal";
        weightInput.value = set.weight;
        weightInput.setAttribute("aria-label", "Gewicht in kg");

        const repsInput = document.createElement("input");
        repsInput.type = "number";
        repsInput.min = "1";
        repsInput.step = "1";
        repsInput.inputMode = "numeric";
        repsInput.value = set.reps;
        repsInput.setAttribute("aria-label", "Wiederholungen");

        const saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.textContent = "Speichern";

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.textContent = "Abbrechen";

        const errorMessage = document.createElement("p");
        errorMessage.setAttribute("role", "alert");
        errorMessage.style.color = "var(--color-danger)";
        errorMessage.style.width = "100%";
        errorMessage.style.margin = "0";
        errorMessage.hidden = true;

        saveButton.addEventListener("click", function() {
            const weightText = weightInput.value.trim();
            const repsText = repsInput.value.trim();
            const weight = Number(weightText);
            const reps = Number(repsText);

            if (weightText === "" || repsText === "" ||
                !Number.isFinite(weight) || weight < 0 ||
                !Number.isInteger(reps) || reps < 1) {
                errorMessage.textContent =
                    "Bitte ein gültiges Gewicht und mindestens eine Wiederholung eingeben.";
                errorMessage.hidden = false;
                return;
            }

            try {
                if (personIndex === null) {
                    updateSetInStorage(workout.id, exerciseIndex, setIndex, weight, reps);
                } else {
                    updateGroupSetInStorage(
                        workout.id, personIndex, exerciseIndex, setIndex, weight, reps
                    );
                }

                // Die aktuelle Trainingseinheit nach dem Speichern offen lassen.
                displayWorkoutHistory(workout.id);
            } catch (error) {
                console.error("Satz konnte nicht gespeichert werden:", error);
                errorMessage.textContent = error instanceof Error
                    ? error.message
                    : "Satz konnte nicht gespeichert werden.";
                errorMessage.hidden = false;
            }
        });

        cancelButton.addEventListener("click", function() {
            form.remove();
            setText.hidden = false;
            editButton.hidden = false;
            editButton.focus();
        });

        form.append(weightInput, repsInput, saveButton, cancelButton, errorMessage);
        setText.hidden = true;
        editButton.hidden = true;
        setElement.appendChild(form);
        weightInput.focus();
    });

    setElement.append(setText, editButton);
    return setElement;
}


// ==========================================
// EINE ÜBUNG DARSTELLEN UND LÖSCHEN
// ==========================================

function createHistoryExercise(workout, exercise, exerciseIndex, personIndex = null) {
    const exerciseElement = document.createElement("div");
    exerciseElement.className = "history-exercise";

    const title = document.createElement("h4");
    title.textContent = exercise.name;
    exerciseElement.appendChild(title);

    for (const [setIndex, set] of (exercise.sets || []).entries()) {
        exerciseElement.appendChild(
            createHistorySet(workout, exerciseIndex, setIndex, set, personIndex)
        );
    }

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-exercise-history";
    deleteButton.textContent = "Übung löschen";

    deleteButton.addEventListener("click", function() {
        let question = `Möchtest du "${exercise.name}" aus diesem Training entfernen?`;

        if (personIndex !== null) {
            const personName = workout.participants[personIndex].name;
            question = `Möchtest du "${exercise.name}" von ${personName} wirklich löschen?`;
        }

        if (!confirm(question)) {
            return;
        }

        try {
            if (personIndex === null) {
                deleteExerciseFromWorkout(workout.id, exerciseIndex);
            } else {
                deleteGroupExerciseFromWorkout(workout.id, personIndex, exerciseIndex);
            }

            // Auch nach dem Löschen bleibt diese Trainingseinheit geöffnet.
            displayWorkoutHistory(workout.id);
        } catch (error) {
            showHistoryError(error, "Übung konnte nicht gelöscht werden.");
        }
    });

    exerciseElement.appendChild(deleteButton);
    return exerciseElement;
}


// ==========================================
// EINE TRAININGSEINHEIT DARSTELLEN
// ==========================================

function createHistoryWorkout(workout) {
    const workoutElement = document.createElement("details");
    workoutElement.className = "history-workout";
    workoutElement.dataset.workoutId = workout.id;

    const date = formatHistoryDate(workout.date);
    const isGroupWorkout = Array.isArray(workout.participants);

    const summary = document.createElement("summary");

    if (isGroupWorkout) {
        const count = workout.participants.length;
        summary.textContent =
            `${date} – Gemeinsames Training (${count} ${count === 1 ? "Person" : "Personen"})`;
    } else {
        const count = (workout.exercises || []).length;
        summary.textContent =
            `${date} – ${count} ${count === 1 ? "Übung" : "Übungen"}`;
    }

    workoutElement.appendChild(summary);

    if (isGroupWorkout) {
        workout.participants.forEach(function(person, personIndex) {
            const personElement = document.createElement("section");
            personElement.className = "history-person";

            const personTitle = document.createElement("h3");
            personTitle.textContent = person.name;
            personElement.appendChild(personTitle);

            (person.exercises || []).forEach(function(exercise, exerciseIndex) {
                personElement.appendChild(
                    createHistoryExercise(workout, exercise, exerciseIndex, personIndex)
                );
            });

            workoutElement.appendChild(personElement);
        });
    } else {
        (workout.exercises || []).forEach(function(exercise, exerciseIndex) {
            workoutElement.appendChild(
                createHistoryExercise(workout, exercise, exerciseIndex)
            );
        });
    }

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-workout";
    deleteButton.textContent = "Gesamtes Training löschen";

    deleteButton.addEventListener("click", function() {
        const question = isGroupWorkout
            ? `Gemeinsames Training vom ${date} wirklich löschen?`
            : `Möchtest du das gesamte Training vom ${date} wirklich löschen?`;

        if (!confirm(question)) {
            return;
        }

        try {
            deleteWorkoutFromStorage(workout.id);
            displayWorkoutHistory();
        } catch (error) {
            showHistoryError(error, "Training konnte nicht gelöscht werden.");
        }
    });

    workoutElement.appendChild(deleteButton);
    return workoutElement;
}


// ==========================================
// GESAMTE TRAININGSHISTORIE ANZEIGEN
// ==========================================

function displayWorkoutHistory(workoutToOpen = null) {
    const openIds = getOpenWorkoutIds();

    if (workoutToOpen !== null) {
        openIds.add(workoutToOpen);
    }

    let workouts;

    try {
        workouts = loadWorkouts();
    } catch (error) {
        console.error("Trainings konnten nicht geladen werden:", error);
        historyContainer.textContent = "Trainings konnten nicht geladen werden.";
        return;
    }

    historyContainer.replaceChildren();

    if (workouts.length === 0) {
        historyContainer.textContent = "Noch keine Trainings gespeichert.";
        return;
    }

    // Wirklich nach Trainingsdatum sortieren (neueste zuerst).
    // Bei gleichem Datum bleibt die ursprüngliche Reihenfolge erhalten.
    const sortedWorkouts = [...workouts].sort(function(a, b) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    try {
        for (const workout of sortedWorkouts) {
            const workoutElement = createHistoryWorkout(workout);
            workoutElement.open = openIds.has(workout.id);
            historyContainer.appendChild(workoutElement);
        }
    } catch (error) {
        console.error("Fehler beim Anzeigen der Trainingshistorie:", error);
        historyContainer.textContent =
            "Trainingshistorie konnte nicht vollständig angezeigt werden. Bitte prüfe deine Daten.";
        return;
    }

    // Nach einer Änderung den Fokus auf dem aktualisierten Training belassen.
    if (workoutToOpen !== null) {
        const updatedWorkout = [...historyContainer.querySelectorAll(".history-workout")]
            .find(element => element.dataset.workoutId === workoutToOpen);

        if (updatedWorkout) {
            updatedWorkout.querySelector("summary").focus();
        }
    }
}


// ==========================================
// HISTORIE BEIM ÖFFNEN LADEN
// ==========================================

displayWorkoutHistory();