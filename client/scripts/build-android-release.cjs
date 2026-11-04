/**
 * Author: trangtttce191027
 */
/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const profile = require('../eas.json').build.preview;
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT
    || path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk');
if (!fs.existsSync(sdk)) throw new Error('Set ANDROID_HOME to the installed Android SDK.');
const env = { ...process.env, ...profile.env, TECHSTORE_LOCAL_RELEASE: '1', ANDROID_HOME: sdk, DEBUG: '' };
const packagePath = path.join(root, 'package.json');
const lockPath = path.join(root, 'package-lock.json');
const originalPackage = fs.readFileSync(packagePath);
const originalLock = fs.readFileSync(lockPath);
const pkg = JSON.parse(originalPackage);
const prebuild = spawnSync(process.execPath, [
    'node_modules/expo/bin/cli', 'prebuild', '--platform', 'android', '--no-clean', '--no-install',
    '--skip-dependency-update', Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).join(','),
], { cwd: root, env, stdio: 'inherit' });

// Expo changes the android/ios development scripts; preserve this project's workflow.
const updated = JSON.parse(fs.readFileSync(packagePath));
const previousComparable = { ...pkg, scripts: { ...pkg.scripts } };
const currentComparable = { ...updated, scripts: { ...updated.scripts } };
for (const key of ['android', 'ios']) {
    delete previousComparable.scripts[key];
    delete currentComparable.scripts[key];
}
if (JSON.stringify(previousComparable) !== JSON.stringify(currentComparable)) {
    throw new Error('Unexpected package changes during prebuild; inspect them before building.');
}
if (!fs.readFileSync(packagePath).equals(originalPackage)) fs.writeFileSync(packagePath, originalPackage);
if (!fs.readFileSync(lockPath).equals(originalLock)) throw new Error('Lockfile changed unexpectedly; inspect before building.');
if (prebuild.status !== 0) process.exit(prebuild.status ?? 1);
if (process.argv.includes('--prebuild-only')) process.exit(0);

const args = [':app:assembleRelease', '--console=plain', '--no-daemon', '--max-workers=2'];
const build = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/c', 'gradlew.bat', ...args], { cwd: path.join(root, 'android'), env, stdio: 'inherit' })
    : spawnSync('./gradlew', args, { cwd: path.join(root, 'android'), env, stdio: 'inherit' });
if (build.error) throw build.error;
process.exit(build.status ?? 1);
