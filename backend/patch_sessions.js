import fs from 'fs';
const sessionPath = './src/controllers/sessionController.js';
const analyticsPath = './src/controllers/analyticsController.js';

let sessCode = fs.readFileSync(sessionPath, 'utf8');
sessCode = sessCode.replace(/login_time/g, 'check_in_time').replace(/logout_time/g, 'check_out_time');
fs.writeFileSync(sessionPath, sessCode);

let anaCode = fs.readFileSync(analyticsPath, 'utf8');
anaCode = anaCode.replace(/login_time/g, 'check_in_time');
fs.writeFileSync(analyticsPath, anaCode);
console.log('done linking columns');
