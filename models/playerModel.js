const mysql = require('mysql2');
const connection = require('../config/db'); // Verbindungsdatei (siehe unten)

// Spieler aus der DB holen
function getPlayerByUsername(username, callback) {
    connection.query('SELECT * FROM players WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error(err);
            callback(err, null);
            return;
        }
        callback(null, results[0]);
    });
}

// Funktion, um den Elo-Score zu aktualisieren
function updateElo(playerId, newElo, callback) {
    connection.query('UPDATE players SET elo = ? WHERE id = ?', [newElo, playerId], (err, results) => {
        if (err) {
            console.error(err);
            callback(err);
            return;
        }
        callback(null);
    });
}

module.exports = { getPlayerByUsername, updateElo };
