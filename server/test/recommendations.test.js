import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recommendProducts } from '../src/controllers/recommendationController.js';

const products = [
    { id: 1, title: 'Phone A', price: 100, stock: 5, category: 'smartphones' },
    { id: 2, title: 'Phone B', price: 200, stock: 0, category: 'smartphones' },
    { id: 3, title: 'Laptop', price: 500, stock: 3, category: 'laptops' },
];
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const generated = value => json({ candidates: [{ content: { parts: [{ text: typeof value === 'string' ? value : JSON.stringify(value) }] } }] });

// Tests execute controller -> product fetch -> real SDK -> validation with mocked HTTP.
// No API key, Firebase, or external network is used.
test('recommendation integration', async (t) => {
    const saved = Object.fromEntries(['GEMINI_API_KEY', 'GEMINI_TIMEOUT_MS', 'GEMINI_MODEL'].map(key => [key, process.env[key]]));
    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.GEMINI_TIMEOUT_MS;
    delete process.env.GEMINI_MODEL;
    t.after(() => {
        for (const [key, value] of Object.entries(saved)) {
            if (value === undefined) delete process.env[key]; else process.env[key] = value;
        }
    });
    const request = async body => {
        const res = { status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
        await recommendProducts({ body }, res);
        return res;
    };
    const mockHTTP = (t, generate, catalog = () => json({ products })) => {
        t.mock.method(console, 'error', () => {});
        return t.mock.method(globalThis, 'fetch', async (url, options) =>
            String(url).startsWith('https://dummyjson.com/') ? catalog(url, options) : generate(url, options));
    };

    await t.test('invalid/empty/oversized prompts never access network', async t => {
        const fetch = t.mock.method(globalThis, 'fetch', () => { throw Error('Unexpected network call'); });
        for (const body of [undefined, {}, { prompt: ' ' }, { prompt: 'x'.repeat(1001) }, { prompt: 12 }]) assert.equal((await request(body)).statusCode, 400);
        assert.equal(fetch.mock.callCount(), 0);
    });
    await t.test('valid catalog context maps real IDs to products and trims reasons', async t => {
        mockHTTP(t, (url, options) => {
            assert.match(String(url), /gemini-3\.5-flash-lite:generateContent/);
            const payload = JSON.parse(options.body);
            assert.match(JSON.stringify(payload.contents), /Phone A/);
            return generated({ recommendations: [{ productId: 1, reason: '  Budget match  ' }] });
        });
        const res = await request({ prompt: 'Recommend a phone' });
        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body.data.recommendations, [{ product: products[0], reason: 'Budget match' }]);
    });
    await t.test('unknown IDs, sold-out items, duplicates, nulls and invalid reasons are excluded', async t => {
        mockHTTP(t, () => generated({ recommendations: [null, 5, { productId: 999, reason: 'fake' }, { productId: 2, reason: 'sold out' }, { productId: 1, reason: 'good' }, { productId: 1, reason: 'duplicate' }, { productId: 3, reason: '' }] }));
        const res = await request({ prompt: 'Recommend a phone' });
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.data.recommendations.length, 1);
        assert.equal(res.body.data.recommendations[0].product.id, 1);
    });
    await t.test('empty valid recommendations return an empty array', async t => {
        mockHTTP(t, () => generated({ recommendations: [] }));
        assert.deepEqual((await request({ prompt: 'Unmatched request' })).body.data.recommendations, []);
    });
    await t.test('invalid JSON, null structure, missing array and blank response return 502', async t => {
        for (const output of ['not-json', 'null', '{}', ' ']) {
            const mock = mockHTTP(t, () => generated(output));
            assert.equal((await request({ prompt: 'Recommend products' })).statusCode, 502);
            mock.mock.restore();
        }
    });
    await t.test('Gemini abort returns 504', async t => {
        mockHTTP(t, () => { throw new DOMException('Aborted', 'AbortError'); });
        assert.equal((await request({ prompt: 'Recommend a phone' })).statusCode, 504);
    });
    await t.test('unavailable model 404 is a controlled 502, without leaking upstream text', async t => {
        mockHTTP(t, () => json({ error: { code: 404, message: 'private upstream detail', status: 'NOT_FOUND' } }, 404));
        const res = await request({ prompt: 'Recommend a phone' });
        assert.equal(res.statusCode, 502);
        assert.doesNotMatch(JSON.stringify(res.body), /private upstream/);
    });
    await t.test('quota 429 returns 503 without hidden retry', async t => {
        let calls = 0;
        mockHTTP(t, () => { calls++; return json({ error: { code: 429, message: 'Quota exceeded' } }, 429); });
        assert.equal((await request({ prompt: 'Recommend a phone' })).statusCode, 503);
        assert.equal(calls, 1);
    });
    await t.test('catalog failure and malformed catalog return controlled 502', async t => {
        for (const catalog of [() => json({}, 503), () => json({ products: [null] }), () => json({ products: 'invalid' }), () => { throw new TypeError('mock network failure'); }]) {
            const mock = mockHTTP(t, () => { throw Error('Gemini should not run'); }, catalog);
            assert.equal((await request({ prompt: 'Recommend products' })).statusCode, 502);
            mock.mock.restore();
        }
    });
    await t.test('total deadline also bounds catalog retrieval', async t => {
        process.env.GEMINI_TIMEOUT_MS = '1000';
        t.after(() => { delete process.env.GEMINI_TIMEOUT_MS; });
        mockHTTP(t, () => { throw Error('Gemini should not run'); }, (url, options) => new Promise((resolve, reject) => {
            options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
        }));
        const keepAlive = setInterval(() => {}, 100);
        t.after(() => clearInterval(keepAlive));
        const start = Date.now();
        assert.equal((await request({ prompt: 'Recommend products' })).statusCode, 504);
        assert.ok(Date.now() - start < 5000);
    });
    await t.test('invalid config is rejected before catalog or Gemini access', async t => {
        process.env.GEMINI_TIMEOUT_MS = 'invalid';
        const fetch = t.mock.method(globalThis, 'fetch', () => { throw Error('Unexpected network call'); });
        t.mock.method(console, 'error', () => {});
        assert.equal((await request({ prompt: 'Recommend products' })).statusCode, 500);
        assert.equal(fetch.mock.callCount(), 0);
        delete process.env.GEMINI_TIMEOUT_MS;
    });
});
