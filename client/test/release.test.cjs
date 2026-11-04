/**
 * Author: trangtttce191027
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const configure = require('../app.config');

function release(t) {
    const saved = { profile: process.env.EAS_BUILD_PROFILE, url: process.env.EXPO_PUBLIC_AI_API_URL, local: process.env.TECHSTORE_LOCAL_RELEASE };
    t.after(() => {
        for (const [key, value] of [['EAS_BUILD_PROFILE', saved.profile], ['EXPO_PUBLIC_AI_API_URL', saved.url], ['TECHSTORE_LOCAL_RELEASE', saved.local]]) {
            if (value === undefined) delete process.env[key]; else process.env[key] = value;
        }
    });
    process.env.EAS_BUILD_PROFILE = 'preview';
    delete process.env.TECHSTORE_LOCAL_RELEASE;
    return url => {
        if (url === undefined) delete process.env.EXPO_PUBLIC_AI_API_URL;
        else process.env.EXPO_PUBLIC_AI_API_URL = url;
        return configure({ config: { name: 'TechStore', plugins: ['expo-font'] } });
    };
}

test('release config rejects missing, loopback/emulator, public cleartext and credential-bearing URLs', t => {
    const config = release(t);
    for (const url of [undefined, '', 'not a URL', 'http://localhost:3001', 'https://127.0.0.1',
        'http://10.0.2.2:3001', 'http://10.0.3.2:3001', 'https://[::1]', 'http://0.0.0.0',
        'http://example.com', 'http://192.168.example.com', 'http://10.example.com',
        'ftp://192.168.2.10', 'https://user:password@example.com',
        'https://example.com?key=test', 'https://example.com/api', 'https://example.com/#fragment']) {
        assert.throws(() => config(url), /Release/);
    }
});

test('local Gradle release validates the endpoint without EAS and enables its own signing plugin', t => {
    const config = release(t);
    delete process.env.EAS_BUILD_PROFILE;
    process.env.TECHSTORE_LOCAL_RELEASE = '1';
    assert.throws(() => config('http://127.0.0.1:3001'), /Release/);
    const result = config('http://192.168.2.10:3001');
    assert.ok(result.plugins.includes('./plugins/withLocalReleaseSigning'));
    process.env.EAS_BUILD_PROFILE = 'preview';
    delete process.env.TECHSTORE_LOCAL_RELEASE;
    assert.equal(config('https://api.example.com').plugins.includes('./plugins/withLocalReleaseSigning'), false);
});

test('release config allows LAN HTTP and HTTPS with matching native network policy; development stays unchanged', t => {
    const config = release(t);
    for (const url of ['http://192.168.2.10:3001', 'http://10.1.2.3:3001', 'http://172.16.1.2:3001']) {
        assert.equal(config(url).plugins.at(-1)[1].allowCleartext, true);
    }
    assert.equal(config('https://api.example.com').plugins.at(-1)[1].allowCleartext, false);
    delete process.env.EAS_BUILD_PROFILE;
    process.env.EXPO_PUBLIC_AI_API_URL = 'http://127.0.0.1:3001';
    const original = { name: 'TechStore', plugins: ['expo-font'] };
    assert.equal(configure({ config: original }), original);
});
