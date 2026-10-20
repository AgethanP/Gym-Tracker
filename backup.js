
// ==========================================
// GYM TRACKER - DATENSICHERUNG
// ==========================================


// ==========================================
// FUNKTION: BACKUP EXPORTIEREN
// ==========================================

function exportBackup() {

    const status = document.getElementById("backup-status");

    try {

        // 1. Alle gespeicherten Daten laden
        // Diese Funktionen stammen aus storage.js
        const workouts = loadWorkouts();
        const plans = loadPlans();

        // 2. Beide Datenbereiche zu einem Objekt zusammenfassen
        const backup = {
            version: 1,
            exportedAt: new Date().toISOString(),
            workouts: workouts,
            plans: plans
        };

        // 3. JavaScript-Objekt in formatierten JSON-Text umwandeln
        const json = JSON.stringify(backup, null, 2);

        // 4. Aus dem JSON-Text eine Datei erstellen
        const blob = new Blob(
            [json],
            { type: "application/json" }
        );

        // 5. Temporäre Adresse für die Datei erzeugen
        const url = URL.createObjectURL(blob);

        // 6. Download-Link erstellen
        const link = document.createElement("a");

        link.href = url;
        link.download = "gym-tracker-backup.json";

        // 7. Download auslösen
        document.body.appendChild(link);
        link.click();

        // 8. Temporäre Elemente wieder entfernen
        link.remove();

        // Die temporäre Datei-Adresse wieder freigeben
        setTimeout(function() {
            URL.revokeObjectURL(url);
        }, 1000);

        // Erfolgsmeldung anzeigen
        status.textContent =
            "Backup erstellt. Bitte überprüfe deine Downloads.";

        status.style.color = "green";

    } catch (error) {

        // Fehler in der Entwicklerkonsole anzeigen
        console.error("Backup-Fehler:", error);

        status.textContent =
            "Backup konnte nicht erstellt werden.";

        status.style.color = "red";
    }
}


// ==========================================
// EVENT: BACKUP HERUNTERLADEN
// ==========================================

// Beim Button-Klick die Exportfunktion ausführen
document.getElementById("export-backup")
    .addEventListener("click", exportBackup);

    
// ==========================================
// FUNKTION: BACKUP ÜBERPRÜFEN
// ==========================================

function validateBackup(backup) {

    // Prüfen, ob die Datei ein gültiges Backup-Objekt enthält
    if (
        !backup ||
        typeof backup !== "object" ||
        Array.isArray(backup) ||
        backup.version !== 1 ||
        !Array.isArray(backup.workouts) ||
        !Array.isArray(backup.plans)
    ) {
        throw new Error("Ungültiges Backup-Format.");
    }

    // Jede gespeicherte Trainingseinheit prüfen
    for (const workout of backup.workouts) {

        if (
            !workout ||
            typeof workout.date !== "string" ||
            !Number.isFinite(Date.parse(workout.date)) ||
            !Array.isArray(workout.exercises)
        ) {
            throw new Error("Ungültige Trainingsdaten.");
        }

        // Übungen und Sätze prüfen
        for (const exercise of workout.exercises) {

            if (
                !exercise ||
                typeof exercise.name !== "string" ||
                !exercise.name.trim() ||
                !Array.isArray(exercise.sets)
            ) {
                throw new Error("Ungültige Übungsdaten.");
            }

            for (const set of exercise.sets) {

                if (
                    !set ||
                    typeof set.weight !== "number" ||
                    !Number.isFinite(set.weight) ||
                    set.weight < 0 ||
                    !Number.isInteger(set.reps) ||
                    set.reps < 1
                ) {
                    throw new Error("Ungültige Satzdaten.");
                }
            }
        }
    }

    // Alle Trainingspläne prüfen
    for (const plan of backup.plans) {

        if (
            !plan ||
            typeof plan.id !== "string" ||
            !plan.id.trim() ||
            typeof plan.name !== "string" ||
            !plan.name.trim() ||
            !Array.isArray(plan.exercises) ||
            !plan.exercises.every(
                name => typeof name === "string" && name.trim()
            )
        ) {
            throw new Error("Ungültige Trainingspläne.");
        }
    }
}


// ==========================================
// FUNKTION: BACKUP IMPORTIEREN
// ==========================================

async function importBackup() {

    const fileInput = document.getElementById("backup-file");
    const status = document.getElementById("import-status");
    const importButton = document.getElementById("import-backup");

    // Prüfen, ob eine Datei ausgewählt wurde
    if (fileInput.files.length === 0) {
        status.textContent = "Bitte wähle eine Backup-Datei aus.";
        status.style.color = "red";
        return;
    }

    // Ausgewählte Datei holen
    const file = fileInput.files[0];

    // Mehrfaches Klicken während des Imports verhindern
    importButton.disabled = true;

    try {

        // 1. Datei als Text einlesen
        const fileContent = await file.text();

        // 2. JSON-Text in ein JavaScript-Objekt umwandeln
        const backup = JSON.parse(fileContent);

        // 3. Backup auf gültige Daten überprüfen
        validateBackup(backup);

        // 4. Zusammenfassung für die Sicherheitsabfrage
        const confirmed = confirm(
            `Das Backup enthält:\n\n` +
            `${backup.workouts.length} Trainingseinheiten\n` +
            `${backup.plans.length} Trainingspläne\n\n` +
            `ACHTUNG: Deine aktuellen Daten werden ersetzt.\n\n` +
            `Möchtest du fortfahren?`
        );

        // Wenn der Benutzer abbricht, nichts verändern
        if (!confirmed) {
            status.textContent = "Import abgebrochen.";
            status.style.color = "";
            return;
        }

        // 5. Vorhandene Daten für eine Rücksicherung merken
        const oldWorkouts = localStorage.getItem(STORAGE_KEY);
        const oldPlans = localStorage.getItem(PLANS_STORAGE_KEY);

        // 6. Neue Daten speichern
        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(backup.workouts)
            );

            localStorage.setItem(
                PLANS_STORAGE_KEY,
                JSON.stringify(backup.plans)
            );

        } catch (saveError) {

            // Bei einem Fehler ursprüngliche Werte wiederherstellen
            // Achtung: Auch die Rücksicherung kann fehlschlagen.
            try {
                if (oldWorkouts === null) {
                    localStorage.removeItem(STORAGE_KEY);
                } else {
                    localStorage.setItem(STORAGE_KEY, oldWorkouts);
                }

                if (oldPlans === null) {
                    localStorage.removeItem(PLANS_STORAGE_KEY);
                } else {
                    localStorage.setItem(PLANS_STORAGE_KEY, oldPlans);
                }
            } catch (restoreError) {
                console.error("Rücksicherung fehlgeschlagen:", restoreError);
                throw new Error(
                    "Speicherung und Rücksicherung fehlgeschlagen. Bitte Daten prüfen."
                );
            }

            throw saveError;
        }

        // 7. Erfolgsmeldung anzeigen
        status.textContent =
            "Backup erfolgreich wiederhergestellt!";

        status.style.color = "green";

        // Dateiauswahl zurücksetzen
        fileInput.value = "";

    } catch (error) {

        // Fehler anzeigen, ohne eine Erfolgsmeldung auszugeben
        console.error("Importfehler:", error);

        status.textContent =
            `Import fehlgeschlagen: ${error.message}`;

        status.style.color = "red";

    } finally {

        // Button auch nach einem Fehler wieder aktivieren
        importButton.disabled = false;
    }
}


// ==========================================
// EVENT: IMPORT STARTEN
// ==========================================

// Beim Klick auf den Import-Button starten
document.getElementById("import-backup")
    .addEventListener("click", importBackup);
