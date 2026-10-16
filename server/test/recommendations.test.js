import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recommendProducts } from '../src/controllers/recommendationController.js';

test('recommendation request handling', async (t) => {
    const savedKey = process.env.GEMINI_API_KEY;
    const savedTimeout = process.env.GEMINI_TIMEOUT_MS;
    const savedModel = process.env.GEMINI_MODEL;
    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.GEMINI_TIMEOUT_MS;
    delete process.env.GEMINI_MODEL;
    t.after(() => {
        if (savedKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = savedKey;
        if (savedTimeout === undefined) delete process.env.GEMINI_TIMEOUT_MS;
        else process.env.GEMINI_TIMEOUT_MS = savedTimeout;
        if (savedModel === undefined) delete process.env.GEMINI_MODEL;
        else process.env.GEMINI_MODEL = savedModel;
    });

    const request = async (body) => {
        const res = {
            status(value) { this.statusCode = value; return this; },
            json(value) { this.body = value; return this; },
        };
        await recommendProducts({ body }, res);
        return res;
    };

    await t.test('missing or oversized prompts never call Gemini', async (t) => {
        const fetch = t.mock.method(globalThis, 'fetch', () => { throw Error('Unexpected network call'); });
        for (const body of [undefined, {}, { prompt: ' ' }, { prompt: 'x'.repeat(1001) }]) {
            assert.equal((await request(body)).statusCode, 400);
        }
        assert.equal(fetch.mock.callCount(), 0);
    });

    await t.test('success uses the verified Flash Lite model', async (t) => {
        let payload;
        t.mock.method(globalThis, 'fetch', async (url, options) => {
            assert.match(String(url), /gemini-3\.5-flash-lite:generateContent/);
            payload = JSON.parse(options.body);
            return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '  Suggested products  ' }] } }] }), {
                headers: { 'Content-Type': 'application/json' },
            });
        });
        const result = await request({ prompt: '  Recommend a phone  ' });
        assert.equal(result.statusCode, 200);
        assert.equal(result.body.data.recommendation, 'Suggested products');
        assert.equal(payload.generationConfig.maxOutputTokens, 1024);
    });

    await t.test('abort returns 504 instead of generic 502', async (t) => {
        t.mock.method(console, 'error', () => {});
        t.mock.method(globalThis, 'fetch', async () => { throw new DOMException('Aborted', 'AbortError'); });
        const result = await request({ prompt: 'Recommend a phone' });
        assert.equal(result.statusCode, 504);
        assert.match(result.body.message, /too long/);
    });

    await t.test('rate limit returns 503 without automatic retry', async (t) => {
        t.mock.method(console, 'error', () => {});
        const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: { code: 429, message: 'Quota exceeded' } }), { status: 429 }));
        assert.equal((await request({ prompt: 'Recommend a phone' })).statusCode, 503);
        assert.equal(fetch.mock.callCount(), 1);
    });

    await t.test('configured deadline cancels a request that never responds', async (t) => {
        t.mock.method(console, 'error', () => {});
        process.env.GEMINI_TIMEOUT_MS = '1000';
        t.after(() => { delete process.env.GEMINI_TIMEOUT_MS; });
        t.mock.method(globalThis, 'fetch', (url, options) => new Promise((resolve, reject) => {
            options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
        }));
        // AbortSignal.timeout uses an unref'ed timer; keep this isolated test alive.
        const keepAlive = setInterval(() => {}, 100);
        t.after(() => clearInterval(keepAlive));
        const started = Date.now();
        const result = await request({ prompt: 'Recommend a phone' });
        assert.equal(result.statusCode, 504);
        assert.ok(Date.now() - started < 5000);
    });

    await t.test('invalid timeout fails before network access', async (t) => {
        t.mock.method(console, 'error', () => {});
        process.env.GEMINI_TIMEOUT_MS = 'invalid';
        const fetch = t.mock.method(globalThis, 'fetch', () => { throw Error('Unexpected network call'); });
        assert.equal((await request({ prompt: 'Recommend a phone' })).statusCode, 500);
        assert.equal(fetch.mock.callCount(), 0);
        delete process.env.GEMINI_TIMEOUT_MS;
    });
});
