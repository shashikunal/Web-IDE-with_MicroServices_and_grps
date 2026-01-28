const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '../services/workspace-service/src/templates');

console.log(`Scanning ${templatesDir}...`);

fs.readdir(templatesDir, (err, files) => {
    if (err) {
        console.error('Error reading dir:', err);
        process.exit(1);
    }

    files.forEach(file => {
        if (!file.endsWith('.js')) return;

        const filePath = path.join(templatesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Regex to match entrypoint: 'sh' or "sh" with any whitespace
        const regex = /entrypoint:\s*['"]sh['"]/g;

        if (regex.test(content)) {
            console.log(`Fixing ${file}...`);
            const newContent = content.replace(regex, "entrypoint: ['sh']");
            fs.writeFileSync(filePath, newContent);
        } else {
            console.log(`No fix needed for ${file} (or already fixed)`);
        }
    });
});
