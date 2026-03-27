<?php

function handle_mail($post_data, $mailer = 'mail') {
    /* Replace with your email address here */
    $mailto  = 'omaramin.1992@gmail.com';

    $name       = isset($post_data['name']) ? str_replace(["\r", "\n"], '', strip_tags($post_data['name'])) : '';
    $sub        = isset($post_data['subject']) ? strip_tags($post_data['subject']) : '';
    $email      = isset($post_data['email']) ? str_replace(["\r", "\n"], '', strip_tags($post_data['email'])) : '';
    $message_content = isset($post_data['message']) ? strip_tags($post_data['message']) : '';

    $subject = "From Decent Material CV | Resume";

    // HTML for email to send submission details
    $body = "
<p><b>Name</b>: $name <br>
<b>Email</b>: $email<br>
<p><b>Subject</b>: $sub <br>
<p><b>Message</b>: $message_content</p>
";

    // Success Message
    $success = "Sent";
    $error = "Failed";

    $headers = "From: $name <$email> \r\n";
    $headers .= "Reply-To: $email \r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=ISO-8859-1\r\n";
    $headers2 = "From:" . $mailto;
    $message = "<html><body>$body</body></html>";

    if (is_callable($mailer)) {
        $result = call_user_func($mailer, $mailto, $subject, $message, $headers);
    } else {
        $result = mail($mailto, $subject, $message, $headers);
    }

    if ($result) {
        echo "$success"; // success
    } else {
        echo "$error"; // failure
    }
}

// Only execute directly if we are not running tests
if (!defined('PHPUNIT_RUNNING')) {
    handle_mail($_POST);
}
