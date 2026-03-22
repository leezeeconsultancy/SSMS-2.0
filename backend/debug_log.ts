
import fs from 'fs';
import path from 'path';

// Temporary log helper
const logDebug = (data: any) => {
  const logPath = 'c:\\Users\\OM\\.gemini\\antigravity\\playground\\galactic-lagoon\\backend\\login_debug.log';
  const timestamp = new Date().toISOString();
  const content = `${timestamp}: ${JSON.stringify(data)}\n`;
  fs.appendFileSync(logPath, content);
};
