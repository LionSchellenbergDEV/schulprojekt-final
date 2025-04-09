const db = require('./db');

async function getAllTeams() {
    const [rows] = await db.query('SELECT * FROM teams');
    return rows;
}

async function getTeamById(id) {
    const [rows] = await db.query('SELECT * FROM teams WHERE id = ?', [id]);
    return rows[0];
}

async function createTeam(name) {
    const [result] = await db.query('INSERT INTO teams (name) VALUES (?)', [name]);
    return result.insertId;
}

module.exports = {
    getAllTeams,
    getTeamById,
    createTeam
};
