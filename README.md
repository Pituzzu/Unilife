# 🎓 UniLife - UniKore Student Circle

UniLife è la piattaforma definitiva per gli studenti dell'Università Kore di Enna.

## 🛠️ Guida Passo-Passo alla Configurazione

Segui questi passaggi per rendere l'app operativa sul tuo dominio Firebase.

### 1. Configurazione Console Firebase
Vai su [console.firebase.google.com](https://console.firebase.google.com/):

1. **Authentication**:
   - Vai in `Authentication` > `Sign-in method`.
   - Clicca su `Aggiungi nuovo provider` > `Google`.
   - Abilitalo e salva.

2. **Firestore Database**:
   - Vai in `Firestore Database` > `Crea database`.
   - Scegli `Modalità Test` per iniziare subito.
   - Nella scheda `Rules` (Regole), incolla:
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /{document=**} {
           allow read, write: if request.auth != null;
         }
       }
     }
     ```
   - Clicca su `Pubblica`.

### 2. Deploy Manuale dal tuo PC
Senza usare GitHub Actions, carichi il sito direttamente dal terminale:

1. **Installa gli strumenti**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Accedi**:
   ```bash
   firebase login
   ```

3. **Inizializza (solo la prima volta)**:
   ```bash
   firebase init hosting
   ```
   - Seleziona il progetto `unilife-c6c28`.
   - Come cartella pubblica usa `.` (il punto).
   - Rispondi `Yes` a "Configure as a single-page app".

4. **Carica Online**:
   Ogni volta che vuoi aggiornare il sito:
   ```bash
   firebase deploy --only hosting
   ```

## 🔑 Accesso Utenti
- Gli utenti accedono **esclusivamente con l'email @unikorestudent.it** tramite Google.
- L'app verifica automaticamente il dominio della mail.

## 🤖 Intelligenza Artificiale (Gemini)
L'app utilizza il modello `gemini-3-flash-preview` per:
- Riassumere gli appunti PDF caricati.
- Generare piani di studio personalizzati.
- Analizzare le discussioni nelle cerchie.

## ✨ Note per lo Sviluppatore
- Il progetto non contiene la cartella `.github` per scelta: il controllo del deploy è totalmente manuale.
- Assicurati che la `API_KEY` di Google AI Studio sia configurata correttamente nel tuo ambiente.
