
// ==========================================
// GYM TRACKER - TRAININGSHISTORIE
// ==========================================

// HTML-Bereich für die Trainingshistorie auswählen
const historyContainer = document.getElementById("workout-history");



// ==========================================
// FUNKTION: TRAININGSHISTORIE ANZEIGEN
// ==========================================

function displayWorkoutHistory() {

    // Alte Anzeige entfernen
    historyContainer.innerHTML = "";

    let workouts;

    // Gespeicherte Trainings aus storage.js laden
    try {
        workouts = loadWorkouts();
    } catch (error) {
        console.error("Fehler beim Laden:", error);
        historyContainer.textContent =
            "Trainings konnten nicht geladen werden.";
        return;
    }

    // Falls noch keine Trainings vorhanden sind
    if (workouts.length === 0) {
        historyContainer.textContent =
            "Noch keine Trainings gespeichert.";
        return;
    }

    // Neueste Trainings zuerst anzeigen
    const sortedWorkouts = [...workouts].reverse();

    // ==========================================
    // ALLE TRAININGSEINHEITEN DURCHGEHEN
    // ==========================================

    for (const workout of sortedWorkouts) {

        // Aufklappbares Element erstellen
        const workoutElement = document.createElement("details");
        workoutElement.className = "history-workout";

        // Datum formatieren
        const date = new Date(workout.date).toLocaleDateString("de-DE");

        // Anklickbare Überschrift erstellen
        const summary = document.createElement("summary");

        summary.textContent =
            `${date} – ${workout.exercises.length} Übungen`;

        workoutElement.appendChild(summary);


        // ==========================================
        // EINZELNE ÜBUNGEN ANZEIGEN
        // ==========================================

        workout.exercises.forEach(function(exercise, exerciseIndex) {

            // Eigenen Bereich für die Übung erstellen
            const exerciseElement = document.createElement("div");
            exerciseElement.className = "history-exercise";

            // Übungsnamen anzeigen
            const exerciseTitle = document.createElement("h4");
            exerciseTitle.textContent = exercise.name;

            exerciseElement.appendChild(exerciseTitle);


            
            // ==========================================
            // SÄTZE MIT BEARBEITEN-BUTTON ANZEIGEN
            // ==========================================

            exercise.sets.forEach(function(set, setIndex) {

                // Eigenen Bereich für den Satz erstellen
                const setElement = document.createElement("div");
                setElement.className = "history-set";

                // Aktuell gespeicherte Werte anzeigen
                const setText = document.createElement("span");

                setText.textContent =
                    `Satz ${setIndex + 1}: ${set.weight} kg × ${set.reps} Wiederholungen`;

                setElement.appendChild(setText);

                // Button zum Bearbeiten erstellen
                const editButton = document.createElement("button");

                editButton.type = "button";
                editButton.textContent = "Bearbeiten";
                editButton.className = "edit-set";

                // ======================================
                // KLICK AUF BEARBEITEN
                // ======================================

                editButton.addEventListener("click", function() {

                    // Verhindern, dass mehrere Formulare geöffnet werden
                    if (setElement.querySelector(".set-edit-form")) {
                        return;
                    }

                    // Eingabebereich erstellen
                    const form = document.createElement("div");
                    form.className = "set-edit-form";

                    // Eingabefeld für das Gewicht
                    const weightInput = document.createElement("input");
                    weightInput.type = "number";
                    weightInput.min = "0";
                    weightInput.step = "0.5";
                    weightInput.value = set.weight;
                    weightInput.setAttribute("aria-label", "Gewicht in kg");

                    // Eingabefeld für die Wiederholungen
                    const repsInput = document.createElement("input");
                    repsInput.type = "number";
                    repsInput.min = "1";
                    repsInput.step = "1";
                    repsInput.value = set.reps;
                    repsInput.setAttribute("aria-label", "Wiederholungen");

                    // Speichern-Button erstellen
                    const saveButton = document.createElement("button");
                    saveButton.type = "button";
                    saveButton.textContent = "Speichern";

                    // Abbrechen-Button erstellen
                    const cancelButton = document.createElement("button");
                    cancelButton.type = "button";
                    cancelButton.textContent = "Abbrechen";

                    // ======================================
                    // ÄNDERUNGEN SPEICHERN
                    // ======================================

                    saveButton.addEventListener("click", function() {

                        // Eingaben auslesen
                        const weightValue = weightInput.value;
                        const repsValue = repsInput.value;

                        const weight = Number(weightValue);
                        const reps = Number(repsValue);

                        // Ungültige Eingaben verhindern
                        if (
                            weightValue === "" ||
                            repsValue === "" ||
                            !Number.isFinite(weight) ||
                            weight < 0 ||
                            !Number.isInteger(reps) ||
                            reps < 1
                        ) {
                            alert("Bitte gültige Werte eingeben.");
                            return;
                        }

                        try {

                            // Genau diesen gespeicherten Satz aktualisieren
                            updateSetInStorage(
                                workout.id,
                                exerciseIndex,
                                setIndex,
                                weight,
                                reps
                            );

                            // Aktualisierte Historie neu anzeigen
                            displayWorkoutHistory();

                        } catch (error) {
                            console.error("Fehler beim Bearbeiten:", error);
                            alert(error.message);
                        }
                    });

                    // ======================================
                    // BEARBEITUNG ABBRECHEN
                    // ======================================

                    cancelButton.addEventListener("click", function() {

                        // Eingabeformular entfernen, ohne zu speichern
                        form.remove();
                        setText.hidden = false;
                        editButton.hidden = false;
                    });

                    // Eingabefelder und Buttons ins Formular einfügen
                    form.appendChild(weightInput);
                    form.appendChild(repsInput);
                    form.appendChild(saveButton);
                    form.appendChild(cancelButton);

                    // Bisherige Anzeige vorübergehend ausblenden
                    setText.hidden = true;
                    editButton.hidden = true;

                    // Formular beim Satz anzeigen
                    setElement.appendChild(form);
                });

                // Bearbeiten-Button zum Satz hinzufügen
                setElement.appendChild(editButton);

                // Fertigen Satz zur Übung hinzufügen
                exerciseElement.appendChild(setElement);

            });



            // ==========================================
            // BUTTON: EINZELNE ÜBUNG LÖSCHEN
            // ==========================================

            const deleteExerciseButton = document.createElement("button");

            deleteExerciseButton.type = "button";
            deleteExerciseButton.textContent = "Übung löschen";
            deleteExerciseButton.className = "delete-exercise-history";

            deleteExerciseButton.addEventListener("click", function() {

                // Sicherheitsabfrage
                const confirmed = confirm(
                    `Möchtest du "${exercise.name}" aus diesem Training entfernen?`
                );

                if (!confirmed) {
                    return;
                }

                try {
                    // Nur diese Übung entfernen
                    deleteExerciseFromWorkout(workout.id, exerciseIndex);

                    // Historie aktualisieren
                    displayWorkoutHistory();

                } catch (error) {
                    console.error("Fehler beim Löschen der Übung:", error);
                    alert(error.message);
                }
            });

            // Button zur einzelnen Übung hinzufügen
            exerciseElement.appendChild(deleteExerciseButton);

            // Fertige Übung zum Training hinzufügen
            workoutElement.appendChild(exerciseElement);

        }); // ENDE DER ÜBUNGSSCHLEIFE


        // ==========================================
        // BUTTON: GESAMTES TRAINING LÖSCHEN
        // ==========================================

        // Dieser Button steht AUSSERHALB der Übungsschleife!
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Gesamtes Training löschen";
        deleteButton.className = "delete-workout";

        deleteButton.addEventListener("click", function() {

            // Sicherheitsabfrage
            const confirmed = confirm(
                `Möchtest du das gesamte Training vom ${date} wirklich löschen?`
            );

            if (!confirmed) {
                return;
            }

            try {
                // Komplette Trainingseinheit entfernen
                deleteWorkoutFromStorage(workout.id);

                // Historie aktualisieren
                displayWorkoutHistory();

            } catch (error) {
                console.error("Fehler beim Löschen:", error);
                alert("Training konnte nicht gelöscht werden.");
            }
        });

        // Button zum gesamten Training hinzufügen
        workoutElement.appendChild(deleteButton);


        // ==========================================
        // TRAINING AUF DER WEBSEITE ANZEIGEN
        // ==========================================

        historyContainer.appendChild(workoutElement);

    } // ENDE DER TRAININGSSCHLEIFE
}


// ==========================================
// HISTORIE BEIM ÖFFNEN LADEN
// ==========================================

displayWorkoutHistory();
