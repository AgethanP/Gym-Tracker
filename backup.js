
 // ==========================================
 // GYM TRACKER – DATENSICHERUNG
 // ==========================================

 // Das bestehende Backup-Format bleibt kompatibel.
 const BACKUP_VERSION = 1;
 const MAX_BACKUP_FILE_SIZE = 10 * 1024 * 1024; // 10 MB


 // ==========================================
 // GEMEINSAME HILFSFUNKTIONEN
 // ==========================================

 function isValidText(value) {
     return typeof value === "string" && value.trim().length > 0;
 }

 function isValidObject(value) {
     return value !== null && typeof value === "object" && !Array.isArray(value);
 }

 function showBackupStatus(elementId, message, isError = false) {
     const status = document.getElementById(elementId);
     status.textContent = message;
     status.style.color = isError
         ? "var(--color-danger)"
         : "var(--color-success)";
 }


 // ==========================================
 // ÜBUNGEN UND SÄTZE PRÜFEN
 // ==========================================

 function validateExercises(exercises, context) {
     if (!Array.isArray(exercises) || exercises.length === 0) {
         throw new Error(`${context}: Es muss mindestens eine Übung vorhanden sein.`);
     }

     for (const exercise of exercises) {
         if (!isValidObject(exercise) ||
             !isValidText(exercise.name) ||
             !Array.isArray(exercise.sets) ||
             exercise.sets.length === 0) {
             throw new Error(`${context}: Ungültige Übungsdaten.`);
         }

         for (const set of exercise.sets) {
             if (!isValidObject(set) ||
                 typeof set.weight !== "number" ||
                 !Number.isFinite(set.weight) ||
                 set.weight < 0 ||
                 !Number.isInteger(set.reps) ||
                 set.reps < 1) {
                 throw new Error(`${context}: Ungültiges Gewicht oder Wiederholungszahl.`);
             }
         }
     }
 }


 // ==========================================
 // BACKUP VOLLSTÄNDIG PRÜFEN
 // ==========================================

 function validateBackup(backup) {
     if (!isValidObject(backup) ||
         backup.version !== BACKUP_VERSION ||
         !Array.isArray(backup.workouts) ||
         !Array.isArray(backup.plans)) {
         throw new Error("Ungültiges oder nicht unterstütztes Backup-Format.");
     }

     // IDs müssen eindeutig sein, damit Bearbeiten/Löschen sicher funktionieren.
     const workoutIds = new Set();

     for (const workout of backup.workouts) {
         if (!isValidObject(workout) ||
             !isValidText(workout.id) ||
             !isValidText(workout.date) ||
             !Number.isFinite(Date.parse(workout.date))) {
             throw new Error("Ungültige Trainingsdaten: ID oder Datum fehlt.");
         }

         if (workoutIds.has(workout.id)) {
             throw new Error("Das Backup enthält doppelte Trainings-IDs.");
         }
         workoutIds.add(workout.id);

         // Neue Gruppentrainings speichern Übungen pro Teilnehmer.
         if (workout.participants !== undefined) {
             if (!Array.isArray(workout.participants) ||
                 workout.participants.length === 0) {
                 throw new Error("Ein Gruppentraining hat keine gültige Teilnehmerliste.");
             }

             const participantNames = new Set();

             for (const participant of workout.participants) {
                 if (!isValidObject(participant) || !isValidText(participant.name)) {
                     throw new Error("Ungültiger Teilnehmer im Gruppentraining.");
                 }

                 const normalizedName = participant.name.trim().toLowerCase();
                 if (participantNames.has(normalizedName)) {
                     throw new Error("Ein Gruppentraining enthält doppelte Teilnehmernamen.");
                 }
                 participantNames.add(normalizedName);

                 validateExercises(
                     participant.exercises,
                     `Training von ${participant.name}`
                 );
             }
         } else {
             // Ältere Einzeltrainings speichern Übungen direkt im Training.
             validateExercises(workout.exercises, "Einzeltraining");
         }
     }

     const planIds = new Set();

     for (const plan of backup.plans) {
         if (!isValidObject(plan) ||
             !isValidText(plan.id) ||
             !isValidText(plan.name) ||
             !Array.isArray(plan.exercises) ||
             plan.exercises.length === 0 ||
             !plan.exercises.every(isValidText)) {
             throw new Error("Ungültige Trainingspläne im Backup.");
         }

         if (planIds.has(plan.id)) {
             throw new Error("Das Backup enthält doppelte Trainingsplan-IDs.");
         }
         planIds.add(plan.id);
     }
 }


 // ==========================================
 // BACKUP EXPORTIEREN
 // ==========================================

 function exportBackup() {
     try {
         // Nur diese Daten werden gesichert: Trainings und Trainingspläne.
         const backup = {
             version: BACKUP_VERSION,
             exportedAt: new Date().toISOString(),
             workouts: loadWorkouts(),
             plans: loadPlans()
         };

         // Kein Backup aus beschädigten Daten erzeugen.
         validateBackup(backup);

         const json = JSON.stringify(backup, null, 2);
         const blob = new Blob([json], { type: "application/json" });
         const url = URL.createObjectURL(blob);

         const link = document.createElement("a");
         link.href = url;
         link.download = "gym-tracker-backup.json";
         document.body.appendChild(link);
         link.click();
         link.remove();

         // Die temporäre Download-Adresse wieder freigeben.
         setTimeout(function() {
             URL.revokeObjectURL(url);
         }, 1000);

         showBackupStatus(
             "backup-status",
             "Backup erstellt. Bitte überprüfe deine Downloads."
         );
     } catch (error) {
         console.error("Backup-Fehler:", error);
         showBackupStatus(
             "backup-status",
             `Backup konnte nicht erstellt werden: ${error.message}`,
             true
         );
     }
 }


 // ==========================================
 // BACKUP IMPORTIEREN
 // ==========================================

 async function importBackup() {
     const fileInput = document.getElementById("backup-file");
     const importButton = document.getElementById("import-backup");

     if (!fileInput.files || fileInput.files.length === 0) {
         showBackupStatus("import-status", "Bitte wähle eine Backup-Datei aus.", true);
         return;
     }

     const file = fileInput.files[0];

     if (file.size > MAX_BACKUP_FILE_SIZE) {
         showBackupStatus("import-status", "Die Datei ist größer als 10 MB.", true);
         return;
     }

     importButton.disabled = true;

     try {
         const fileContent = await file.text();
         const backup = JSON.parse(fileContent);

         // VOR dem Überschreiben sämtliche Daten prüfen.
         validateBackup(backup);

         const confirmed = confirm(
             `Das Backup enthält:\n\n` +
             `${backup.workouts.length} Trainingseinheiten\n` +
             `${backup.plans.length} Trainingspläne\n\n` +
             `ACHTUNG: Deine aktuellen Trainings und Pläne werden ersetzt.\n\n` +
             `Möchtest du fortfahren?`
         );

         if (!confirmed) {
             const status = document.getElementById("import-status");
             status.textContent = "Import abgebrochen. Deine Daten wurden nicht verändert.";
             status.style.color = "var(--color-text-secondary)";
             return;
         }

         // Alte Werte sichern, um bei einem Speicherfehler zurückzurollen.
         const oldWorkouts = localStorage.getItem(STORAGE_KEY);
         const oldPlans = localStorage.getItem(PLANS_STORAGE_KEY);
         const newWorkouts = JSON.stringify(backup.workouts);
         const newPlans = JSON.stringify(backup.plans);

         try {
             localStorage.setItem(STORAGE_KEY, newWorkouts);
             localStorage.setItem(PLANS_STORAGE_KEY, newPlans);
         } catch (saveError) {
             try {
                 // Nur Werte zurücksetzen, die tatsächlich geändert wurden.
                 if (localStorage.getItem(STORAGE_KEY) !== oldWorkouts) {
                     if (oldWorkouts === null) {
                         localStorage.removeItem(STORAGE_KEY);
                     } else {
                         localStorage.setItem(STORAGE_KEY, oldWorkouts);
                     }
                 }

                 if (localStorage.getItem(PLANS_STORAGE_KEY) !== oldPlans) {
                     if (oldPlans === null) {
                         localStorage.removeItem(PLANS_STORAGE_KEY);
                     } else {
                         localStorage.setItem(PLANS_STORAGE_KEY, oldPlans);
                     }
                 }
             } catch (restoreError) {
                 console.error("Rücksicherung fehlgeschlagen:", restoreError);
                 throw new Error(
                     "Speichern und Rücksicherung fehlgeschlagen. Bitte vorhandene Daten prüfen."
                 );
             }

             throw saveError;
         }

         fileInput.value = "";
         showBackupStatus(
             "import-status",
             "Backup erfolgreich wiederhergestellt!"
         );
     } catch (error) {
         console.error("Importfehler:", error);
         showBackupStatus(
             "import-status",
             `Import fehlgeschlagen: ${error.message}`,
             true
         );
     } finally {
         importButton.disabled = false;
     }
 }


 // ==========================================
 // BUTTONS VERBINDEN
 // ==========================================

 document.getElementById("export-backup")
     .addEventListener("click", exportBackup);

 document.getElementById("import-backup")
     .addEventListener("click", importBackup);
