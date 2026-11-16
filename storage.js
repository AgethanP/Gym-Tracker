
 // ==========================================
 // GYM TRACKER – DATENSPEICHERUNG
 // ==========================================

 // Namen der bestehenden Speicherbereiche unbedingt beibehalten.
 // So bleiben bereits gespeicherte Trainings und Pläne erhalten.
 const STORAGE_KEY = "gym-tracker-workouts";
 const PLANS_STORAGE_KEY = "gym-tracker-plans";
 const DRAFT_STORAGE_KEY = "gym-tracker-draft";


 // ==========================================
 // GEMEINSAME HILFSFUNKTIONEN
 // ==========================================

 function readStoredList(key, description) {
     const savedData = localStorage.getItem(key);

     if (savedData === null) {
         return [];
     }

     let data;

     try {
         data = JSON.parse(savedData);
     } catch (error) {
         // Beschädigte Daten nicht durch eine leere Liste überschreiben.
         throw new Error(`${description} konnten nicht gelesen werden (ungültiges JSON).`);
     }

     if (!Array.isArray(data)) {
         throw new Error(`${description} haben ein ungültiges Speicherformat.`);
     }

     return data;
 }

 function writeStoredList(key, list) {
     localStorage.setItem(key, JSON.stringify(list));
 }

 function isNonEmptyText(value) {
     return typeof value === "string" && value.trim() !== "";
 }

 function isRecord(value) {
     return value !== null && typeof value === "object" && !Array.isArray(value);
 }

 function assertIndex(index, length, label) {
     if (!Number.isInteger(index) || index < 0 || index >= length) {
         throw new Error(`${label} nicht gefunden.`);
     }
 }

 function assertValidSetValues(weight, reps) {
     if (!Number.isFinite(weight) || weight < 0 ||
         !Number.isInteger(reps) || reps < 1) {
         throw new Error("Ungültiges Gewicht oder ungültige Wiederholungszahl.");
     }
 }

 function assertValidExercises(exercises) {
     if (!Array.isArray(exercises) || exercises.length === 0) {
         throw new Error("Ein Training benötigt mindestens eine Übung.");
     }

     for (const exercise of exercises) {
         if (!isRecord(exercise) || !isNonEmptyText(exercise.name) ||
             !Array.isArray(exercise.sets) || exercise.sets.length === 0) {
             throw new Error("Ungültige Übung oder fehlende Sätze.");
         }

         for (const set of exercise.sets) {
             if (!isRecord(set)) {
                 throw new Error("Ungültiger Trainingssatz.");
             }
             assertValidSetValues(set.weight, set.reps);
         }
     }
 }

 function assertValidWorkout(workout) {
     if (!isRecord(workout) || !isNonEmptyText(workout.id) ||
         !isNonEmptyText(workout.date) ||
         !Number.isFinite(Date.parse(workout.date))) {
         throw new Error("Training hat keine gültige ID oder kein gültiges Datum.");
     }

     if (workout.participants !== undefined) {
         if (!Array.isArray(workout.participants) ||
             workout.participants.length === 0) {
             throw new Error("Gruppentraining benötigt Teilnehmer.");
         }

         const names = new Set();

         for (const person of workout.participants) {
             if (!isRecord(person) || !isNonEmptyText(person.name)) {
                 throw new Error("Ungültiger Teilnehmername.");
             }

             const name = person.name.trim().toLowerCase();
             if (names.has(name)) {
                 throw new Error("Teilnehmernamen müssen unterschiedlich sein.");
             }
             names.add(name);
             assertValidExercises(person.exercises);
         }
     } else {
         assertValidExercises(workout.exercises);
     }
 }

 function assertValidPlan(plan) {
     if (!isRecord(plan) || !isNonEmptyText(plan.id) ||
         !isNonEmptyText(plan.name) || !Array.isArray(plan.exercises) ||
         plan.exercises.length === 0 ||
         !plan.exercises.every(isNonEmptyText)) {
         throw new Error("Ungültiger Trainingsplan.");
     }
 }

 function findWorkout(workouts, workoutId) {
     if (!isNonEmptyText(workoutId)) {
         throw new Error("Training hat keine gültige ID.");
     }

     const workout = workouts.find(item => item && item.id === workoutId);
     if (!workout) {
         throw new Error("Training nicht gefunden.");
     }
     return workout;
 }

 function findPerson(workout, personIndex) {
     if (!Array.isArray(workout.participants)) {
         throw new Error("Kein Gruppentraining gefunden.");
     }

     assertIndex(personIndex, workout.participants.length, "Person");
     return workout.participants[personIndex];
 }

 function findExercise(exercises, exerciseIndex) {
     if (!Array.isArray(exercises)) {
         throw new Error("Ungültige Übungsdaten.");
     }

     assertIndex(exerciseIndex, exercises.length, "Übung");
     return exercises[exerciseIndex];
 }

 function findSet(exercise, setIndex) {
     if (!exercise || !Array.isArray(exercise.sets)) {
         throw new Error("Ungültige Satzdaten.");
     }

     assertIndex(setIndex, exercise.sets.length, "Satz");
     return exercise.sets[setIndex];
 }


 // ==========================================
 // TRAININGS LADEN, SPEICHERN UND LÖSCHEN
 // ==========================================

 function loadWorkouts() {
     return readStoredList(STORAGE_KEY, "Trainingsdaten");
 }

 function saveWorkoutToStorage(workout) {
     assertValidWorkout(workout);

     const workouts = loadWorkouts();
     if (workouts.some(item => item && item.id === workout.id)) {
         throw new Error("Dieses Training wurde bereits gespeichert.");
     }

     workouts.push(workout);
     writeStoredList(STORAGE_KEY, workouts);
 }

 function deleteWorkoutFromStorage(workoutId) {
     const workouts = loadWorkouts();
     findWorkout(workouts, workoutId);

     writeStoredList(
         STORAGE_KEY,
         workouts.filter(workout => workout.id !== workoutId)
     );
 }

 function deleteExerciseFromWorkout(workoutId, exerciseIndex) {
     const workouts = loadWorkouts();
     const workout = findWorkout(workouts, workoutId);

     if (Array.isArray(workout.participants)) {
         throw new Error("Für Gruppentrainings die Person auswählen.");
     }

     findExercise(workout.exercises, exerciseIndex);

     if (workout.exercises.length === 1) {
         throw new Error(
             "Die letzte Übung kann nicht entfernt werden. Lösche stattdessen das gesamte Training."
         );
     }

     workout.exercises.splice(exerciseIndex, 1);
     writeStoredList(STORAGE_KEY, workouts);
 }

 function updateSetInStorage(workoutId, exerciseIndex, setIndex, weight, reps) {
     assertValidSetValues(weight, reps);

     const workouts = loadWorkouts();
     const workout = findWorkout(workouts, workoutId);

     if (Array.isArray(workout.participants)) {
         throw new Error("Für Gruppentrainings die Person auswählen.");
     }

     const exercise = findExercise(workout.exercises, exerciseIndex);
     const set = findSet(exercise, setIndex);

     set.weight = weight;
     set.reps = reps;
     writeStoredList(STORAGE_KEY, workouts);
 }


 // ==========================================
 // GRUPPENTRAININGS BEARBEITEN
 // ==========================================

 function updateGroupSetInStorage(
     workoutId, personIndex, exerciseIndex, setIndex, weight, reps
 ) {
     assertValidSetValues(weight, reps);

     const workouts = loadWorkouts();
     const person = findPerson(findWorkout(workouts, workoutId), personIndex);
     const exercise = findExercise(person.exercises, exerciseIndex);
     const set = findSet(exercise, setIndex);

     set.weight = weight;
     set.reps = reps;
     writeStoredList(STORAGE_KEY, workouts);
 }

 function deleteGroupExerciseFromWorkout(workoutId, personIndex, exerciseIndex) {
     const workouts = loadWorkouts();
     const person = findPerson(findWorkout(workouts, workoutId), personIndex);
     findExercise(person.exercises, exerciseIndex);

     if (person.exercises.length === 1) {
         throw new Error("Die letzte Übung einer Person kann nicht gelöscht werden.");
     }

     person.exercises.splice(exerciseIndex, 1);
     writeStoredList(STORAGE_KEY, workouts);
 }


 // ==========================================
 // TRAININGSPLÄNE LADEN UND VERWALTEN
 // ==========================================

 function loadPlans() {
     return readStoredList(PLANS_STORAGE_KEY, "Trainingspläne");
 }

 function savePlanToStorage(plan) {
     assertValidPlan(plan);

     const plans = loadPlans();
     if (plans.some(item => item && item.id === plan.id)) {
         throw new Error("Dieser Trainingsplan existiert bereits.");
     }

     plans.push(plan);
     writeStoredList(PLANS_STORAGE_KEY, plans);
 }

 function updatePlanInStorage(updatedPlan) {
     assertValidPlan(updatedPlan);

     const plans = loadPlans();
     const index = plans.findIndex(item => item && item.id === updatedPlan.id);
     if (index === -1) {
         throw new Error("Trainingsplan nicht gefunden.");
     }

     plans[index] = updatedPlan;
     writeStoredList(PLANS_STORAGE_KEY, plans);
 }

 function deletePlanFromStorage(planId) {
     const plans = loadPlans();
     if (!isNonEmptyText(planId) ||
         !plans.some(item => item && item.id === planId)) {
         throw new Error("Trainingsplan nicht gefunden.");
     }

     writeStoredList(
         PLANS_STORAGE_KEY,
         plans.filter(plan => plan.id !== planId)
     );
 }


 // ==========================================
 // LAUFENDES TRAINING ZWISCHENSPEICHERN
 // ==========================================

 // Vorerst bleibt der bisherige Entwurf-Speicherplatz erhalten.
 // Mehrere getrennte Entwürfe setzen wir zusammen mit script.js um.
 function saveWorkoutDraft(draft) {
     if (!isRecord(draft) || !Array.isArray(draft.exercises)) {
         throw new Error("Ungültiger Trainingsentwurf.");
     }

     localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
 }

 function loadWorkoutDraft() {
     const savedData = localStorage.getItem(DRAFT_STORAGE_KEY);
     if (savedData === null) {
         return null;
     }

     let draft;
     try {
         draft = JSON.parse(savedData);
     } catch (error) {
         throw new Error("Trainingsentwurf konnte nicht gelesen werden.");
     }

     if (!isRecord(draft) || !Array.isArray(draft.exercises)) {
         throw new Error("Gespeicherter Trainingsentwurf ist ungültig.");
     }

     return draft;
 }

 function clearWorkoutDraft() {
     localStorage.removeItem(DRAFT_STORAGE_KEY);
 }
