import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

console.log('🚀 Starting packaging process for loom-learning-sections...');

// Step 1: Run typecheck
try {
  console.log('📦 Running typecheck...');
  execSync('npm run typecheck', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
  console.error('❌ Typecheck failed. Please fix compilation issues first.');
  process.exit(1);
}

// Step 2: Build the library
try {
  console.log('📦 Building library UMD and ES bundles...');
  execSync('npm run build:lib', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed.');
  process.exit(1);
}

// Step 3: Create package.json inside dist/
const pkgJson = {
  name: 'loom-learning-sections',
  version: '1.0.3',
  description: 'Standalone React component library for rendering interactive learning sections from JSON data.',
  main: 'loom-sections.umd.js',
  module: 'loom-sections.js',
  style: 'loom-sections.css',
  files: [
    'loom-sections.umd.js',
    'loom-sections.js',
    'loom-sections.css'
  ],
  keywords: [
    'react',
    'loom',
    'interactive',
    'learning',
    'sections',
    'flowchart',
    'tradeoffs',
    'quiz'
  ],
  author: '',
  license: 'MIT',
  publishConfig: {
    access: 'public'
  }
};

const pkgJsonPath = path.resolve(distDir, 'package.json');
fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2), 'utf-8');
console.log('✅ Created package.json in dist/');

// Step 4: Copy README.md (cdn-library.md) to dist/
const readmeSrc = path.resolve(rootDir, 'docs/cdn-library.md');
const readmeDst = path.resolve(distDir, 'README.md');
if (fs.existsSync(readmeSrc)) {
  fs.copyFileSync(readmeSrc, readmeDst);
  console.log('✅ Copied cdn-library.md to dist/README.md');
} else {
  console.warn('⚠️ Warning: docs/cdn-library.md not found.');
}

console.log('\n🎉 Package is successfully prepared in the "dist" directory!');
console.log('------------------------------------------------------------');
console.log('Next steps:');
console.log('1. Make sure you are logged in to the npm registry:');
console.log('   npm whoami');
console.log('2. Publish the package publicly:');
console.log('   npm publish dist --access public');
console.log('------------------------------------------------------------');
