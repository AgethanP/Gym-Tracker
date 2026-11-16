// ==========================================
// GYM TRACKER – TRAINING ERFASSEN
// ==========================================
// Kompatibel mit storage.js und den bisherigen Einzel-/Gruppentrainings.

const exercises = document.getElementById("exercises");
const friendNames = document.getElementById("friend-names");
const friendCount = document.getElementById("friend-count");
const friendsSection = document.getElementById("friends-section");
const personTabs = document.getElementById("person-tabs");
const trainingModeInputs = document.querySelectorAll('input[name="training-mode"]');
const confirmParticipantsButton = document.getElementById("confirm-participants");
const participantsStatus = document.getElementById("participants-status");
const saveWorkoutButton = document.getElementById("save-workout");
const newWorkoutButton = document.getElementById("new-workout");

// Jede Person erhält einen stabilen internen Schlüssel. Ein Umbenennen
// verändert dadurch nicht ihre bereits eingetragenen Übungen.
const participantWorkouts = Object.create(null);
let activePerson = "Ich";
let participantsLocked = false;
let workoutCompleted = false;
let restoringDraft = false;
let exerciseCount = 0;
let uniqueSetId = 0;
let draftTimer = null;

const selectedPlanId = new URLSearchParams(window.location.search).get("plan");
const currentDraftKey = "gym-tracker-draft-v2:" +
    (selectedPlanId ? `plan:${selectedPlanId}` : "free");

// Auch bei lokalen Tests ohne crypto.randomUUID eindeutige IDs erzeugen.
function createWorkoutId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `workout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function selectedTrainingMode() {
    return document.querySelector('input[name="training-mode"]:checked').value;
}

function showSaveStatus(message, isError = false) {
    const status = document.getElementById("save-status");
    status.textContent = message;
    status.style.color = isError ? "var(--color-danger)" : "var(--color-success)";
}

function showDraftStatus(message) {
    document.getElementById("draft-status").textContent = message;
}

function updateSavedCount() {
    try {
        document.getElementById("saved-count").textContent =
            `Gespeicherte Trainings: ${loadWorkouts().length}`;
    } catch (error) {
        console.error("Trainings konnten nicht gezählt werden:", error);
        showSaveStatus("Gespeicherte Trainings konnten nicht geladen werden.", true);
    }
}

// ==========================================
// ÜBUNGEN UND SÄTZE
// ==========================================

function createSet(exerciseNumber, setNumber) {
    // Die ID bleibt auch nach dem Löschen mittlerer Sätze eindeutig.
    const id = `${exerciseNumber}-${++uniqueSetId}`;
    const set = document.createElement("div");
    set.className = "set";
    set.innerHTML = `
        <div class="set-header">
            <h4>Satz ${setNumber}</h4>
            <button type="button" class="remove-set">Entfernen</button>
        </div>
        <div class="set-inputs">
            <div class="set-field">
                <label for="weight-${id}">Gewicht (kg)</label>
                <input type="number" id="weight-${id}" min="0"
                       step="0.5" inputmode="decimal" placeholder="0">
            </div>
            <div class="set-field">
                <label for="reps-${id}">Wiederholungen</label>
                <input type="number" id="reps-${id}" min="1"
                       step="1" inputmode="numeric" placeholder="0">
            </div>
        </div>`;
    return set;
}

function addExercise() {
    exerciseCount++;
    const exercise = document.createElement("fieldset");
    exercise.className = "exercise";
    exercise.dataset.number = String(exerciseCount);
    exercise.innerHTML = `
        <legend>Übung ${exerciseCount}</legend>
        <button type="button" class="remove-exercise">Übung entfernen</button>
        <label for="exercise-${exerciseCount}">Name:</label>
        <input type="text" id="exercise-${exerciseCount}"
               list="exercise-suggestions" autocomplete="off"
               placeholder="Übung suchen oder eingeben">
        <div class="sets"></div>
        <button type="button" class="add-set">+ Satz hinzufügen</button>`;

    const nameInput = exercise.querySelector('input[type="text"]');
    const lastWorkoutInfo = document.createElement("div");
    lastWorkoutInfo.className = "last-workout-info";
    nameInput.after(lastWorkoutInfo);
    nameInput.addEventListener("input", function() {
        showLastExercise(nameInput.value, lastWorkoutInfo);
    });

    exercise.querySelector(".sets").appendChild(createSet(exerciseCount, 1));
    exercises.appendChild(exercise);
    return exercise;
}

function updateSetNumbers(exercise) {
    exercise.querySelectorAll(".set").forEach(function(set, index) {
        set.querySelector(".set-header h4").textContent = `Satz ${index + 1}`;
    });
}

function updateExerciseNumbers() {
    exercises.querySelectorAll(".exercise").forEach(function(exercise, index) {
        exercise.querySelector("legend").textContent = `Übung ${index + 1}`;
    });
}

function readVisibleExercises() {
    return [...exercises.querySelectorAll(".exercise")].map(function(exercise) {
        return {
            name: exercise.querySelector('input[type="text"]').value,
            sets: [...exercise.querySelectorAll(".set")].map(function(set) {
                return {
                    weight: set.querySelector('input[id^="weight-"]').value,
                    reps: set.querySelector('input[id^="reps-"]').value
                };
            })
        };
    });
}

function rememberCurrentPerson() {
    participantWorkouts[activePerson] = readVisibleExercises();
}

function renderPersonExercises(personKey) {
    const savedExercises = participantWorkouts[personKey];
    exercises.replaceChildren();
    exerciseCount = 0;

    if (!Array.isArray(savedExercises) || savedExercises.length === 0) {
        addExercise();
    } else {
        savedExercises.forEach(function(savedExercise) {
            const exercise = addExercise();
            const nameInput = exercise.querySelector('input[type="text"]');
            nameInput.value = savedExercise.name || "";

            const sets = exercise.querySelector(".sets");
            sets.replaceChildren();
            (Array.isArray(savedExercise.sets) ? savedExercise.sets : []).forEach(
                function(savedSet, index) {
                    const set = createSet(exercise.dataset.number, index + 1);
                    set.querySelector('input[id^="weight-"]').value = savedSet.weight ?? "";
                    set.querySelector('input[id^="reps-"]').value = savedSet.reps ?? "";
                    sets.appendChild(set);
                }
            );
            showLastExercise(nameInput.value, exercise.querySelector(".last-workout-info"));
        });
    }
    if (workoutCompleted) {
        disableCompletedInputs();
    }
}

function disableCompletedInputs() {
    exercises.querySelectorAll("input, button").forEach(function(element) {
        element.disabled = true;
    });
    document.getElementById("add-exercise").disabled = true;
}

// ==========================================
// TEILNEHMER – STABILE PLÄTZE STATT NAMENS-KEYS
// ==========================================

function listParticipants() {
    const people = [{ key: "Ich", name: "Ich" }];
    if (selectedTrainingMode() === "friends") {
        [...friendNames.querySelectorAll("input")].forEach(function(input, index) {
            people.push({
                key: `friend-${index}`,
                name: input.value.trim() || `Freund ${index + 1}`
            });
        });
    }
    return people;
}

function currentPersonName() {
    return listParticipants().find(person => person.key === activePerson)?.name || "Ich";
}

function updatePersonTabs() {
    const people = listParticipants();
    if (!people.some(person => person.key === activePerson)) {
        activePerson = "Ich";
        renderPersonExercises(activePerson);
    }

    personTabs.replaceChildren();
    people.forEach(function(person) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "person-tab";
        button.textContent = person.name;
        if (person.key === activePerson) {
            button.classList.add("active");
            button.setAttribute("aria-current", "true");
        }
        button.addEventListener("click", function() {
            if (person.key === activePerson) return;
            if (!workoutCompleted) rememberCurrentPerson();
            activePerson = person.key;
            renderPersonExercises(activePerson);
            updatePersonTabs();
            scheduleDraftSave();
        });
        personTabs.appendChild(button);
    });
}

function updateFriendInputs() {
    const oldNames = [...friendNames.querySelectorAll("input")].map(input => input.value);
    const count = Number(friendCount.value);
    friendNames.replaceChildren();

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
        input.value = oldNames[i] || "";
        field.append(label, input);
        friendNames.appendChild(field);
    }
    updatePersonTabs();
}

function updateTrainingMode() {
    friendsSection.hidden = selectedTrainingMode() !== "friends";
    if (selectedTrainingMode() === "friends" && !friendNames.querySelector("input")) {
        updateFriendInputs();
    }
    updatePersonTabs();
}

function validateParticipantNames() {
    if (selectedTrainingMode() !== "friends") return true;

    const names = [...friendNames.querySelectorAll("input")].map(input => input.value.trim());
    if (names.some(name => !name)) {
        participantsStatus.textContent = "Bitte gib zuerst alle Freundesnamen ein.";
        return false;
    }
    const normalized = ["ich", ...names.map(name => name.toLocaleLowerCase("de-DE"))];
    if (new Set(normalized).size !== normalized.length) {
        participantsStatus.textContent = "Bitte verwende unterschiedliche Namen.";
        return false;
    }
    return true;
}

function lockParticipants(saveDraft = true) {
    if (!validateParticipantNames()) return false;
    participantsLocked = true;
    trainingModeInputs.forEach(input => { input.disabled = true; });
    friendCount.disabled = true;
    friendNames.querySelectorAll("input").forEach(input => { input.disabled = true; });
    confirmParticipantsButton.disabled = true;
    confirmParticipantsButton.textContent = "Teilnehmer bestätigt ✓";
    participantsStatus.textContent = "Teilnehmer festgelegt. Du kannst jetzt trainieren.";
    updatePersonTabs();
    if (saveDraft) persistDraft();
    return true;
}

// ==========================================
// LETZTE TRAININGSWERTE UND ÜBUNGSVORSCHLÄGE
// ==========================================

function showLastExercise(exerciseName, container) {
    container.replaceChildren();
    const searchName = (exerciseName || "").trim().toLocaleLowerCase("de-DE");
    if (!searchName) return;

    let workouts;
    try {
        workouts = loadWorkouts();
    } catch (error) {
        console.error("Letzte Trainingswerte konnten nicht geladen werden:", error);
        container.textContent = "Letzte Trainingswerte konnten nicht geladen werden.";
        return;
    }

    const personName = currentPersonName();
    const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const workout of sorted) {
        let personExercises;
        if (Array.isArray(workout.participants)) {
            const person = workout.participants.find(item => item.name === personName);
            if (!person) continue;
            personExercises = person.exercises || [];
        } else {
            if (personName !== "Ich") continue;
            personExercises = workout.exercises || [];
        }
        const found = personExercises.find(item =>
            item.name.trim().toLocaleLowerCase("de-DE") === searchName
        );
        if (!found) continue;

        const heading = document.createElement("h4");
        heading.textContent = "Letztes Training";
        const date = document.createElement("p");
        date.textContent = new Date(workout.date).toLocaleDateString("de-DE");
        container.append(heading, date);
        found.sets.forEach(function(set, index) {
            const info = document.createElement("p");
            info.textContent = `Satz ${index + 1}: ${set.weight} kg × ${set.reps} Wiederholungen`;
            container.appendChild(info);
        });
        return;
    }
    container.textContent = "Noch keine Trainingswerte für diese Person und Übung vorhanden.";
}

function loadExerciseSuggestions() {
    const datalist = document.getElementById("exercise-suggestions");
    datalist.replaceChildren();
    try {
        const names = new Map();
        const collect = function(items) {
            for (const exercise of items || []) {
                if (!exercise || typeof exercise.name !== "string") continue;
                const name = exercise.name.trim();
                if (name && !names.has(name.toLocaleLowerCase("de-DE"))) {
                    names.set(name.toLocaleLowerCase("de-DE"), name);
                }
            }
        };
        for (const workout of loadWorkouts()) {
            if (Array.isArray(workout.participants)) {
                workout.participants.forEach(person => collect(person.exercises));
            } else {
                collect(workout.exercises);
            }
        }
        [...names.values()].sort((a, b) => a.localeCompare(b, "de"))
            .forEach(function(name) {
                const option = document.createElement("option");
                option.value = name;
                datalist.appendChild(option);
            });
    } catch (error) {
        console.error("Übungsvorschläge konnten nicht geladen werden:", error);
    }
}

function loadSelectedPlan() {
    if (!selectedPlanId) return;
    try {
        const plan = loadPlans().find(item => item.id === selectedPlanId);
        if (!plan) throw new Error("Trainingsplan wurde nicht gefunden.");

        participantWorkouts.Ich = plan.exercises.map(name => ({
            name,
            sets: [{ weight: "", reps: "" }]
        }));
        renderPersonExercises("Ich");
        // Im alten Code wurde versehentlich „Wer trainiert heute?“ geändert.
        document.querySelector(".training-intro h1").textContent =
            `Neues Training – ${plan.name}`;
    } catch (error) {
        console.error("Trainingsplan konnte nicht geladen werden:", error);
        showSaveStatus(error.message, true);
    }
}

// ==========================================
// ENTWÜRFE PRO TRAININGSPLAN GETRENNT SICHERN
// ==========================================

function collectWorkoutDraft() {
    rememberCurrentPerson();
    return {
        schema: 2,
        planId: selectedPlanId,
        participantsLocked,
        activePerson,
        mode: selectedTrainingMode(),
        friendNames: [...friendNames.querySelectorAll("input")].map(input => input.value),
        friendCount: Number(friendCount.value),
        participantWorkouts: structuredClone(participantWorkouts),
        exercises: readVisibleExercises()
    };
}

function persistDraft() {
    if (restoringDraft || workoutCompleted) return;
    clearTimeout(draftTimer);
    draftTimer = null;
    try {
        localStorage.setItem(currentDraftKey, JSON.stringify(collectWorkoutDraft()));
        showDraftStatus("Automatisch zwischengespeichert");
    } catch (error) {
        console.error("Zwischenspeicherung fehlgeschlagen:", error);
        showDraftStatus("Zwischenspeicherung fehlgeschlagen");
    }
}

function scheduleDraftSave() {
    if (restoringDraft || workoutCompleted) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(persistDraft, 250);
}

function clearCurrentDraft() {
    clearTimeout(draftTimer);
    draftTimer = null;
    localStorage.removeItem(currentDraftKey);
    // Ggf. verbliebenen alten Entwurf nur für denselben Kontext löschen.
    try {
        const legacy = loadWorkoutDraft();
        if (legacy && (legacy.planId || null) === selectedPlanId) {
            clearWorkoutDraft();
        }
    } catch (error) {
        console.warn("Alter Entwurf konnte nicht gelesen werden:", error);
    }
}

function readCurrentDraft() {
    const saved = localStorage.getItem(currentDraftKey);
    if (saved !== null) {
        const draft = JSON.parse(saved);
        if (!draft || !Array.isArray(draft.exercises)) {
            throw new Error("Gespeicherter Trainingsentwurf ist ungültig.");
        }
        return draft;
    }

    // Vorhandene Entwürfe aus der vorherigen App-Version nicht verlieren.
    const legacy = loadWorkoutDraft();
    if (!legacy || (legacy.planId || null) !== selectedPlanId) return null;
    localStorage.setItem(currentDraftKey, JSON.stringify(legacy));
    clearWorkoutDraft();
    return legacy;
}

function normalizeLegacyDraft(draft) {
    if (draft.schema === 2) return draft;
    const names = Array.isArray(draft.friendNames) ? draft.friendNames : [];
    const data = Object.create(null);
    const oldData = draft.participantWorkouts || {};
    data.Ich = Array.isArray(oldData.Ich) ? oldData.Ich : [];
    names.forEach(function(name, index) {
        const key = `friend-${index}`;
        if (Object.prototype.hasOwnProperty.call(oldData, name)) {
            data[key] = oldData[name];
        }
    });
    const person = names.findIndex(name => name === draft.activePerson);
    const activeKey = person === -1 ? "Ich" : `friend-${person}`;
    data[activeKey] = draft.exercises;
    return { ...draft, schema: 2, activePerson: activeKey, participantWorkouts: data };
}

function restoreWorkoutDraft() {
    let draft;
    try {
        draft = readCurrentDraft();
    } catch (error) {
        console.error("Entwurf konnte nicht gelesen werden:", error);
        showDraftStatus("Gespeicherter Entwurf konnte nicht geladen werden.");
        return;
    }
    if (!draft) return;

    restoringDraft = true;
    try {
        draft = normalizeLegacyDraft(draft);
        const savedMode = draft.mode === "friends" ? "friends" : "solo";
        document.querySelector(`input[name="training-mode"][value="${savedMode}"]`).checked = true;

        if (savedMode === "friends") {
            const names = Array.isArray(draft.friendNames) ? draft.friendNames : [];
            const count = Math.max(1, Math.min(5, Number(draft.friendCount) || names.length || 1));
            friendCount.value = String(count);
            updateFriendInputs();
            [...friendNames.querySelectorAll("input")].forEach(function(input, index) {
                input.value = names[index] || "";
            });
        }
        updateTrainingMode();

        Object.keys(participantWorkouts).forEach(key => { delete participantWorkouts[key]; });
        for (const [key, value] of Object.entries(draft.participantWorkouts || {})) {
            if (Array.isArray(value)) participantWorkouts[key] = value;
        }
        activePerson = draft.activePerson || "Ich";
        if (!listParticipants().some(person => person.key === activePerson)) {
            activePerson = "Ich";
        }
        participantWorkouts[activePerson] = draft.exercises;
        renderPersonExercises(activePerson);
        updatePersonTabs();

        if (draft.participantsLocked === true) lockParticipants(false);
        showDraftStatus("Laufendes Training wiederhergestellt");
    } catch (error) {
        console.error("Fehler beim Wiederherstellen:", error);
        showDraftStatus("Entwurf konnte nicht vollständig wiederhergestellt werden.");
    } finally {
        restoringDraft = false;
    }
}

// ==========================================
// TRAINING ABSCHLIESSEN
// ==========================================

function saveWorkout() {
    if (workoutCompleted) return;
    if (!participantsLocked) {
        showSaveStatus("Bitte bestätige zuerst die Teilnehmer.", true);
        return;
    }
    if (!validateParticipantNames()) {
        showSaveStatus("Bitte überprüfe die Teilnehmernamen.", true);
        return;
    }

    rememberCurrentPerson();
    const people = listParticipants();
    const participants = [];

    for (const person of people) {
        const savedExercises = participantWorkouts[person.key];
        if (!Array.isArray(savedExercises) || savedExercises.length === 0) {
            showSaveStatus(`Bitte füge für ${person.name} mindestens eine Übung hinzu.`, true);
            return;
        }
        const cleanExercises = [];
        for (const exercise of savedExercises) {
            const name = typeof exercise.name === "string" ? exercise.name.trim() : "";
            if (!name) {
                showSaveStatus(`Bitte gib für ${person.name} alle Übungsnamen ein.`, true);
                return;
            }
            if (!Array.isArray(exercise.sets) || exercise.sets.length === 0) {
                showSaveStatus(`${person.name}: Jede Übung benötigt mindestens einen Satz.`, true);
                return;
            }
            const cleanSets = [];
            for (const set of exercise.sets) {
                const weight = Number(set.weight);
                const reps = Number(set.reps);
                if (set.weight === "" || set.reps === "" ||
                    !Number.isFinite(weight) || weight < 0 ||
                    !Number.isInteger(reps) || reps < 1) {
                    showSaveStatus(`Bitte überprüfe die Trainingswerte von ${person.name}.`, true);
                    return;
                }
                cleanSets.push({ weight, reps });
            }
            cleanExercises.push({ name, sets: cleanSets });
        }
        participants.push({ name: person.name, exercises: cleanExercises });
    }

    const workout = {
        id: createWorkoutId(),
        date: new Date().toISOString(),
        ...(selectedTrainingMode() === "solo"
            ? { exercises: participants[0].exercises }
            : { participants })
    };

    try {
        saveWorkoutToStorage(workout);
    } catch (error) {
        console.error("Training konnte nicht gespeichert werden:", error);
        showSaveStatus("Training konnte nicht gespeichert werden.", true);
        return;
    }

    // Ab jetzt darf kein Klick einen neuen Entwurf dieses Trainings erzeugen.
    workoutCompleted = true;
    try {
        clearCurrentDraft();
        showDraftStatus("Training abgeschlossen");
    } catch (error) {
        console.error("Entwurf konnte nicht entfernt werden:", error);
        showDraftStatus("Training gespeichert, alter Entwurf konnte nicht entfernt werden.");
    }

    saveWorkoutButton.disabled = true;
    saveWorkoutButton.textContent = "Training abgeschlossen ✓";
    newWorkoutButton.hidden = false;
    disableCompletedInputs();
    showSaveStatus("Training erfolgreich gespeichert!");
    updateSavedCount();
    loadExerciseSuggestions();
}

// ==========================================
// BEDIENELEMENTE UND START
// ==========================================

document.getElementById("add-exercise").addEventListener("click", function() {
    if (workoutCompleted) return;
    addExercise();
    scheduleDraftSave();
});

exercises.addEventListener("click", function(event) {
    if (workoutCompleted) return;
    if (event.target.classList.contains("add-set")) {
        const exercise = event.target.closest(".exercise");
        const sets = exercise.querySelector(".sets");
        sets.appendChild(createSet(exercise.dataset.number, sets.children.length + 1));
        scheduleDraftSave();
    } else if (event.target.classList.contains("remove-set")) {
        const exercise = event.target.closest(".exercise");
        event.target.closest(".set").remove();
        updateSetNumbers(exercise);
        scheduleDraftSave();
    } else if (event.target.classList.contains("remove-exercise")) {
        event.target.closest(".exercise").remove();
        updateExerciseNumbers();
        scheduleDraftSave();
    }
});

exercises.addEventListener("input", scheduleDraftSave);
friendNames.addEventListener("input", function() {
    updatePersonTabs();
    scheduleDraftSave();
});

trainingModeInputs.forEach(function(input) {
    input.addEventListener("change", function() {
        rememberCurrentPerson();
        updateTrainingMode();
        scheduleDraftSave();
    });
});

friendCount.addEventListener("change", function() {
    rememberCurrentPerson();
    updateFriendInputs();
    scheduleDraftSave();
});

confirmParticipantsButton.addEventListener("click", function() {
    lockParticipants(true);
});
saveWorkoutButton.addEventListener("click", saveWorkout);
newWorkoutButton.addEventListener("click", function() {
    window.location.href = "training.html";
});

// Noch ausstehende Änderungen vor dem Verlassen zuverlässig sichern.
window.addEventListener("pagehide", function() {
    if (draftTimer !== null) persistDraft();
});
document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === "hidden" && draftTimer !== null) persistDraft();
});

// Erst DOM und Teilnehmerverwaltung vorbereiten, dann einen Plan oder
// einen vorhandenen Entwurf einsetzen.
addExercise();
updateTrainingMode();
loadExerciseSuggestions();
updateSavedCount();
loadSelectedPlan();
restoreWorkoutDraft();