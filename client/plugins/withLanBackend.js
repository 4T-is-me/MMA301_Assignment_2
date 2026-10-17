const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

// LAN demonstration builds use HTTP; HTTPS builds explicitly disable cleartext.
module.exports = (config, { allowCleartext = false } = {}) => withAndroidManifest(config, mod => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    application.$['android:usesCleartextTraffic'] = allowCleartext ? 'true' : 'false';
    return mod;
});
