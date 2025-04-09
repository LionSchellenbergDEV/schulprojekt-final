const db = require('./db');

async function getAllPlayers() {
    const [rows] = await db.query('SELECT * FROM players');
    return rows;
}

async function getPlayerById(id) {
    const [rows] = await db.query('SELECT * FROM players WHERE id = ?', [id]);
    return rows[0];
}

async function createPlayer(con, player) {
    const {username, firstname, lastname, email, hashedPassword} = player;
    const query = `INSERT INTO players (username, firstname, lastname, email, password)
                   VALUES (?, ?, ?, ?, ?)`;

    con.query(query, [username, firstname, lastname, email, hashedPassword], function (err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log("Erfolgreich registriert!");
            newPlayerId = result.insertId;
        }
    });
}

async function getPlayerById(id) {
    const [rows] = await db.query(`
        SELECT players.*, teams.name AS team_name
        FROM players
                 LEFT JOIN teams ON players.id_team = teams.id
        WHERE players.id = ?
    `, [id]);

    return rows[0];
}


module.exports = {
    getAllPlayers,
    getPlayerById,
    createPlayer
};


