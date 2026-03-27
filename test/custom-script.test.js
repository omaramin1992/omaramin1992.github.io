/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');
const $ = require('jquery');

describe('Pricing table logic', () => {

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <div id="month-btn">Month</div>
            <div id="year-btn">Year</div>
            <div id="month" style="display: none;">Month Pricing</div>
            <div id="year" style="display: none;">Year Pricing</div>

            <div id="page-loader"></div>
            <div id="intro"></div>
            <div id="intro-div"></div>
            <div id="profile"></div>
            <ul class="simple-filter"><li></li></ul>
            <div class="filtr-container"></div>
            <div id="nav-btn"></div>
            <div id="side-nav"></div>
            <div id="side-nav-mask"></div>
            <a class="nav-link"></a>
            <div class="skill-progress"><div class="skill-determinate" data-percent="50%"></div></div>
            <div id="btn-1"></div><div id="content-1"></div>
            <div id="client-slider"></div>
            <div class="back-to-top"></div>
            <form id="contact-form"></form>
        `;

        window.$ = window.jQuery = $;

        // Mock objects used in custom-script.js
        window.Swiper = class Swiper { constructor() {} };
        window.AOS = { init: jest.fn(), refresh: jest.fn() };
        window.Materialize = { updateTextFields: jest.fn() };
        $.fn.filterizr = jest.fn();
        $.fn.animate = jest.fn(function() { return this; });
        $.fn.slideToggle = jest.fn(function() { return this; });
        $.fn.fadeOut = jest.fn(function() { return this; });

        // Ensure DOM is ready, standard way
        let scriptContent = fs.readFileSync(path.resolve(__dirname, '../javascript/custom-script.js'), 'utf8');

        // Fix syntax error caused by older jquery allowing unquoted attributes that newer jquery blocks
        scriptContent = scriptContent.replace(/\$\('a\[href\*\=\#\]\:not\(\[href\=\#\]\)'\)/g, "$('a[href*=\"#\"]:not([href=\"#\"])')");
        scriptContent = scriptContent.replace(/\$\(window\)\.load\(/g, "$(window).on('load', ");

        eval(`
            const originalReady = $.fn.ready;
            // mock the root level jQuery function to capture $(document).ready
            // in jquery $(fn) is equivalent to $(document).ready(fn)
            const oldInit = $.fn.init;
            $.fn.init = function(selector, context, root) {
                if (typeof selector === 'function') {
                    selector(); // Execute immediately
                    return this;
                }
                if (selector === document && typeof context === 'function') {
                    // But actually $(document).ready(function() { ... })
                    // wait $(document) just returns a jquery object which has a ready method.
                }
                return oldInit.apply(this, arguments);
            };
            $.fn.init.prototype = $.fn;

            $.fn.ready = function(fn) {
                fn(); // Execute immediately
                return this;
            };

            ${scriptContent}

            $.fn.ready = originalReady;
            $.fn.init = oldInit;
        `);
    });

    it('initializes with month pricing shown and year pricing hidden', () => {
        expect($('#month')[0].style.display).not.toBe('none');
        expect($('#year')[0].style.display).toBe('none');
    });

    it('shows year pricing and hides month pricing when year button is clicked', () => {
        $('#year-btn').trigger('click');

        expect($('#month')[0].style.display).toBe('none');
        expect($('#year')[0].style.display).not.toBe('none');

        expect($('#year').hasClass('animated')).toBe(true);
        expect($('#year').hasClass('fadeIn')).toBe(true);
        expect($('#year-btn').hasClass('active-cat')).toBe(true);
        expect($('#year-btn').hasClass('animated')).toBe(true);
        expect($('#month-btn').hasClass('active-cat')).toBe(false);
    });

    it('shows month pricing and hides year pricing when month button is clicked', () => {
        $('#year-btn').trigger('click');
        $('#month-btn').trigger('click');

        expect($('#month')[0].style.display).not.toBe('none');
        expect($('#year')[0].style.display).toBe('none');

        expect($('#month').hasClass('animated')).toBe(true);
        expect($('#month').hasClass('fadeIn')).toBe(true);
        expect($('#month-btn').hasClass('active-cat')).toBe(true);
        expect($('#year-btn').hasClass('active-cat')).toBe(false);
    });
});
