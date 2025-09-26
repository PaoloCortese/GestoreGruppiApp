// Configurazione Firebase fornita dall'utente
// Questa configurazione è stata fornita e verificata
const firebaseConfig = {
    apiKey: "AIzaSyDBGH03QEEpBQuZXkMueTi1jBYmFlquA5U",
    authDomain: "gestionegruppiapp.firebaseapp.com",
    projectId: "gestionegruppiapp",
    storageBucket: "gestionegruppiapp.firebasestorage.app",
    messagingSenderId: "1031411761705",
    appId: "1:1031411761705:web:c0657c2b84bda0d6efd238"
};

// Inizializza Firebase usando la sintassi CDN (firebase.initializeApp)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- COSTANTI E MODELLI DI DATI ---

const POINTS = {
    RECENSIONI: 10,
    RISPOSTE: 15,
    SOCIAL_POST: 5,
    BONUS_CHAMPION: 30
};

// Testo dei criteri da copiare
const RANKING_CRITERIA_TEXT = `
--- Criteri Classifica Progetto 12 Settimane ---
L'obiettivo è ottenere il maggior numero di punti in totale. La classifica finale rimane segreta fino alla consulenza.

🎯 Punti Base
- Recensione Ottenuta: +${POINTS.RECENSIONI} punti
- Risposta a Recensione: +${POINTS.RISPOSTE} punti
- Post Social Pubblicato (su qualsiasi piattaforma): +${POINTS.SOCIAL_POST} punti

🏆 Bonus Champion Settimanale
- +${POINTS.BONUS_CHAMPION} punti bonus a chi ottiene:
  1. Il maggior numero di Recensioni con Risposta INSIEME (Recensioni a cui è stata data una risposta);
  2. OPPURE il maggior numero di Post Social Pubblicati.

*I Sondaggi/Domande del Venerdì sono obbligatori per la partecipazione, ma non generano punti extra.*
`;

// Sondaggi diretti per WhatsApp (più informali)
const SURVEY_TEMPLATES = [
    { text: "Team, come va con le recensioni? State riscontrando difficoltà a reperirne nuove? Rispondete qui sotto per un check veloce!" },
    { text: "Focus sui contenuti: Quali post state creando con più facilità? Rispondete con la lettera per darci un feedback: [A] Chi siamo (dietro le quinte/presentazione team) [B] Che facciamo (servizi/prodotti) [C] Dove siamo (location/eventi)." },
    { text: "Un check veloce sugli obiettivi: Riuscite a dedicare tempo sufficiente alle attività social e recensioni? [A] Sì, nessun problema [B] A volte è difficile [C] No, non abbastanza tempo. Dite la vostra!" }
];

// Funzione per selezionare il testo del sondaggio in base alla settimana
const getSurveyText = (week) => {
    // Usiamo il modulo 3 per ruotare i 3 sondaggi. Iniziamo da settimana 2 (indice 0)
    const index = (week - 2) % SURVEY_TEMPLATES.length; 
    return SURVEY_TEMPLATES[index].text;
};


// Modelli di messaggio con funzione per generare il testo (tutti accettano groupName e week)
const MESSAGE_TEMPLATES = {
    // Messaggi per la prima settimana: istruzioni e avvio (Tono più giovanile e diretto)
    WEEK_1: [
        { day: 'Lunedì', title: 'Start Progetto (1/2)', text: (groupName) => `Ciao Team! Iniziamo il progetto di 12 settimane per spingere la nostra presenza online. L'obiettivo è chiaro: più recensioni, più engagement social. La classifica segreta è attiva. Pronti a partire? (Gruppo: ${groupName})` },
        { day: 'Mercoledì', title: 'Istruzioni e Punteggi (2/2)', text: () => `Attenzione! Ricordate i criteri per i punti: Recensioni, Risposte e Post Social. Per registrare le vostre azioni e non perdere punti, segnalate sempre qui quando completate un task. La classifica sarà svelata alla fine!` },
        { day: 'Venerdì', title: 'Action Time (Recensioni/Social)', text: () => `Dai che è venerdì! Ultimo push per recensioni e post social. Ci servono i vostri feedback dai clienti e i vostri contenuti per chiudere la prima settimana alla grande. Forza!` },
        { day: 'Sabato', title: 'Check Settimanale', text: () => `Check finale! I punti della prima settimana verranno registrati oggi. Consultate il Piano Editoriale per vedere cosa ci aspetta la prossima settimana. Non si scherza più! 😉` }
    ],
    // Messaggi standard per le settimane 2-11
    STANDARD: [
        { day: 'Lunedì', title: 'Recensioni Focus', text: () => `Inizio settimana, si riparte! Chiedete attivamente recensioni ai clienti e, fondamentale, rispondete subito a quelle che arrivano. Ricordate: la risposta vale più punti!` },
        { day: 'Mercoledì', title: 'Social Media Challenge', text: () => `Siamo a metà! L'obiettivo è pubblicare contenuti sui canali social. Un post = punti. Condividete il link o un veloce screen qui per la registrazione.` },
        { 
            day: 'Venerdì', 
            title: 'Feedback Veloce', 
            // Sondaggio diretto WhatsApp
            text: (groupName, week) => `Attenzione Team! Feedback veloce (Settimana ${week}): ${getSurveyText(week)} Rispondete qui per un check di partecipazione!` 
        },
        { day: 'Sabato', title: 'Check Punti', text: () => `Punti registrati! I vostri risultati settimanali sono stati calcolati, inclusi i bonus champion. Caricate le batterie, la prossima settimana si ricomincia!` }
    ],
    // Messaggi per la settimana di chiusura
    WEEK_12: [
        { day: 'Lunedì', title: 'ULTIMA Settimana (1/2)', text: () => `È l'ultima settimana del nostro progetto! Dobbiamo chiudere alla grande. Massima energia su recensioni e social, ogni azione conta doppio per il totale finale. Dai!` },
        { day: 'Mercoledì', title: 'Finalizzazione Azioni', text: () => `Ultimo promemoria per completare tutte le azioni e registrare gli ultimi punti. I dati verranno finalizzati venerdì. Chi vincerà il titolo Champion?` },
        { day: 'Venerdì', title: 'Chiusura Ufficiale (2/2)', text: () => `Il progetto si chiude qui! Bravi a tutti per l'impegno. La classifica finale è bloccata. Vi contatteremo a breve per la consulenza finale dove sveleremo il vincitore!` },
        { day: 'Sabato', title: 'Archiviazione Finale', text: () => `Punti archiviati. La classifica finale è sigillata. I risultati e i vincitori saranno annunciati individualmente in consulenza. Complimenti a tutti e ci aggiorniamo prestissimo!` }
    ]
};

// Funzione di utilità per calcolare i punti totali settimanali (senza bonus)
function calculateTotalPoints(data) {
    // Calcola i punti base
    let total = (data.recensioni * POINTS.RECENSIONI) + 
                (data.risposte * POINTS.RISPOSTE);
    
    // Calcola i punti social (social è l'input totale nel form, qui viene moltiplicato per i punti)
    total += data.social.fb * POINTS.SOCIAL_POST;
    
    // Aggiunge eventuali bonus già assegnati
    total += data.bonus || 0;
    
    return total;
}

// --- FUNZIONI DI COPIA MESSAGGIO E TRACCIAMENTO ---

// Funzione per copiare il messaggio e aggiornare lo stato 'copiato' su Firebase
function copyMessageToClipboard(messageId, groupId, week, day) {
    const messageContent = document.getElementById(messageId).textContent;
    
    // Copia il testo usando document.execCommand('copy') per compatibilità
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = messageContent;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);

    // Feedback visuale
    const feedbackSpan = document.getElementById(`copied-feedback-${messageId}`);
    feedbackSpan.textContent = 'Copiato!';
    
    // Aggiorna Firebase con lo stato 'copiato'
    const messageKey = `${week}-${day}`;
    db.collection("groups").doc(groupId).update({
        [`copiedMessages.${messageKey}`]: true
    }).then(() => {
        // Aggiorna l'UI: aggiunge la classe 'copied'
        const card = document.getElementById(`card-${messageId}`);
        if (card) {
            card.classList.add('copied');
        }
        // Resetta il feedback dopo 2 secondi
        setTimeout(() => { feedbackSpan.textContent = ''; }, 2000);
    }).catch(error => {
        console.error("Errore nell'aggiornamento dello stato del messaggio:", error);
        feedbackSpan.textContent = 'Errore!';
    });
}

// --- NUOVA FUNZIONE DI ELIMINAZIONE GRUPPO ---
function deleteGroup(groupId, groupName) {
    // Usa un modal UI personalizzato in un'app reale, qui usiamo confirm() per semplicità
    if (confirm(`Sei sicuro di voler eliminare il gruppo "${groupName}"? Questa azione è irreversibile e cancellerà tutti i dati.`)) {
        db.collection("groups").doc(groupId).delete()
            .then(() => {
                alert(`Gruppo "${groupName}" eliminato con successo.`);
                renderDashboard();
            })
            .catch((error) => {
                console.error("Errore durante l'eliminazione del gruppo:", error);
                alert("Errore durante l'eliminazione del gruppo.");
            });
    }
}


// --- FUNZIONI DI NAVIGAZIONE E FETCH ---

function renderDashboard() {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `
        <div class="dashboard-container">
            <h1>Gestione Gruppi</h1>
            <section class="gruppi-attivi">
                <h2>I Miei Gruppi</h2>
                <div id="groups-list">
                    <p>Caricamento gruppi...</p>
                </div>
            </section>
            
            <nav class="barra-azioni">
                <button id="add-group-btn" class="icon-btn"><span>+</span> Nuovo Gruppo</button>
                <button id="view-ranking-btn" class="icon-btn"><span>🏆</span> Classifica</button>
            </nav>
        </div>
    `;

    document.getElementById('add-group-btn').addEventListener('click', renderNewGroupForm);
    document.getElementById('view-ranking-btn').addEventListener('click', renderRankingInterface);

    fetchGroups();
}

function fetchGroups() {
    const groupsListContainer = document.getElementById('groups-list');
    groupsListContainer.innerHTML = '';

    db.collection("groups").get().then((querySnapshot) => {
        if (querySnapshot.empty) {
            groupsListContainer.innerHTML = '<p class="info-msg">Nessun gruppo trovato. Clicca "+" per crearne uno.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const groupData = doc.data();
            const groupId = doc.id;
            
            const start = new Date(groupData.startDate);
            const today = new Date();
            const diffTime = today - start;
            const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))); 
            const currentWeek = Math.min(12, Math.ceil(diffDays / 7)); 

            const groupCard = document.createElement('div');
            groupCard.className = 'card-gruppo';
            groupCard.innerHTML = `
                <h3>${groupData.name}</h3>
                <p><strong>Stato:</strong> Settimana ${currentWeek} di 12</p>
                <p><strong>Membri:</strong> ${groupData.members.length}</p>
                <button data-group-id="${groupId}" class="view-messages-btn">Visualizza Piano Settimanale</button>
            `;
            
            groupsListContainer.appendChild(groupCard);
        });

        document.querySelectorAll('.view-messages-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const groupId = e.target.getAttribute('data-group-id');
                renderMessagePlanner(groupId);
            });
        });

    }).catch(error => {
        console.error("Errore nel recupero dei gruppi: ", error);
        groupsListContainer.innerHTML = '<p class="error-msg">Errore nel caricamento dei dati.</p>';
    });
}


// --- FUNZIONE PER LA CREAZIONE NUOVO GRUPPO ---

function renderNewGroupForm() {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `
        <div class="form-container">
            <button class="back-btn" onclick="renderDashboard()">← Torna alla Dashboard</button>
            <h2>Crea Nuovo Gruppo</h2>
            <div class="form-field">
                <label for="group-name">Nome Gruppo:</label>
                <input type="text" id="group-name" placeholder="Es. Team Pizzeria" required>
            </div>
            <div class="form-field">
                <label for="members">Membri (uno per riga):</label>
                <textarea id="members" placeholder="Marco\nGiulia\nLuca" required></textarea>
            </div>
            <div class="form-field">
                <label for="start-date">Data di Inizio Progetto:</label>
                <input type="date" id="start-date" required>
            </div>
            <button id="create-group-btn">Crea Gruppo</button>
        </div>
    `;

    document.getElementById('create-group-btn').addEventListener('click', () => {
        const groupName = document.getElementById('group-name').value;
        const membersText = document.getElementById('members').value;
        const startDate = document.getElementById('start-date').value;

        if (!groupName || !membersText || !startDate) {
            alert('Per favor, compila tutti i campi.');
            return;
        }

        const membersArray = membersText.split('\n')
            .map(name => name.trim())
            .filter(name => name)
            .map(name => ({
                name: name,
                totalPoints: 0,
                // Inizializza i dati settimanali per 12 settimane
                weeklyPoints: Array(12).fill(0).map((_, i) => ({
                    week: i + 1,
                    recensioni: 0,
                    risposte: 0,
                    social: { fb: 0, ig: 0, tiktok: 0, link: 0 },
                    bonus: 0,
                    total: 0
                }))
            }));

        const newGroup = {
            name: groupName,
            startDate: startDate,
            members: membersArray,
            copiedMessages: {} // Inizializza il tracciamento dei messaggi
        };

        db.collection("groups").add(newGroup)
            .then(() => {
                alert("Gruppo creato con successo! Verrai reindirizzato alla Dashboard.");
                renderDashboard();
            })
            .catch((error) => {
                console.error("Errore nel salvataggio: ", error);
                alert("Errore nel salvataggio del gruppo.");
            });
    });
}


// --- FUNZIONE PER LA GENERAZIONE DEI MESSAGGI (PIANO EDITORIALE COMPLETO) ---

function renderMessagePlanner(groupId) {
    db.collection("groups").doc(groupId).get().then((doc) => {
        if (!doc.exists) {
            alert("Gruppo non trovato.");
            renderDashboard();
            return;
        }
        const groupData = doc.data();
        const appContainer = document.getElementById('app');

        let plannerHTML = '';
        const copied = groupData.copiedMessages || {}; // Mappa dei messaggi copiati

        // Genera tutte le 12 settimane (Piano Editoriale Completo)
        for (let w = 1; w <= 12; w++) {
            let templates;
            if (w === 1) {
                templates = MESSAGE_TEMPLATES.WEEK_1;
            } else if (w === 12) {
                templates = MESSAGE_TEMPLATES.WEEK_12;
            } else {
                templates = MESSAGE_TEMPLATES.STANDARD;
            }

            let messagesHTML = templates.map((msg, index) => {
                const messageId = `msg-${groupId}-${w}-${index}`;
                const messageKey = `${w}-${msg.day}`;
                const isCopied = copied[messageKey];
                const cardClass = isCopied ? 'message-card copied' : 'message-card';

                // Passa il nome del gruppo e la settimana al generatore di testo
                const messageText = msg.text(groupData.name, w);
                
                return `
                    <div class="${cardClass}" id="card-${messageId}">
                        <h3>${msg.title} - ${msg.day}</h3>
                        <div class="message-content" id="${messageId}">${messageText}</div>
                        <button class="copy-btn" 
                                onclick="copyMessageToClipboard('${messageId}', '${groupId}', ${w}, '${msg.day}')">
                            ${isCopied ? 'Riscopia' : 'Copia Messaggio'}
                        </button>
                        <span id="copied-feedback-${messageId}" class="copied-feedback"></span>
                    </div>
                `;
            }).join('');

            plannerHTML += `
                <section class="planner-section">
                    <h2>Settimana ${w}</h2>
                    ${messagesHTML}
                </section>
            `;
        }

        appContainer.innerHTML = `
            <div class="message-planner-container">
                <div class="action-bar-top">
                    <button class="back-btn" onclick="renderDashboard()">← Torna alla Dashboard</button>
                    <button class="delete-btn" onclick="deleteGroup('${groupId}', '${groupData.name}')">🗑️ Elimina Gruppo</button>
                </div>
                <h2>Piano Editoriale: ${groupData.name} (12 Settimane)</h2>
                <p class="status-msg">Il verde indica i messaggi già inviati. I messaggi possono essere copiati in qualsiasi ordine.</p>
                
                ${plannerHTML}
            </div>
        `;

    }).catch(error => {
        console.error("Errore nel recupero dei dati del gruppo: ", error);
        alert("Errore nel caricamento del planner.");
    });
}


// --- GESTIONE CLASSIFICA E ASSEGNAZIONE PUNTEGGI ---

// Funzione per mostrare l'interfaccia di selezione gruppo/settimana
function renderRankingInterface() {
    const appContainer = document.getElementById('app');
    appContainer.innerHTML = `
        <div class="ranking-selector-container">
            <button class="back-btn" onclick="renderDashboard()">← Torna alla Dashboard</button>
            <h2>Gestione Classifica</h2>
            <p>Seleziona il gruppo e la settimana da aggiornare.</p>

            <div class="form-field">
                <label for="ranking-group-select">Seleziona Gruppo:</label>
                <select id="ranking-group-select" class="group-select" required>
                    <option value="">-- Seleziona --</option>
                </select>
            </div>
            
            <button id="copy-criteria-btn" class="copy-btn" style="margin-top: 10px;">📋 Copia Criteri Classifica</button>

            <div id="week-selector-container" style="display:none;">
                 <label for="week-select">Seleziona Settimana:</label>
                 <select id="week-select" class="week-select" required>
                     ${Array(12).fill(0).map((_, i) => `<option value="${i+1}">Settimana ${i+1}</option>`).join('')}
                 </select>
            </div>

            <div id="score-entry-table"></div>
            <div id="final-ranking-output"></div>
        </div>
    `;

    const groupSelect = document.getElementById('ranking-group-select');
    const weekSelectContainer = document.getElementById('week-selector-container');
    const weekSelect = document.getElementById('week-select');
    const scoreTableContainer = document.getElementById('score-entry-table');


    // 1. Popola il selettore dei gruppi
    db.collection("groups").get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.data().name;
            groupSelect.appendChild(option);
        });
    });

    // Listener per copiare i criteri
    document.getElementById('copy-criteria-btn').addEventListener('click', () => {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = RANKING_CRITERIA_TEXT;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);
        alert('Criteri di Classifica copiati negli appunti!');
    });


    // 2. Listener per la selezione del gruppo
    groupSelect.addEventListener('change', () => {
        const groupId = groupSelect.value;
        if (groupId) {
            weekSelectContainer.style.display = 'block';
            weekSelect.value = ''; 
            scoreTableContainer.innerHTML = '';
        } else {
            weekSelectContainer.style.display = 'none';
        }
        document.getElementById('final-ranking-output').innerHTML = ''; 
    });

    // 3. Listener per la selezione della settimana
    weekSelect.addEventListener('change', () => {
        const groupId = groupSelect.value;
        const weekNumber = parseInt(weekSelect.value);
        document.getElementById('final-ranking-output').innerHTML = '';
        if (groupId && weekNumber) {
            loadWeeklyScores(groupId, weekNumber);
        } else {
            scoreTableContainer.innerHTML = '';
        }
    });

    // Aggiunto pulsante per visualizzare la classifica finale (segreta)
    const viewFinalRankingBtn = document.createElement('button');
    viewFinalRankingBtn.textContent = 'Visualizza Classifica Totale (Segreta)';
    viewFinalRankingBtn.style.marginTop = '20px';
    viewFinalRankingBtn.addEventListener('click', () => {
        if (groupSelect.value) {
            displayFinalRanking(groupSelect.value);
        } else {
            alert("Seleziona prima un gruppo.");
        }
    });
    appContainer.querySelector('.ranking-selector-container').appendChild(viewFinalRankingBtn);
}


// Funzione per mostrare la classifica finale totale
function displayFinalRanking(groupId) {
    db.collection("groups").doc(groupId).get().then(doc => {
        if (!doc.exists) return;
        
        const groupData = doc.data();
        const members = groupData.members;
        
        // Ordina i membri per punti totali
        members.sort((a, b) => b.totalPoints - a.totalPoints);

        let rankingHTML = '<h3>Classifica Totale (Segreta)</h3>';
        rankingHTML += '<p>Questa classifica mostra i punti totali accumulati da tutti i membri. Comunica i risultati in consulenza!</p>';
        rankingHTML += '<ol>';
        
        members.forEach((member) => {
            rankingHTML += `<li>${member.name}: <strong>${member.totalPoints} punti</strong></li>`;
        });
        
        rankingHTML += '</ol>';
        
        document.getElementById('final-ranking-output').innerHTML = rankingHTML;
    }).catch(error => {
        console.error("Errore nel recupero della classifica finale:", error);
    });
}


// Funzione per caricare i dati della settimana e renderizzare la tabella di input
function loadWeeklyScores(groupId, weekNumber) {
    const scoreTableContainer = document.getElementById('score-entry-table');
    scoreTableContainer.innerHTML = 'Caricamento dati...';

    db.collection("groups").doc(groupId).get().then(doc => {
        if (!doc.exists) return;
        
        const groupData = doc.data();
        const members = groupData.members;
        
        let tableHTML = `
            <h3>Dati Settimana ${weekNumber}</h3>
            <p class="ranking-info">
                <strong>Punti:</strong> Recensioni (+${POINTS.RECENSIONI}pt), Risposte (+${POINTS.RISPOSTE}pt), Social Post (+${POINTS.SOCIAL_POST}pt).<br>
                <strong>Bonus Champion:</strong> +${POINTS.BONUS_CHAMPION}pt per il leader di Recensioni con Risposta o Post Social.
            </p>
            <table class="score-table">
                <thead>
                    <tr>
                        <th>Membro</th>
                        <th>Recensioni Ottenute</th>
                        <th>Risposte Scritte</th>
                        <th>Post Social Pubblicati (Totale)</th>
                        <th>Punti Settimanali (Anteprima)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        members.forEach((member, memberIndex) => {
            // Trova i dati specifici per la settimana
            const weeklyData = member.weeklyPoints.find(wp => wp.week === weekNumber) || { recensioni: 0, risposte: 0, social: { fb: 0, ig: 0, tiktok: 0, link: 0 }, bonus: 0, total: 0 };
            
            const socialTotal = weeklyData.social.fb; // L'input social è salvato in fb per semplicità di calcolo
            
            // Dati per l'anteprima
            const previewData = { ...weeklyData, bonus: 0 }; 

            tableHTML += `
                <tr data-member-index="${memberIndex}">
                    <td><strong>${member.name}</strong></td>
                    <td><input type="number" min="0" value="${weeklyData.recensioni}" class="input-recensioni"></td>
                    <td><input type="number" min="0" value="${weeklyData.risposte}" class="input-risposte"></td>
                    <td><input type="number" min="0" value="${socialTotal}" class="input-social"></td>
                    <td class="weekly-total-cell" id="preview-total-${memberIndex}">${calculateTotalPoints(previewData)}</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
            <button id="save-scores-btn" class="save-btn">Salva e Calcola Classifica</button>
        `;

        scoreTableContainer.innerHTML = tableHTML;
        
        // Aggiunge listener per il salvataggio
        document.getElementById('save-scores-btn').addEventListener('click', () => {
            saveWeeklyScores(groupId, weekNumber, groupData);
        });

        // Aggiungi listener per aggiornare l'anteprima del punteggio
        document.querySelectorAll('.input-recensioni, .input-risposte, .input-social').forEach(input => {
            input.addEventListener('input', (e) => {
                const row = e.target.closest('tr');
                const recensioni = parseInt(row.querySelector('.input-recensioni').value) || 0;
                const risposte = parseInt(row.querySelector('.input-risposte').value) || 0;
                const socialTotal = parseInt(row.querySelector('.input-social').value) || 0;

                const previewData = { 
                    recensioni, 
                    risposte, 
                    social: { fb: socialTotal, ig: 0, tiktok: 0, link: 0 },
                    bonus: 0 // Anteprima senza bonus
                };
                row.querySelector('.weekly-total-cell').textContent = calculateTotalPoints(previewData);
            });
        });

    }).catch(error => {
        console.error("Errore nel caricamento dei punteggi: ", error);
        scoreTableContainer.innerHTML = `<p class="error-msg">Errore nel caricamento dei dati: ${error.message}</p>`;
    });
}

// Funzione per salvare i punteggi, calcolare il bonus e aggiornare Firestore
function saveWeeklyScores(groupId, weekNumber, groupData) {
    const updatedMembers = groupData.members.map(m => ({ ...m })); 

    let maxRespondedReviews = -1;
    let maxSocialPosts = -1;
    
    // 1. Aggiorna i dati con gli input e trova i massimi per il bonus
    document.querySelectorAll('.score-table tbody tr').forEach(row => {
        const index = parseInt(row.getAttribute('data-member-index'));
        const member = updatedMembers[index];

        const recensioni = parseInt(row.querySelector('.input-recensioni').value) || 0;
        const risposte = parseInt(row.querySelector('.input-risposte').value) || 0;
        const socialTotal = parseInt(row.querySelector('.input-social').value) || 0;

        // Resetta il bonus prima del ricalcolo
        member.weeklyPoints[weekNumber - 1].bonus = 0; 
        
        // Aggiorna i dati della settimana
        member.weeklyPoints[weekNumber - 1].recensioni = recensioni;
        member.weeklyPoints[weekNumber - 1].risposte = risposte;
        member.weeklyPoints[weekNumber - 1].social = { fb: socialTotal, ig: 0, tiktok: 0, link: 0 }; 

        // Metriche per il Bonus Champion
        const respondedReviewsCount = Math.min(recensioni, risposte);
        const totalSocialPostsCount = socialTotal;

        if (respondedReviewsCount > maxRespondedReviews) maxRespondedReviews = respondedReviewsCount;
        if (totalSocialPostsCount > maxSocialPosts) maxSocialPosts = totalSocialPostsCount;
    });

    // 2. Assegna il Bonus Champion
    document.querySelectorAll('.score-table tbody tr').forEach(row => {
        const index = parseInt(row.getAttribute('data-member-index'));
        const member = updatedMembers[index];
        const data = member.weeklyPoints[weekNumber - 1];

        const respondedReviewsCount = Math.min(data.recensioni, data.risposte);
        const totalSocialPostsCount = data.social.fb;
        
        // Assegna il bonus se il membro è il migliore in una delle due categorie (solo se il conteggio è > 0)
        if (maxRespondedReviews > 0 && respondedReviewsCount === maxRespondedReviews) {
            data.bonus = POINTS.BONUS_CHAMPION;
        } else if (maxSocialPosts > 0 && totalSocialPostsCount === maxSocialPosts) {
             // Assegna il bonus solo se non è stato già assegnato per le recensioni con risposta
            if (data.bonus === 0) { 
                data.bonus = POINTS.BONUS_CHAMPION;
            }
        }
        
        // Calcola il totale settimanale finale
        data.total = calculateTotalPoints(data);
    });

    // 3. Ricalcola Punti Totali di tutti i membri e aggiorna il documento
    updatedMembers.forEach(member => {
        member.totalPoints = member.weeklyPoints.reduce((acc, curr) => acc + curr.total, 0);
    });
    
    // 4. Salva su Firestore
    db.collection("groups").doc(groupId).update({ members: updatedMembers })
        .then(() => {
            alert('Punteggi salvati e classifica aggiornata (segreta)!');
            loadWeeklyScores(groupId, weekNumber); // Ricarica la tabella con i totali aggiornati
        })
        .catch(error => {
            console.error('Errore nel salvataggio dei punteggi:', error);
            alert('Errore durante il salvataggio.');
        });
}

// Avvia l'app
document.addEventListener('DOMContentLoaded', () => {
    // Rende la funzione di copia globale per l'onclick nel HTML generato
    window.copyMessageToClipboard = copyMessageToClipboard;
    window.deleteGroup = deleteGroup; // Rende la funzione di eliminazione globale
    renderDashboard();
});

