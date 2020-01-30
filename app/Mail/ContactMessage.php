<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactMessage extends Mailable
{
    use Queueable;
    use SerializesModels;

    /**
     * The name of the person who has sent the contact message.
     *
     * @var string
     */
    public $name;

    /**
     * The email address of the person who has sent the contact message.
     *
     * @var string
     */
    public $email;

    /**
     * The topic of customser service.
     *
     * @var string
     */
    public $topic;

    /**
     * The body of the message.
     *
     * @var string
     */
    public $body;

    /**
     * The user sending the contact message, if applicable.
     *
     * @var \App\User|null
     */
    public $user;

    /**
     * Create a new object instance.
     *
     * @param  string  $body
     * @param  string  $name
     * @param  string  $email
     * @return void
     */
    public function __construct($body, $name = null, $email = null)
    {
        $this->name =  $name;
        $this->email = $email;
        $this->body = $body;
    }

    /**
     * Build the mailable.
     *
     * @return $this
     */
    public function build()
    {
        return $this
            ->from('no-reply@grimesengravers.com', 'Grimes Engravers Ltd')
            ->subject('Contact message from website.')
            ->replyTo($this->email, $this->name)
            ->view('emails.contact');
    }
}
