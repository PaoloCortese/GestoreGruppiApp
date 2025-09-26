Gestione Gruppi & Classifica (PWA)
Questa è una Progressive Web App (PWA) in HTML, CSS e JavaScript per la gestione e la motivazione di gruppi di lavoro sui social media e recensioni (WhatsApp, ecc.).

Funzionalità Principali
Dashboard Minimalista e mobile-first (stile Apple).

Piano Editoriale Completo: Visualizzazione di 12 settimane di messaggi con tracciamento "inviato" (verde).

Gamification: Classifica segreta con calcolo automatico dei punti e assegnazione del Bonus Champion settimanale.

Invio Veloce: Pulsante "Copia Messaggio" per un rapido incolla su WhatsApp.

PWA: Installabile sulla schermata Home (iOS/Android) per un'esperienza da app nativa.

Configurazione Necessaria
L'applicazione utilizza Google Firebase (Firestore) per la persistenza dei dati. Prima di poter utilizzare l'app, devi configurare le tue credenziali nel file script.js.

1. Sostituire le Credenziali:
Nel file script.js, sostituisci i valori all'interno di const firebaseConfig con le tue credenziali reali ottenute dalla console Firebase:

const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // <--- SOSTITUISCI QUESTO
    authDomain: "gestionegruppiapp.firebaseapp.com",
    projectId: "gestionegruppiapp",
    // ... altri campi
};

2. Regole Firestore (CRITICO):
Per permettere all'app di leggere e scrivere i dati, devi impostare le regole di sicurezza nel tuo progetto Firebase (Sezione Firestore Database > Regole). Per lo sviluppo, imposta le regole in modalità test per un accesso aperto (solo per un periodo limitato, poi dovrai restringerle!):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // PER SVILUPPO!
    }
  }
}

Come Installare l'App (PWA)
Apri il link GitHub Pages dell'app nel browser Safari (su iPhone/iPad).

Tocca il pulsante Condividi (il quadrato con la freccia).

Seleziona "Aggiungi a schermata Home".
