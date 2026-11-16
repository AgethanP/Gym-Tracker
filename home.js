
// ==========================================
// GYM TRACKER - STARTSEITE
// ==========================================

// HTML-Bereich für die gespeicherten Trainingspläne
const plansContainer = document.getElementById("saved-plans");


// ==========================================
// FUNKTION: TRAININGSPLÄNE ANZEIGEN
// ==========================================

function displayPlans() {

    // Alten Inhalt entfernen
    plansContainer.replaceChildren();

    // Gespeicherte Trainingspläne laden
    let plans;

    try {
        plans = loadPlans();
    } catch (error) {
        console.error("Fehler beim Laden der Pläne:", error);
        plansContainer.textContent =
            "Trainingspläne konnten nicht geladen werden.";
        return;
    }

    // Nachricht anzeigen, wenn noch keine Pläne existieren
    if (plans.length === 0) {
        plansContainer.textContent =
            "Du hast noch keine Trainingspläne erstellt.";
        return;
    }

    // Für jeden gespeicherten Plan eine Karte erstellen
    for (const plan of plans) {

        /*
        * Wir verwenden statt eines div-Elements einen Link.
        * Dadurch wird die gesamte Trainingsplan-Karte anklickbar.
        */
        
        // Normale Karte für den Trainingsplan erstellen
        const planCard = document.createElement("div");

        // Link zum Starten des Trainings
        const startLink = document.createElement("a");
        startLink.href = `training.html?plan=${encodeURIComponent(plan.id)}`;
        startLink.textContent = "Training starten";
        startLink.className = "plan-action";

        // Link zum Bearbeiten des Trainingsplans
        const editLink = document.createElement("a");
        editLink.href = `plan-create.html?edit=${encodeURIComponent(plan.id)}`;
        editLink.textContent = "Bearbeiten";
        editLink.className = "plan-action";


        planCard.className = "plan-card";

        // Namen des Trainingsplans anzeigen
        const planTitle = document.createElement("h3");
        planTitle.textContent = plan.name;

        // Anzahl der Übungen anzeigen
        const exerciseCount = document.createElement("p");
        exerciseCount.textContent =
            `${plan.exercises.length} Übungen`;

        // Elemente zur Karte hinzufügen
        planCard.appendChild(planTitle);
        planCard.appendChild(exerciseCount);
        
        // Beide Aktionslinks zur Karte hinzufügen
        planCard.appendChild(startLink);
        planCard.appendChild(editLink);

        // ==========================================
        // LÖSCHEN-BUTTON FÜR EINEN TRAININGSPLAN
        // ==========================================

        // Button erstellen
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Löschen";
        deleteButton.className = "delete-plan";

        // Beim Klick den ausgewählten Trainingsplan löschen
        deleteButton.addEventListener("click", function() {

            // Sicherheitsabfrage anzeigen
            const confirmed = confirm(
                `Möchtest du den Trainingsplan "${plan.name}" wirklich löschen?`
            );

            // Abbrechen, wenn der Benutzer nicht bestätigt
            if (!confirmed) {
                return;
            }

            try {
                // Plan dauerhaft aus localStorage entfernen
                deletePlanFromStorage(plan.id);

                // Startseite aktualisieren
                displayPlans();

            } catch (error) {
                console.error("Fehler beim Löschen:", error);
                alert("Trainingsplan konnte nicht gelöscht werden.");
            }
        });

        // Löschen-Button zur Trainingsplan-Karte hinzufügen
        planCard.appendChild(deleteButton);


        // Karte auf der Startseite anzeigen
        plansContainer.appendChild(planCard);
    }
}


// ==========================================
// STARTSEITE INITIALISIEREN
// ==========================================

displayPlans();


// ==========================================
// SCHRITT D1.6 – DASHBOARD-STATISTIKEN
// ==========================================

function updateDashboard() {

    // HTML-Elemente für die Kennzahlen auswählen
    const weeklyElement = document.getElementById("weekly-workouts");
    const totalElement = document.getElementById("total-workouts");

    // Gespeicherte Trainings laden
    let workouts = [];

    try {
        workouts = loadWorkouts();
    } catch (error) {
        console.error("Dashboard konnte nicht geladen werden:", error);
        weeklyElement.textContent = "–";
        totalElement.textContent = "–";
        return;
    }

    // ==========================================
    // ALLE TRAININGS ZÄHLEN
    // ==========================================

    totalElement.textContent = workouts.length;

    // ==========================================
    // TRAININGS DIESER WOCHE ZÄHLEN
    // ==========================================

    const today = new Date();

    // Heutiges Datum auf Mitternacht setzen
    const startOfWeek = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    // Montag als ersten Wochentag verwenden
    const weekday = (startOfWeek.getDay() + 6) % 7;

    // Zum Montag der aktuellen Woche zurückgehen
    startOfWeek.setDate(startOfWeek.getDate() - weekday);

    // Beginn der nächsten Woche bestimmen
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Alle Trainings dieser Woche zählen
    const weeklyWorkouts = workouts.filter(function(workout) {

        const date = new Date(workout.date);

        return (
            !Number.isNaN(date.getTime()) &&
            date >= startOfWeek &&
            date < endOfWeek
        );
    });

    weeklyElement.textContent = weeklyWorkouts.length;
}


// Dashboard beim Öffnen der Startseite aktualisieren
updateDashboard();
