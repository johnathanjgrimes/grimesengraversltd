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
    public function store(Request $request)
    {

        $request->validate([
            'name' => 'required',
            'email' => 'required|email',
            'message' => 'required|string',
        ]);

        // If the 'comment' field has any data, it is likely this was a spam message and therefore block it.
        if (!is_null($request->comment)) {
            abort(500);
        }

        Mail::to('info@grimesengravers.com')->send(
            new ContactMessage(
                $request->message,
                $request->name,
                $request->email
            )
        );

        return redirect()->back()->with('message', 'Message sent successfully!');

    }
}
