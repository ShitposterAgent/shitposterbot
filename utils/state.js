// utils/state.js
// Utility for reading/writing persistent state (e.g., last seen tweet)
const fs = require('fs');
const stateFile = process.env.STATE_FILE || './data/state.json';

function readState() {
    try {
        if (fs.existsSync(stateFile)) {
            const data = fs.readFileSync(stateFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error reading state file:', e);
    }
    return {};
}

function writeState(state) {
    try {
        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
    } catch (e) {
        console.error('Error writing state file:', e);
    }
}

module.exports = { readState, writeState };