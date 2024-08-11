const fs = require('fs');
const path = require('path');

const XP_FILE = path.join(__dirname, 'xpData.json');
let xpData = {};
if (fs.existsSync(XP_FILE)) {
    xpData = JSON.parse(fs.readFileSync(XP_FILE, 'utf8'));
}
function saveXPData() {
    fs.writeFileSync(XP_FILE, JSON.stringify(xpData, null, 2), 'utf8');
}
function get_XP(wast_user) {
    return xpData[wast_user] ? xpData[wast_user].xp : 0;
}
function set_XP(userId, xp) {
    xpData[wast_user] = xpData[wast_user] || { xp: 0, level: 1 };
    xpData[wast_user].xp = xp;
    saveXPData();
}
function get_Level(xp) {
    return Math.floor(xp / 100) + 1; 
}

module.exports = {
    get_XP,
    set_XP,
    get_Level
};
      
