const playerModel = require('../models/playerModel');

// Elo-Anpassung basierend auf dem Gewinner
function adjustElo(winner, loser) {
    const K = 32; // Wert für Elo-Anpassung (kann angepasst werden)

    // Berechnung der Elo-Anpassung
    const expectedWinner = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winner.elo - loser.elo) / 400));

    const scoreAdjustment = K * (1 - expectedWinner);  // Gewinner bekommt die Anpassung

    // Elo-Werte der Spieler aktualisieren
    const newWinnerElo = winner.elo + scoreAdjustment;
    const newLoserElo = loser.elo - scoreAdjustment;

    // Update der Elo-Werte in der DB
    playerModel.updateElo(winner.id, Math.round(newWinnerElo), () => {});
    playerModel.updateElo(loser.id, Math.round(newLoserElo), () => {});
}

// Startet ein 1v1-Spiel
function startMatch(req, res) {
    const { player1Username, player2Username } = req.body; // Benutzername von beiden Spielern

    playerModel.getPlayerByUsername(player1Username, (err, player1) => {
        if (err || !player1) {
            res.status(404).send('Spieler 1 nicht gefunden!');
            return;
        }

        playerModel.getPlayerByUsername(player2Username, (err, player2) => {
            if (err || !player2) {
                res.status(404).send('Spieler 2 nicht gefunden!');
                return;
            }

            // Zufälligen Gewinner ermitteln
            const winner = Math.random() > 0.5 ? player1 : player2;
            const loser = winner === player1 ? player2 : player1;

            console.log(`Der Gewinner ist: ${winner.username}`);

            // Elo-Score anpassen
            adjustElo(winner, loser);

            // Rückgabe des Ergebnisses
            res.status(200).send({ winner: winner.username, loser: loser.username });
        });
    });
}

module.exports = { startMatch };
