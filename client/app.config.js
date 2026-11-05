/**
 * Author: trangtttce191027
 */
// Both native release paths use the same endpoint checks; Expo Go keeps its local config.
module.exports = ({ config }) => {
    const localRelease = process.env.TECHSTORE_LOCAL_RELEASE === '1';
    if (process.env.EAS_BUILD_PROFILE !== 'preview' && !localRelease) return config;

    let endpoint;
    try {
        endpoint = new URL(process.env.EXPO_PUBLIC_AI_API_URL);
    } catch {
        throw new Error('Release requires EXPO_PUBLIC_AI_API_URL in the preview build environment.');
    }
    const host = endpoint.hostname.toLowerCase();
    const forbidden = host === 'localhost' || host.endsWith('.localhost')
        || /^127\./.test(host) || ['0.0.0.0', '[::1]', '[::]', '10.0.2.2', '10.0.3.2'].includes(host);
    const octets = host.split('.');
    const ipv4 = octets.length === 4 && octets.every(part => /^\d+$/.test(part) && Number(part) <= 255);
    const lan = ipv4 && (/^10\./.test(host) || /^192\.168\./.test(host)
        || /^172\.(1[6-9]|2\d|3[01])\./.test(host));
    if (forbidden || !['http:', 'https:'].includes(endpoint.protocol)
        || (endpoint.protocol === 'http:' && !lan)
        || endpoint.username || endpoint.password || endpoint.search || endpoint.hash
        || endpoint.pathname !== '/') {
        throw new Error('Release AI URL must be an HTTPS base URL or private LAN HTTP base URL, without credentials/query/path; localhost and emulator aliases are not allowed.');
    }

    return {
        ...config,
        plugins: [...(config.plugins || []), ['./plugins/withLanBackend', {
            allowCleartext: endpoint.protocol === 'http:',
        }], ...(localRelease ? ['./plugins/withLocalReleaseSigning'] : [])],
    };
};
