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
function getUserXP(wast_user) {
    return xpData[wast_user] ? xpData[wast_user].xp : 0;
}
function setUserXP(userId, xp) {
    xpData[wast_user] = xpData[wast_user] || { xp: 0, level: 1 };
    xpData[wast_user].xp = xp;
    saveXPData();
}
function getUserLevel(xp) {
    return Math.floor(xp / 100) + 1; 
}

module.exports = {
    getUserXP,
    setUserXP,
    getUserLevel
};
      
