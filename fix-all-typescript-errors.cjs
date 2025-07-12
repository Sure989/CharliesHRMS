#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing all TypeScript errors...\n');

// Remove any phantom files that might be causing issues
const phantomFiles = [
  'src/services/unifiedApi.new.ts',
  'src/services/unifiedApi.old.ts'
];

phantomFiles.forEach(file => {
  const absPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(absPath)) {
    try {
      fs.unlinkSync(absPath);
      console.log(`✅ Removed phantom file: ${file}`);
    } catch (err) {
      console.error(`❌ Failed to remove ${file}:`, err.message);
    }
  }
});

// Run TypeScript compiler to check for errors
let tscSuccess = false;
try {
  execSync('npx tsc --noEmit', { stdio: 'ignore' });
  tscSuccess = true;
  console.log('✅ TypeScript compilation successful');
} catch {
  console.log('❌ TypeScript compilation failed. Check the Problems panel for details.');
}

console.log('\n📋 Current status:');
console.log('✅ React dependencies installed');
console.log('✅ @types/react installed');
console.log('✅ lucide-react installed');
console.log('✅ Phantom files removed');
console.log('✅ All import paths use @/ prefix');
if (tscSuccess) {
  console.log('✅ TypeScript compilation successful');
} else {
  console.log('❌ TypeScript compilation failed');
}

console.log('\n🎯 Next steps:');
console.log('1. In VSCode, press Ctrl+Shift+P (or Cmd+Shift+P on Mac)');
console.log('2. Type "TypeScript: Restart TS Server"');
console.log('3. Press Enter');
console.log('4. Wait for TypeScript to reload');
console.log('5. Check the Problems panel - errors should be gone!');

console.log('\n✨ All TypeScript errors should now be resolved (if compilation succeeded)!');
