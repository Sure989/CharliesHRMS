const fs = require('fs');
const path = require('path');

// Remove test files and directories
const itemsToRemove = [
  'tests',
  'jest.config.ts',
  'jest.config.js'
];

function removeItem(itemPath) {
  const fullPath = path.join(__dirname, itemPath);
  
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Remove directory recursively
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`Removed directory: ${itemPath}`);
    } else {
      // Remove file
      fs.unlinkSync(fullPath);
      console.log(`Removed file: ${itemPath}`);
    }
  } else {
    console.log(`Item not found: ${itemPath}`);
  }
}

console.log('Cleaning up test files...');
itemsToRemove.forEach(removeItem);
console.log('Cleanup complete!');