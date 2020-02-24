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
     * @param \Illuminate\Http\Request $request
     * @return void
     */
    public function store(Request $request)
    {

        $items = collect($request->items);

        $message = 'New catalogue enquiry for the following: </br></br>';
        $count = 1;
        foreach ($items as $item) {
            $message .= 'Enquiry Item ' . $count . '</br></br>';
            $message .= '<ul>';
                $message .= '<li> Qty: ' . $item['qty'] . '</li>';
                $message .= '<li> Item Description: ' . $item['description'] . '</li>';
                if ($item['engravingOption']) {
                    $message .= '<li> Engraving: ' . $item['engraving'] . '</li>';
                }
            $message .= '</ul>';
                $count ++;
        }
        $message .= $request->additional_comments;

        Mail::to('info@grimesengravers.com')->send(
            new ContactMessage(
                $message,
                $request->name,
                $request->email
            )
        );
    }
}
