const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'c:\\Users\\Kushal\\Music\\coding_platform';
const EXTENSIONS = ['.js', '.ts', '.tsx', '.json', '.md', '.css'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.agent'];

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (IGNORE_DIRS.includes(file)) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

function resolveConflicts(filePath) {
  const ext = path.extname(filePath);
  if (!EXTENSIONS.includes(ext)) return;

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Regex to match conflict blocks
    // We want to keep the content between ======= and >>>>>>>
    const conflictRegex = /<<<<<<< HEAD[\s\S]*?=======\s*([\s\S]*?)>>>>>>> .+?(\r?\n|$)/g;

    if (!conflictRegex.test(content)) return;

    console.log(`Resolving conflicts in ${filePath}`);

    // Reset regex state
    conflictRegex.lastIndex = 0;

    let resolvedContent = content.replace(conflictRegex, (match, incomingContent) => {
      return incomingContent;
    });

    fs.writeFileSync(filePath, resolvedContent, 'utf8');
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

console.log('Scanning for conflicts...');
walkDir(ROOT_DIR, resolveConflicts);
console.log('Done.');
