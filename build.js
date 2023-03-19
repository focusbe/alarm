const packager = require('electron-packager');
const options = {
    platform: 'darwin',
    name: 'Alarm',
    icon: './assets/alarmLogo.icns',
    dir: './',
    appVersion: '1.0.1',
    ignore: '(.gitignore|LICENSE|README.md)',
    out: './output',
    overwrite: true,
    asar: true,
    usageDescription: {
        Camera: 'Needed for video calls',
        Microphone: 'Needed for voice calls',
    },
    extendInfo: {
        'com.apple.security.device.camera': true,
        'com.apple.security.cs.allow-jit': true,
        'com.apple.security.cs.allow-unsigned-executable-memory': true,
        'com.apple.security.cs.allow-dyld-environment-variables': true,
        'com.apple.security.device.audio-input': true,
    },
};
async function bundleElectronApp() {
    const appPaths = await packager(options);
    console.log(`Electron app bundles created:\n${appPaths.join('\n')}`);
}
bundleElectronApp();
