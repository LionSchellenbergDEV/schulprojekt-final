function kaempfen() {
    const eloA = parseInt(document.getElementById("eloScore").dataset.elo);
    const eloB = parseInt(document.getElementById("eloScoreOpponent").dataset.elo);

    const usernameA = document.getElementById("username").innerText;
    const usernameB = document.getElementById("usernameOpponent").innerText;

    const winner = Math.random() < 0.5 ? "A" : "B";
    const k = 32;

    const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
    const expectedB = 1 - expectedA;

    const scoreA = winner === "A" ? 1 : 0;
    const scoreB = 1 - scoreA;

    const newEloA = Math.round(eloA + k * (scoreA - expectedA));
    const newEloB = Math.round(eloB + k * (scoreB - expectedB));

    // ELO im DOM aktualisieren
    document.getElementById("eloScore").innerText = `ELO: ${newEloA} Punkte`;
    document.getElementById("eloScoreOpponent").innerText = `ELO: ${newEloB} Punkte`;

    // Fetch senden
    // FRONTEND: Statt flat → verpacke es wie das Backend erwartet
    fetch('/updateElo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            playerA: { username: usernameA, newElo: newEloA },
            playerB: { username: usernameB, newElo: newEloB },
            winner: winner
        })
    })

        .then(response => {
            if (!response.ok) throw new Error("Fehler beim Senden der ELO-Daten.");
            return response.json();
        })
        .then(data => {
            window.location.href = '/ergebnis';
        })
        .catch(error => {
            console.error(error);
            alert("Ein Fehler ist aufgetreten beim Aktualisieren der ELO-Werte.");
        });
}
