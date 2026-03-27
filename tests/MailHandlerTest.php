<?php

use PHPUnit\Framework\TestCase;

// Define constant so that mail_handler.php doesn't execute handle_mail($_POST) on inclusion
if (!defined('PHPUNIT_RUNNING')) {
    define('PHPUNIT_RUNNING', true);
}

require_once __DIR__ . '/../email-php/mail_handler.php';

class MailHandlerTest extends TestCase
{
    private $postData;

    protected function setUp(): void
    {
        $this->postData = [
            'name' => 'John Doe',
            'subject' => 'Test Subject',
            'email' => 'johndoe@example.com',
            'message' => 'This is a test message.'
        ];
    }

    public function testHandleMailSuccess()
    {
        $mailerMock = function ($mailto, $subject, $message, $headers) {
            $this->assertEquals('omaramin.1992@gmail.com', $mailto);
            $this->assertEquals('From Decent Material CV | Resume', $subject);
            $this->assertStringContainsString('John Doe', $message);
            $this->assertStringContainsString('johndoe@example.com', $message);
            $this->assertStringContainsString('Test Subject', $message);
            $this->assertStringContainsString('This is a test message.', $message);
            $this->assertStringContainsString('From: John Doe <johndoe@example.com>', $headers);
            return true;
        };

        ob_start();
        handle_mail($this->postData, $mailerMock);
        $output = ob_get_clean();

        $this->assertEquals('Sent', $output);
    }

    public function testHandleMailFailure()
    {
        $mailerMock = function ($mailto, $subject, $message, $headers) {
            return false;
        };

        ob_start();
        handle_mail($this->postData, $mailerMock);
        $output = ob_get_clean();

        $this->assertEquals('Failed', $output);
    }

    public function testHandleMailMissingFields()
    {
        $emptyData = [];

        $mailerMock = function ($mailto, $subject, $message, $headers) {
            $this->assertStringContainsString('Name</b>:  <br>', $message);
            $this->assertStringContainsString('Email</b>: <br>', $message);
            $this->assertStringContainsString('Subject</b>:  <br>', $message);
            $this->assertStringContainsString('Message</b>: </p>', $message);
            return true;
        };

        ob_start();
        handle_mail($emptyData, $mailerMock);
        $output = ob_get_clean();

        $this->assertEquals('Sent', $output);
    }

    public function testHandleMailHeaderInjectionStrip()
    {
        $maliciousData = [
            'name' => "John\r\nBcc: hacker@example.com",
            'subject' => "Test\r\nSubject",
            'email' => "john@example.com\r\nCc: another@example.com",
            'message' => 'Message content'
        ];

        $mailerMock = function ($mailto, $subject, $message, $headers) {
            // The name and email should have stripped out "\r" and "\n"
            $this->assertStringNotContainsString("John\r\n", $headers);
            $this->assertStringNotContainsString("john@example.com\r\nCc", $headers);
            $this->assertStringContainsString("JohnBcc: hacker@example.com", $headers);
            $this->assertStringContainsString("john@example.comCc: another@example.com", $headers);
            return true;
        };

        ob_start();
        handle_mail($maliciousData, $mailerMock);
        $output = ob_get_clean();

        $this->assertEquals('Sent', $output);
    }
}
