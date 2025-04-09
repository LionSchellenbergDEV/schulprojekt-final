const db = require('./db');

async function getAllMatches() {
    const [rows] = await db.query('SELECT * FROM matches');
    return rows;
}

async function getMatchById(id) {
    const [rows] = await db.query('SELECT * FROM matches WHERE id = ?', [id]);
    return rows[0];
}

module.exports = {
    getAllMatches,
    getMatchById
};
