/**
 * Build Logger for SSMS Deployment
 * Provides clear, beautiful logging for the deployment process.
 */

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

const icons = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
  rocket: "🚀",
  build: "🏗️",
  lock: "🔒",
  clock: "🕒",
};

const phase = process.argv[2] || "info";

function logHeader(title) {
  console.log(`\n${colors.cyan}${colors.bright}${icons.rocket} SSMS DEPLOYMENT: ${title.toUpperCase()}${colors.reset}`);
  console.log(`${colors.dim}------------------------------------------------------------${colors.reset}`);
}

function logKV(key, value) {
  console.log(`${colors.blue}${key}:${colors.reset} ${value}`);
}

if (phase === "start") {
  logHeader("Build Phase Started");
  logKV("Time", new Date().toLocaleString());
  logKV("Node Version", process.version);
  logKV("Platform", process.platform);
  logKV("Environment", process.env.NODE_ENV || "not set (default: production)");
  
  // Check critical Env Variables Presence (don't log values!)
  const criticalVars = ['VITE_API_URL', 'MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL'];
  console.log(`\n${colors.yellow}${icons.lock} Environment Variable Check:${colors.reset}`);
  criticalVars.forEach(v => {
    const present = process.env[v] ? `${colors.green}PRESENT${colors.reset}` : `${colors.red}MISSING${colors.reset}`;
    console.log(`  - ${v}: ${present}`);
  });
  
  console.log(`\n${colors.cyan}${icons.build} Running build tools...${colors.reset}\n`);

} else if (phase === "success") {
  console.log(`\n${colors.dim}------------------------------------------------------------${colors.reset}`);
  console.log(`${colors.green}${colors.bright}${icons.success} BUILD COMPLETED SUCCESSFULLY${colors.reset}`);
  console.log(`${colors.dim}Ready for deployment at: ${new Date().toLocaleString()}${colors.reset}\n`);

} else if (phase === "failure") {
  console.log(`\n${colors.dim}------------------------------------------------------------${colors.reset}`);
  console.log(`${colors.red}${colors.bright}${icons.error} BUILD FAILED${colors.reset}`);
  console.log(`${colors.yellow}Please check the logs above for specific error messages.${colors.reset}`);
  console.log(`${colors.dim}Failure time: ${new Date().toLocaleString()}${colors.reset}\n`);
  process.exit(1);
}
