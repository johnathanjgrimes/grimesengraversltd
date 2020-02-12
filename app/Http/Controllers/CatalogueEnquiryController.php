<?php

namespace App\Http\Controllers;

use App\Mail\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;


class CatalogueEnquiryController extends Controller
{
    /**
     * Validate the guest feedback message, send an internal notification and internal email.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return void
     */
    public function store(Request $request)
    {
       $message = json_encode($request->all());
//        Mail::to('info@grimesengravers.com')->send(
//            new ContactMessage(
//                 $message,
//                'test',
//                'grimes.johnathan3@gmail.com'
//            )
//        );
    }
}
