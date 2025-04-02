//importiert alle benötigten Module
const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt'); //zur verschlüsselung der Passwörter
const jwt = require('jsonwebtoken'); //dient zur dauerhaften Anmeldung eines Nutzers (via Cookies)
const cookieParser = require('cookie-parser'); //damit kann man Cookies setzen und löschen
require('dotenv').config();

//Stellt ejs als View Engine ein
app.set("view engine", "ejs"); //dient zur dynamischen generierung von Webinhalten

app.use(cookieParser()); //sagt der App dass sie den Cookie Parser nutzen soll

app.use(express.urlencoded({ extended: false })); //formatiert JSON in ein Format, dass das weiterverarbeiten erleichtert

app.use(express.static(path.join(__dirname, 'public'))); //Sagt dem Projekt wo es die CSS und JavaScript Dateien findet.


app.set("views", path.join(__dirname, "views")); //Sagt dem Projekt wo es die einzelnen Unterseiten wie bspw. Anmeldung oder die Startseite findet

const PORT = 3000; //Legt fest auf welchem Port die Webanwendung laufen soll. In der Regel ist das Port 3000, es könnte aber auch jeder andere sein.
app.listen(PORT, () => { //Startet einen lokalen Webserver
    console.log(`Server started on port ${PORT}`);
});

//Route zur Startseite
app.get('/', (req, res) => {
    res.render('index'); //Schickt die .ejs Datei (die Website) an den Kunden
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

app.get('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'strict' });
    res.redirect('/login');
});