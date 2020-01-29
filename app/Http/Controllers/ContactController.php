<?php

namespace App\Http\Controllers;

use App\Mail\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    /**
     * Validate the guest feedback message, send an internal notification and internal email.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return void
     */
    public function storeLoggedOutMessage(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email',
            'message' => 'required|string',
        ]);

        // If the 'comment' field has any data, it is likely this was a spam message and therefore block it.
        if (!is_null($request->comment)) {
            Cache::put('spam_message_count', (int) Cache::get('spam_message_count') + 1, 86400);
            abort(500);
        }


        $subject = $this->topics[$request->topic];

        Mail::to('info@grimesengravers.com')->send(
            new ContactMessage(
                $subject,
                $request->message,
                $request->name,
                $request->email
            )
        );
    }
}
