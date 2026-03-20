const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, '..', 'app', 'admin');
const dashboardDir = path.join(adminDir, '(dashboard)');
const integrationsDir = path.join(adminDir, 'integrations');

try {
    if (!fs.existsSync(dashboardDir)) {
        fs.mkdirSync(dashboardDir, { recursive: true });
        console.log('Created (dashboard) directory');
    }

    if (fs.existsSync(integrationsDir)) {
        fs.renameSync(integrationsDir, path.join(dashboardDir, 'integrations'));
        console.log('Moved integrations to (dashboard)/integrations');
    } else {
        console.log('Integrations directory not found or already moved');
    }
} catch (err) {
    console.error('Error organizing dirs:', err);
    process.exit(1);
}
