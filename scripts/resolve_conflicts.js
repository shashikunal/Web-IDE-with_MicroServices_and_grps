const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/components/editor/VSCodeIDE_NEW.tsx',
  'frontend/src/components/editor/Preview.tsx',
  'frontend/src/components/terminal/Terminal.tsx',
  // 'frontend/package.json', // Already fixed manually
  // 'frontend/Dockerfile', // Already fixed manually
  // 'backend/package.json', // Already fixed manually
];

const ROOT_DIR = 'c:\\Users\\Kushal\\Music\\coding_platform';

function resolveConflicts(filePath) {
  const fullPath = path.join(ROOT_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Regex to match conflict blocks
  // // ...
  //   
  // We want to keep the content between ======= and >>>>>>>
  const conflictRegex = /\s*([\s\S]*?)
  let resolvedContent = content.replace(conflictRegex, (match, incomingContent) => {
    return incomingContent;
  });

  // Also handle cases where there might be subtle differences in markers if any
  // But the above regex should handle standard git markers.

  if (content !== resolvedContent) {
    fs.writeFileSync(fullPath, resolvedContent, 'utf8');
    console.log(`Resolved conflicts in ${filePath}`);
  } else {
    console.log(`No conflicts found or resolved in ${filePath}`);
  }
}

files.forEach(resolveConflicts);
