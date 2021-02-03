
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.0' }, detail)));
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var n=function(){return (n=Object.assign||function(n){for(var e,t=1,r=arguments.length;t<r;t++)for(var o in e=arguments[t])Object.prototype.hasOwnProperty.call(e,o)&&(n[o]=e[o]);return n}).apply(this,arguments)};function e(n,e,t,r){return new(t||(t=Promise))((function(o,i){function a(n){try{c(r.next(n));}catch(n){i(n);}}function u(n){try{c(r.throw(n));}catch(n){i(n);}}function c(n){var e;n.done?o(n.value):(e=n.value,e instanceof t?e:new t((function(n){n(e);}))).then(a,u);}c((r=r.apply(n,e||[])).next());}))}function t(n,e){var t,r,o,i,a={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return i={next:u(0),throw:u(1),return:u(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function u(i){return function(u){return function(i){if(t)throw new TypeError("Generator is already executing.");for(;a;)try{if(t=1,r&&(o=2&i[0]?r.return:i[0]?r.throw||((o=r.return)&&o.call(r),0):r.next)&&!(o=o.call(r,i[1])).done)return o;switch(r=0,o&&(i=[2&i[0],o.value]),i[0]){case 0:case 1:o=i;break;case 4:return a.label++,{value:i[1],done:!1};case 5:a.label++,r=i[1],i=[0];continue;case 7:i=a.ops.pop(),a.trys.pop();continue;default:if(!(o=a.trys,(o=o.length>0&&o[o.length-1])||6!==i[0]&&2!==i[0])){a=0;continue}if(3===i[0]&&(!o||i[1]>o[0]&&i[1]<o[3])){a.label=i[1];break}if(6===i[0]&&a.label<o[1]){a.label=o[1],o=i;break}if(o&&a.label<o[2]){a.label=o[2],a.ops.push(i);break}o[2]&&a.ops.pop(),a.trys.pop();continue}i=e.call(n,a);}catch(n){i=[6,n],r=0;}finally{t=o=0;}if(5&i[0])throw i[1];return {value:i[0]?i[1]:void 0,done:!0}}([i,u])}}}function r(){return Math.floor(65536*(1+Math.random())).toString(16).substring(1)}function o(n){window.__TAURI_INVOKE_HANDLER__(n);}function i(n,e){void 0===e&&(e=!1);var t=r()+r()+"-"+r()+"-"+r()+"-"+r()+"-"+r()+r()+r();return Object.defineProperty(window,t,{value:function(r){return e&&Reflect.deleteProperty(window,t),null==n?void 0:n(r)},writable:!1,configurable:!0}),t}function a(r){return e(this,void 0,void 0,(function(){return t(this,(function(e){switch(e.label){case 0:return [4,new Promise((function(e,t){var a=i((function(n){e(n),Reflect.deleteProperty(window,u);}),!0),u=i((function(n){t(n),Reflect.deleteProperty(window,a);}),!0);o(n({callback:a,error:u},r));}))];case 1:return [2,e.sent()]}}))}))}Object.freeze({__proto__:null,invoke:o,transformCallback:i,promisified:a});

    function r$1(){return e(this,void 0,void 0,(function(){return t(this,(function(t){switch(t.label){case 0:return [4,a({cmd:"cliMatches"})];case 1:return [2,t.sent()]}}))}))}Object.freeze({__proto__:null,getMatches:r$1});

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /*!
      Copyright (c) 2017 Jed Watson.
      Licensed under the MIT License (MIT), see
      http://jedwatson.github.io/classnames
    */

    var classnames = createCommonjsModule(function (module) {
    /* global define */

    (function () {

    	var hasOwn = {}.hasOwnProperty;

    	function classNames () {
    		var classes = [];

    		for (var i = 0; i < arguments.length; i++) {
    			var arg = arguments[i];
    			if (!arg) continue;

    			var argType = typeof arg;

    			if (argType === 'string' || argType === 'number') {
    				classes.push(arg);
    			} else if (Array.isArray(arg) && arg.length) {
    				var inner = classNames.apply(null, arg);
    				if (inner) {
    					classes.push(inner);
    				}
    			} else if (argType === 'object') {
    				for (var key in arg) {
    					if (hasOwn.call(arg, key) && arg[key]) {
    						classes.push(key);
    					}
    				}
    			}
    		}

    		return classes.join(' ');
    	}

    	if ( module.exports) {
    		classNames.default = classNames;
    		module.exports = classNames;
    	} else {
    		window.classNames = classNames;
    	}
    }());
    });

    /* src/App.svelte generated by Svelte v3.32.0 */

    const { window: window_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main_1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main_1 = element("main");
    			attr_dev(main_1, "class", "overflow-y-scroll");
    			add_location(main_1, file, 184105, 0, 4340262);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main_1, anchor);
    			/*main_1_binding*/ ctx[2](main_1);

    			if (!mounted) {
    				dispose = listen_dev(window_1, "keydown", /*handleKeydown*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main_1);
    			/*main_1_binding*/ ctx[2](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function isElementInViewport(el) {
    	let rect = el.getBoundingClientRect();
    	return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let selectedOption = 0;
    	let data = null;
    	let splitdata = [];
    	let main = null;

    	const updateData = () => {
    		splitdata = data.split("<li");
    		splitdata.shift();

    		$$invalidate(
    			0,
    			main.innerHTML = splitdata.map((s, i) => {
    				return `<div class="${classnames("", { "bg-gray-600": i === selectedOption })}"><li${s}</div>`;
    			}).join(""),
    			main
    		);

    		[...document.getElementsByTagName("li")].forEach(e => {
    			const originalClass = e.getAttribute("class");
    			e.setAttribute("class", classnames(originalClass, "list-none"));
    		});
    	};

    	onMount(async () => {
    		const matches = await r$1();
    		data = matches.args.source.value;
    		updateData();
    	});

    	const handleKeydown = e => {
    		switch (e.key) {
    			case "j":
    				{
    					if (selectedOption < splitdata.length - 1) {
    						selectedOption += 1;
    						updateData();
    						let thisLi = document.querySelectorAll("li")[selectedOption];

    						if (!isElementInViewport(thisLi)) {
    							thisLi.scrollIntoView();
    						}
    					}

    					break;
    				}
    			case "k":
    				{
    					if (selectedOption > 0) {
    						selectedOption -= 1;
    						updateData();
    						let thisLi = document.querySelectorAll("li")[selectedOption];

    						if (!isElementInViewport(thisLi)) {
    							thisLi.scrollIntoView();
    						}
    					}

    					break;
    				}
    			case "q":
    				{
    					// kill the application
    					o({ cmd: "exit" });

    					break;
    				}
    			case "1":
    				{
    					const output = [...document.querySelectorAll("li")][0].getAttribute("output");
    					o({ cmd: "sendToStandardOutAndExit", output });
    					break;
    				}
    			case "2":
    				{
    					const output = [...document.querySelectorAll("li")][1].getAttribute("output");
    					o({ cmd: "sendToStandardOutAndExit", output });
    					break;
    				}
    			case "3":
    				{
    					const output = [...document.querySelectorAll("li")][2].getAttribute("output");
    					o({ cmd: "sendToStandardOutAndExit", output });
    					break;
    				}
    			case "4":
    				{
    					const output = [...document.querySelectorAll("li")][3].getAttribute("output");
    					o({ cmd: "sendToStandardOutAndExit", output });
    					break;
    				}
    			case "5":
    				{
    					const output = [...document.querySelectorAll("li")][4].getAttribute("output");
    					o({ cmd: "sendToStandardOutAndExit", output });
    					break;
    				}
    			case "6":
    				{
    					const output = [...document.querySelectorAll("li")][5].getAttribute("output");
    					o({ cmd: "sendToStandardOutAndExit", output });
    					break;
    				}
    			case "7":
    				{
    					const output = [...document.querySelectorAll("li")][6].getAttribute("output");
    					o({ cmd: "sendToStandardOutAndExit", output });
    					break;
    				}
    			case "8":
    				{
    					const output = [...document.querySelectorAll("li")][7].getAttribute("output");
    					o({ cmd: "sendToStandardOutAndExit", output });
    					break;
    				}
    			case "9":
    				{
    					const output = [...document.querySelectorAll("li")][8].getAttribute("output");
    					o({ cmd: "sendToStandardOutAndExit", output });
    					break;
    				}
    			case "0":
    				{
    					const output = [...document.querySelectorAll("li")][9].getAttribute("output");
    					o({ cmd: "sendToStandardOutAndExit", output });
    					break;
    				}
    			case "Enter":
    				{
    					// find the li that is selected and get it's output attribute
    					const output = [...document.querySelectorAll("li")][selectedOption].getAttribute("output");

    					o({ cmd: "sendToStandardOutAndExit", output });
    					break;
    				}
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function main_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			main = $$value;
    			$$invalidate(0, main);
    		});
    	}

    	$$self.$capture_state = () => ({
    		getMatches: r$1,
    		onMount,
    		cx: classnames,
    		invoke: o,
    		selectedOption,
    		data,
    		splitdata,
    		main,
    		isElementInViewport,
    		updateData,
    		handleKeydown
    	});

    	$$self.$inject_state = $$props => {
    		if ("selectedOption" in $$props) selectedOption = $$props.selectedOption;
    		if ("data" in $$props) data = $$props.data;
    		if ("splitdata" in $$props) splitdata = $$props.splitdata;
    		if ("main" in $$props) $$invalidate(0, main = $$props.main);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [main, handleKeydown, main_1_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
      props: {},
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
