#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Voxora Cross-Platform Start Script
 * Runs seamlessly on Windows, macOS, and Linux wherever Node.js is installed.
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n=======================================');
console.log('   VOXORA - Talk to your documents    ');
console.log('=======================================\n');

// Validate Node.js version
const majorVersion = parseInt(process.versions.node.split('.')[0], 10);
if (majorVersion < 20) {
  console.warn(
    `[Warning] Node.js 20 or newer is recommended (detected v${process.versions.node}).`,
  );
}

// Ensure .env.local exists
const rootDir = __dirname;
const envLocalPath = path.join(rootDir, '.env.local');
const envExamplePath = path.join(rootDir, '.env.example');

if (!fs.existsSync(envLocalPath) && fs.existsSync(envExamplePath)) {
  console.log('Creating .env.local from .env.example...');
  fs.copyFileSync(envExamplePath, envLocalPath);
}

// Resolve npm binary for platform
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// Install dependencies if node_modules is missing
const nodeModulesPath = path.join(rootDir, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('Installing dependencies (npm install)...');
  const installResult = spawnSync(npmCmd, ['install'], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  if (installResult.status !== 0) {
    console.error('\n[Error] Dependency installation failed.');
    process.exit(1);
  }
}

// Start the development server
console.log('\nStarting Voxora development server at http://localhost:3000\n');
const devProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
});

// Handle termination signals cleanly
process.on('SIGINT', () => {
  devProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  devProcess.kill('SIGTERM');
  process.exit(0);
});

devProcess.on('close', (code) => {
  process.exit(code ?? 0);
});
