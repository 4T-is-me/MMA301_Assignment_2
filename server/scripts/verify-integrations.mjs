/**
 * Author: trangtttce191027
 */
// Opt-in read-only external checks; never called by npm test.
import dotenv from 'dotenv';
import express from 'express';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { recommendationRoutes } from '../src/routes/recommendationRoutes.js';

if (!process.argv.includes('--live')) throw new Error('Pass --live to allow DummyJSON and Gemini requests.');
dotenv.config({ quiet: true });
const results = [];
async function check(id, action) {
    const start = Date.now();
    try {
        const detail = await action();
        results.push({ id, status: 'Passed', elapsedMs: Date.now() - start, detail });
    } catch (error) {
        results.push({ id, status: 'Failed', elapsedMs: Date.now() - start, error: error.code || error.name });
        process.exitCode = 1;
    }
}
const catalogFetch = async suffix => {
    const response = await fetch(`https://dummyjson.com/products${suffix}`, { signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200);
    return response.json();
};
await check('M8-LIVE-CATALOG', async () => {
    const first = await catalogFetch('?limit=20&skip=0');
    const next = await catalogFetch('?limit=20&skip=20');
    const end = await catalogFetch(`?limit=20&skip=${first.total}`);
    const category = await catalogFetch('/category/smartphones?limit=20');
    const detail = await catalogFetch(`/${first.products[0].id}`);
    assert.equal(detail.id, first.products[0].id);
    assert.equal(new Set([...first.products, ...next.products].map(product => product.id)).size, first.products.length + next.products.length);
    assert.equal(end.products.length, 0);
    assert.ok(category.products.every(product => product.category === 'smartphones'));
    return { firstPage: first.products.length, nextPage: next.products.length, endPage: 0, categoryCount: category.products.length, detailId: detail.id };
});
const app = express();
app.use(express.json());
app.use('/api/recommendations', recommendationRoutes.router);
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
try {
    const post = async prompt => {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/api/recommendations`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }), signal: AbortSignal.timeout(80000),
        });
        return { status: response.status, body: await response.json() };
    };
    await check('M8-LIVE-INPUT', async () => {
        assert.equal((await post(' ')).status, 400);
        assert.equal((await post('x'.repeat(1001))).status, 400);
        return 'Empty and oversized prompts rejected at Express endpoint.';
    });
    await check('M8-LIVE-AI', async () => {
        const result = await post('Recommend an in-stock smartphone under $500 with a good camera.');
        assert.equal(result.status, 200);
        const items = result.body.data.recommendations;
        assert.ok(items.length > 0 && items.length <= 3);
        const ids = new Set();
        for (const { product, reason } of items) {
            assert.ok(product.stock > 0 && product.price < 500);
            assert.equal(product.category, 'smartphones');
            assert.ok(reason.trim() && !ids.has(product.id));
            const actual = await catalogFetch(`/${product.id}`);
            assert.equal(actual.title, product.title);
            assert.equal(actual.price, product.price);
            ids.add(product.id);
        }
        return { httpStatus: 200, mappedProductIds: [...ids] };
    });
} finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
const report = { date: '2026-10-17', scope: 'Read-only HTTP + Express; no device/Firebase writes', results };
await writeFile(new URL('../../docs/evidence/M8/live.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
