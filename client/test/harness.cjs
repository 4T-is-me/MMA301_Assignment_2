// Runs the real module with mocked native/service boundaries. This is a hook
// lifecycle simulator, not a renderer or evidence of device execution.
/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

function loadModule(relativePath, mocks = {}) {
    const filename = path.resolve(__dirname, '..', relativePath);
    const { code } = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
        filename, babelrc: false, configFile: false,
        plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
    });
    const module = { exports: {} };
    // Expo supports automatic JSX; the classic transform here uses this mock React.
    const context = { module, exports: module.exports, React: mocks.react, console, process, AbortController, AbortSignal, setTimeout, clearTimeout, Promise,
        require(name) {
            if (Object.hasOwn(mocks, name)) return mocks[name];
            throw new Error(`Unmocked dependency: ${name} in ${relativePath}`);
        },
    };
    vm.runInNewContext(code, context, { filename });
    return module.exports;
}

function createHooks() {
    let cursor = 0;
    let dirty = false;
    let component;
    let props = {};
    let tree;
    const hooks = [];
    const pending = [];
    const react = {
        createContext: () => ({ Provider: 'Provider' }),
        createElement: (type, elementProps, ...children) => ({ type, props: { ...elementProps, children } }),
        useContext: context => context.value,
        useState(initial) {
            const index = cursor++;
            if (!hooks[index]) hooks[index] = { value: typeof initial === 'function' ? initial() : initial };
            return [hooks[index].value, value => {
                const next = typeof value === 'function' ? value(hooks[index].value) : value;
                if (!Object.is(next, hooks[index].value)) { hooks[index].value = next; dirty = true; }
            }];
        },
        useRef(initial) {
            const index = cursor++;
            if (!hooks[index]) hooks[index] = { current: initial };
            return hooks[index];
        },
        useEffect(callback, deps) {
            const index = cursor++;
            const previous = hooks[index];
            if (!previous || !deps || deps.some((value, i) => !Object.is(value, previous.deps?.[i]))) {
                hooks[index] = { deps, cleanup: previous?.cleanup };
                pending.push(() => { hooks[index].cleanup?.(); hooks[index].cleanup = callback(); });
            }
        },
        useLayoutEffect(callback, deps) { return react.useEffect(callback, deps); },
        useMemo(callback, deps) {
            const index = cursor++;
            if (!hooks[index] || deps.some((value, i) => !Object.is(value, hooks[index].deps[i]))) hooks[index] = { value: callback(), deps };
            return hooks[index].value;
        },
        useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    };
    react.memo = value => value;
    function render() {
        cursor = 0; dirty = false;
        tree = component(props);
        pending.splice(0).forEach(effect => effect());
        return tree;
    }
    return {
        react,
        mount(fn, initialProps = {}) { component = fn; props = initialProps; render(); },
        render,
        updateProps(next) { props = next; return render(); },
        async settle() {
            for (let i = 0; i < 20; i++) {
                await new Promise(resolve => setImmediate(resolve));
                if (dirty) render(); else return tree;
            }
            throw new Error('Hook simulator did not settle');
        },
        get tree() { return tree; },
        get value() { return tree?.props?.value; },
        unmount() { hooks.forEach(hook => hook?.cleanup?.()); },
    };
}

module.exports = { loadModule, createHooks };
