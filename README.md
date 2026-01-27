# 🎓 UniLife - UniKore Student Circle

UniLife è la piattaforma definitiva per gli studenti dell'Università Kore di Enna.

## 🚀 Deploy Manuale (Senza GitHub Actions)

In questa configurazione, carichi il sito direttamente dal tuo computer senza usare la cartella `.github`.

### 1. Prerequisiti
Assicurati di avere la CLI di Firebase:
```bash
npm install -g firebase-tools
```

### 2. Caricamento Online
Ogni volta che vuoi pubblicare le modifiche fatte al codice:
1. Apri il terminale nella cartella del progetto.
2. Esegui il comando di deploy:
```bash
firebase deploy --only hosting
```

## 🔑 Accesso Utenti
- Gli utenti accedono **esclusivamente con l'email @unikorestudent.it** tramite Google.
- GitHub viene usato solo come "magazzino" (repository) per il tuo codice, non per il funzionamento del sito.

## ✨ Caratteristiche
- **Privacy Core**: Accesso limitato rigorosamente al dominio UniKore.
- **Gemini AI**: Analisi intelligente degli appunti e generazione piani di studio.
- **Zero Automazioni Nascoste**: Gestisci tu quando pubblicare il sito.
