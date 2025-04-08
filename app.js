//importiert alle benötigten Module
const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt'); //zur verschlüsselung der Passwörter
const jwt = require('jsonwebtoken'); //dient zur dauerhaften Anmeldung eines Nutzers (via Cookies)
const cookieParser = require('cookie-parser'); //damit kann man Cookies setzen und löschen
require('dotenv').config();
const bodyParser = require('body-parser');

const session = require('express-session');

//Stellt ejs als View Engine ein
app.set("view engine", "ejs"); //dient zur dynamischen generierung von Webinhalten

app.use(bodyParser.json());

app.use(cookieParser()); //sagt der App dass sie den Cookie Parser nutzen soll

app.use(express.urlencoded({ extended: false })); //formatiert JSON in ein Format, dass das weiterverarbeiten erleichtert

app.use(express.static(path.join(__dirname, 'public'))); //Sagt dem Projekt wo es die CSS und JavaScript Dateien findet.


app.set("views", path.join(__dirname, "views")); //Sagt dem Projekt wo es die einzelnen Unterseiten wie bspw. Anmeldung oder die Startseite findet

const PORT = 3000; //Legt fest auf welchem Port die Webanwendung laufen soll. In der Regel ist das Port 3000, es könnte aber auch jeder andere sein.
app.listen(PORT, () => { //Startet einen lokalen Webserver
    console.log(`Server started on port ${PORT}`);
});

const SECRET_KEY = process.env.SECRET_KEY; //Dient zur erzeugung eines sicheren Tokens, damit der Nutzer dauerhaft angemeldet bleibt

//Prüft ob ein Nutzer angemeldet ist. Wenn ja, hat er einen Token und darf den Inhalt sehen, wenn nein, hat er keinen Token und darf deshalb nicht den Inhalt sehen. Es ist quasi der Türsteher.
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token; // Liest den Token aus dem entsprechenden Cookie aus (falls er vorhanden ist)
    if (!token) return res.status(401).json({ message: "Kein Token, Zugriff verweigert" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Ungültiges Token" });
    }
};

//Route zur Startseite
app.get('/', (req, res) => {
    const token = req.cookies.token; // Liest den Token aus dem Cookie aus (falls er vorhanden ist)

    if (!token) {
        // Wenn kein Token vorhanden ist, wird die allgemeine "index"-Seite angezeigt
        return res.render('index');
    }

    try {
        // Wenn ein Token vorhanden ist, wird es überprüft
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;

        // Wenn der Token gültig ist, wird die gesicherte "secure/index"-Seite angezeigt
        return res.render('./secure/index');
    } catch (error) {
        // Wenn das Token ungültig ist, wird die allgemeine "index"-Seite angezeigt
        return res.render('index');
    }
});

//Route zur Anmeldeseite
app.get('/login', (req, res) => {
    res.render('login');//Schickt die .ejs Datei (die Website) an den Kunden
});

//Route zur Registrierungsseite
app.get('/register', (req, res) => {
    res.render('register');//Schickt die .ejs Datei (die Website) an den Kunden
});

const mysql = require("mysql2"); //importiert das Modul "mysql2"
const con = mysql.createConnection({ //Erzeugt eine Verbindung zum SQL Server
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

//Route mit der man einen neuen Nutzer anlegen kann. Hier verwendet man app.post anstatt app.get, da app.post die eingegebenen Daten im Body, für den Nutzer unsichtbar, versendet.
app.post('/register', (req, res) => {
    console.log(req.body);
    //Hier werden die eingegebenen Daten ausgelesen und in Variablen gespeichert
    const username = req.body.username;
    const password = req.body.password;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const email = req.body.email;

    //Verschlüsselt das vom Nutzer eingegebene Passwort
    let hashedPassword = bcrypt.hashSync(password, 12);

    //Bindet die SQL Verbindung ein, damit man SQL Befehle ausführen kann
    con.connect(function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log('Connected');
        }
        const sql = "INSERT INTO players(username,firstname,lastname,email,password,position) VALUES(?,?,?,?,?,?)" //SQL Befehl zum erstellen eines neuen Nutzers, die Fragezeichen dienen als Platzhalter.
        con.query(sql, [username,firstname,lastname,email,hashedPassword,"Jungle"], function(err, result) { //Hier wird der Befehl ausgeführt und die Fragezeichen mit den richtigen werten ersetzt
            if (err) {
                console.log(err);
            } else {
                console.log("Erfolgreich registriert!");
            }
        });
    });
    res.redirect('/login'); //Leitet nach dem erfolgreichen erstellen eines neuen Nutzers den Anwender auf die Anmeldeseite weiter.

});


// Login-Route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM players WHERE email = ?";

    con.query(sql, [email], async (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Datenbankfehler" });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: "Ungültige Anmeldeinformationen" });
        }

        const user = results[0];

        // Passwort prüfen
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Ungültige Anmeldeinformationen" });
        }
        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });

        res.cookie('token', token, { httpOnly: true, secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 Tage gültig


        // JWT-Token erstellen

        res.redirect("/profile");
    });
});

//Route zum Nutzerprofil
app.get('/profile', authMiddleware, (req, res) => {
    const sql = "SELECT * FROM players WHERE id = ?";
    con.query(sql, [req.user.id], async (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({message: "Datenbankfehler"});
        } else {
            res.render('./secure/profile', {user:results[0]});
        }
    });
});

//Mit dieser Route können Nutzer ihre persönlichen Daten ändern (Nutzername, E-Mail Adresse und Passwort)
app.post('/updateProfile', authMiddleware, (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = bcrypt.hashSync(req.body.password, 12);

    const sql = "UPDATE players SET username = ?, email = ?, password = ?   WHERE id = ?";
    con.query(sql, [username, email, password, req.user.id], async (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({message: "Datenbankfehler"});
        } else {
            res.redirect('/profile');
        }
    });
});

//Route mit der sich ein Nutzer abmelden kann.
app.get('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'strict' });
    res.redirect('/login');
});


//Route mit der man nach Nutzern suchen kann und einen Kampf kämpft.
app.get('/search', authMiddleware, (req, res) => {
    const currentUserId = req.user.id;

    // Wir extrahieren die Eingabewerte aus den Query-Parametern
    const { username, elo, position } = req.query;

    // Starten mit einer Grund-SQL-Abfrage, die alle Spieler außer dem aktuellen User auswählt
    let sql = "SELECT username, position, eloScore FROM players WHERE id != ?";
    let params = [currentUserId];

    // Hinzufügen von Bedingungen, wenn die Parameter angegeben sind
    if (username) {
        sql += " AND username LIKE ?";
        params.push(`%${username}%`);
    }
    if (elo) {
        sql += " AND eloScore = ?";
        params.push(elo);
    }
    if (position && position !== "Alle") {
        sql += " AND position = ?";
        params.push(position);
    }

    // Ausführen der SQL-Abfrage
    con.query(sql, params, async (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Datenbankfehler" });
        } else {
            if (results.length === 0) {
                let errorMessage = 'Leider konnten keine Spieler gefunden werden, die deinen Kriterien entsprechen.';
                // Wenn kein Filter gesetzt wurde, zeigen wir an, dass keine Spieler existieren
                if (!username && !elo && !position) {
                    errorMessage = 'Leider gibt es keine Spieler gegen die du kämpfen kannst.';
                }
                res.render('./secure/search-results', {
                    users: [],
                    searchValues: {
                        username: '',
                        position: '',
                        elo:''
                    }});
            } else {
                res.render('./secure/search-results', {
                    error: null,
                    users: results,
                    searchValues: {
                        username: username || '',
                        position: position || '',
                        elo: elo || ''
                    }});
            }
        }
    });
});

app.get("/einzelkampf/:username", authMiddleware, (req, res) => {
    const username = req.params.username;  // Username aus der URL holen
    const currentUserId = req.user.id;

    // SQL-Abfrage
    const sql = `SELECT eloScore, username, position FROM players WHERE username = ? UNION SELECT eloScore, username, position FROM players WHERE id = ?`;

    con.execute(sql, [username, currentUserId], (err, results) => {
        if (err) {
            console.error('Datenbankfehler:', err);
            return res.status(500).json({ error: 'Datenbankfehler' });
        }

        // Ergebnisse aufteilen
        const [userData, currentUserData] = results;
        return res.render('./secure/einzelkampf', {
            userData: userData,         // Daten des Benutzers mit dem 'username'
            currentUserData: currentUserData, // Daten des aktuellen Benutzers
        });
    });
});

//Session-Middleware einrichen
app.use(session({
    secret: "SECRET_KEY",
    resave:false,
    saveUninitialized: true
}))


app.post('/updateElo', (req, res) => {
    const { playerA, playerB, winner } = req.body;

    // SQL-Update für Spieler A
    const updatePlayerA = 'UPDATE players SET eloScore = ? WHERE username = ?';
    con.query(updatePlayerA, [playerA.newElo, playerA.username], (err, result) => {
        if (err) {
            console.error('Fehler beim Aktualisieren von Spieler A:', err);
            return res.status(500).json({ message: 'Fehler beim Aktualisieren von Spieler A' });
        }
        console.log('Spieler A Elo erfolgreich aktualisiert');

        // SQL-Update für Spieler B
        const updatePlayerB = 'UPDATE players SET eloScore = ? WHERE username = ?';
        con.query(updatePlayerB, [playerB.newElo, playerB.username], (err, result) => {
            if (err) {
                console.error('Fehler beim Aktualisieren von Spieler B:', err);
                return res.status(500).json({ message: 'Fehler beim Aktualisieren von Spieler B' });
            }
            console.log('Spieler B Elo erfolgreich aktualisiert');

            // Speichern der Daten in der Session
            req.session.playerA = playerA;
            req.session.playerB = playerB;
            req.session.winner = winner;

            // Erfolgreiche Antwort zurückgeben
            return res.json({ message: 'Elo-Werte erfolgreich aktualisiert und gespeichert' });
        });
    });
});

// Ergebnisseite anzeigen
app.get('/ergebnis', (req, res) => {
    // Hole die Daten aus der Session
    const { playerA, playerB, winner } = req.session;

    if (!playerA || !playerB || !winner) {
        return res.status(400).json({ message: 'Keine Ergebnisse verfügbar' });
    }

    // Render die Ergebnisseite mit den gespeicherten Session-Daten
    res.render('./secure/ergebnis', { playerA, playerB, winner });
});

app.get("/fight", authMiddleware, (req, res) => {
    res.render('./secure/fight');
})

