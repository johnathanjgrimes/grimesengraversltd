@extends('layouts.app')
@section('title','Contact Us')

@section('styles')
@endsection

@section('content')
    <div class="container mx-auto">
        <h1 class="pb-5 pt-10 text-3xl px-6 py-4">Contact Us</h1>
        <div class="flex flex-col lg:flex-row overflow-hidden px-6 py-4 rounded shadow-lg w-full">
            <div class="pr-0 lg:pr-20 w-full lg:w-1/2">
                <p>Jot us a note and we’ll get back to you as quickly as possible.</p>

                <h2 class="pb-2 pt-2 text-2xl">Contact Details</h2>
                <p>Tel: <span>02920 795 343</span></p>
                <p>Email: <span><a href="mailto:info@grimesengravers.com">info@grimesengravers.com</a></span</p>

                <h2 class="pb-2 pt-2 text-2xl">Address</h2>
                We work by appointment only. If you need our address please get in touch using one of the
                methods above.
            </div>
            <div class="mt-12 lg:mt-0 w-full lg:w-1/2">
                @if(session()->has('message'))
                    <div class="bg-teal-100 border-t-4 border-teal-500 mb-5 px-4 py-3 rounded-b shadow-md text-teal-900" role="alert">
                        <div class="flex items-center">
                            <div class="py-1"><svg class="fill-current h-6 w-6 text-teal-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"></path></svg></div>
                            <div>
                                <p class="text-sm">{{ session()->get('message') }}</p>
                            </div>
                        </div>
                    </div>
                @endif
                <form action="/contact" method="POST">
                        {{ csrf_field() }}
                        <div class="flex flex-wrap -mx-3 mb-6">
                            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                                <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                                    Name <span class="text-red-500 text-xs italic">*</span>
                                </label>
                                <input class="@error('name') border border-red-500 @enderror appearance-none block w-full bg-gray-200 text-gray-700 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white" name="name" type="text" placeholder="Jane">
                            </div>
                            <div class="w-full md:w-1/2 px-3">
                                <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="grid-last-name">
                                    Email <span class="text-red-500 text-xs italic">*</span>
                                </label>
                                <input class="@error('email') border border-red-500 @enderror appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" name="email" type="email" placeholder="jane@gmail.com">
                            </div>
                        </div>
                        <div class="flex flex-wrap -mx-3 mb-6">
                            <div class="w-full px-3">
                                <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="grid-password">
                                    Message <span class="text-red-500 text-xs italic">*</span>
                                </label>
                                <textarea class="@error('message') border border-red-500 @enderror appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" name="message" rows="4" cols="50"></textarea>
                            </div>
                        </div>
                        <input type="comment" class="hidden invisible" />
                        <button class="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow">Submit</button>
                    </form>
            </div>
        </div>
    </div>
@endsection
