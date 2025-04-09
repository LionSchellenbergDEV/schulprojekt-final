const db = require('./db');

async function getAllTeamMatches() {
    const [rows] = await db.query('SELECT * FROM team_matches');
    return rows;
}

async function getTeamMatchById(id) {
    const [rows] = await db.query('SELECT * FROM team_matches WHERE id = ?', [id]);
    return rows[0];
}

module.exports = {
    getAllTeamMatches,
    getTeamMatchById
};
