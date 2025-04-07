function filterCards() {
    // Holen der Eingabewerte
    const usernameFilter = document.getElementById('username').value.toLowerCase();
    const positionFilter = document.getElementById('position').value.toLowerCase();
    const eloFilter = document.getElementById('eloScore').value;

    // Holen aller Cards
    const cards = document.querySelectorAll('#players .card');

    // Durch die Karten iterieren und filtern
    cards.forEach(card => {
        // Holen der `data-*` Attribute der Karte
        const username = card.getAttribute('data-username').toLowerCase();
        const position = card.getAttribute('data-position').toLowerCase();
        const elo = card.getAttribute('data-elo');

        // Überprüfen, ob die Karte den Filterkriterien entspricht
        const matchesUsername = usernameFilter ? username.includes(usernameFilter) : true;
        const matchesPosition = positionFilter ? position.includes(positionFilter) : true;
        const matchesElo = eloFilter ? elo >= eloFilter : true;

        // Zeige die Karte an, wenn alle Filterkriterien zutreffen
        if (matchesUsername && matchesPosition && matchesElo) {
            card.style.display = ''; // Zeige die Karte an
        } else {
            card.style.display = 'none'; // Verstecke die Karte
        }
    });
}
