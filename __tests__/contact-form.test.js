/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');
const $ = require('jquery');

// Read the script content
const scriptPath = path.resolve(__dirname, '../javascript/custom-script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

describe('Contact Form AJAX Submission', () => {
    beforeEach(() => {
        // Set up our document body
        document.body.innerHTML = `
            <form id="contact-form">
                <input type="text" name="name" />
                <input type="email" name="email" />
                <button type="submit" id="submit">Submit</button>
            </form>
            <div id="snackbar" class=""></div>
            <div id="fail-snackbar" class=""></div>
        `;
        document.querySelector('input[name="name"]').value = 'Test Name';
        document.querySelector('input[name="email"]').value = 'test@example.com';

        // Mock global dependencies used in custom-script.js
        window.jQuery = $;
        window.$ = $;

        // Mock AOS
        window.AOS = {
            init: jest.fn(),
            refresh: jest.fn()
        };

        // Mock Swiper
        window.Swiper = jest.fn();

        // Mock Materialize
        window.Materialize = {
            updateTextFields: jest.fn()
        };

        // Mock setTimeout to execute immediately
        jest.useFakeTimers();

        // Ensure $(document).ready() callbacks are triggered
        $.readyException = function(err) { throw err; };

        // Execute the script in the context of our simulated window/document
        eval(scriptContent);

        $.ready();
    });

    afterEach(() => {
        // Restore mocks and timers
        jest.restoreAllMocks();
        jest.useRealTimers();
        document.body.innerHTML = '';

        // Remove event listeners by replacing nodes or using jQuery's off()
        $('form#contact-form').off();
    });

    it('should handle successful form submission', () => {
        // Mock $.ajax to return a successful deferred object
        const mockAjax = jest.spyOn($, 'ajax').mockImplementation((options) => {
            const d = $.Deferred();
            d.resolve(); // Trigger .done()
            return d.promise();
        });

        const form = $('form#contact-form');
        const submitBtn = $('#submit');
        const snackbar = document.getElementById('snackbar');

        // Create a custom event to capture preventDefault
        const submitEvent = $.Event('submit');

        // Submit the form
        form.trigger('submit');

        // Note: isDefaultPrevented() doesn't always reflect trigger() default prevention correctly
        // in jsdom. We just check if ajax is called to ensure it ran.

        // Check if $.ajax was called with correct arguments
        expect(mockAjax).toHaveBeenCalledTimes(1);
        expect(mockAjax).toHaveBeenCalledWith({
            type: 'POST',
            url: 'email-php/mail_handler.php',
            data: 'name=Test+Name&email=test%40example.com'
        });

        // Check success logic executed in .done()
        expect(snackbar.className).toBe('show');

        // Advance timers to trigger setTimeout (3000ms)
        jest.advanceTimersByTime(3000);
        expect(snackbar.className).toBe('');

        // Form should be reset (values empty)
        expect(form.find('input[name="name"]').val()).toBe('');
        expect(form.find('input[name="email"]').val()).toBe('');

        // Materialize.updateTextFields should be called
        expect(window.Materialize.updateTextFields).toHaveBeenCalled();

        // Submit button should be re-enabled
        expect(submitBtn.attr('disabled')).toBeUndefined();
    });

    it('should handle failed form submission', () => {
        // Mock $.ajax to return a failed deferred object
        const mockAjax = jest.spyOn($, 'ajax').mockImplementation((options) => {
            const d = $.Deferred();
            d.reject(); // Trigger .fail()
            return d.promise();
        });

        const form = $('form#contact-form');
        const submitBtn = $('#submit');
        const failSnackbar = document.getElementById('fail-snackbar');

        // Submit the form
        form.trigger('submit');

        // Check if $.ajax was called
        expect(mockAjax).toHaveBeenCalledTimes(1);

        // Check failure logic executed in .fail()
        expect(failSnackbar.className).toBe('show');

        // Advance timers to trigger setTimeout (3000ms)
        jest.advanceTimersByTime(3000);
        expect(failSnackbar.className).toBe('');

        // Form should be reset (values empty)
        expect(form.find('input[name="name"]').val()).toBe('');
        expect(form.find('input[name="email"]').val()).toBe('');

        // Materialize.updateTextFields should be called
        expect(window.Materialize.updateTextFields).toHaveBeenCalled();

        // Submit button should be re-enabled
        expect(submitBtn.attr('disabled')).toBeUndefined();
    });
});
