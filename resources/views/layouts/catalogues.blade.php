<!DOCTYPE html>
<html lang="en-gb">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta http-equiv="Content-Language" content="en">
    <meta name="google" content="notranslate">
    <link rel="icon" type="image/x-icon" href="/storage/images/grimes-icon.png">
    <link rel="shortcut icon" type="image/x-icon" href="/storage/images/grimes-icon.png">
    <meta name="robots" content="INDEX,FOLLOW">
    <meta name="description" content="The complete sign service. Professional Engravers, Sign Makers, ... We can engrave nameplates & memorial plaques in brass anodised aluminium">

    {{-- Viewport --}}
    @section('viewport')
        <meta name="viewport" content="width=device-width, initial-scale=1">
    @show

    <title>@yield('title') | Grimes Engravers Ltd</title>

    <link href="https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.12.0/css/all.min.css" rel="stylesheet">
    {{-- Custom styles --}}
    @section('styles')
    @show
</head>

<body>

@section('content')

@show

<div class="iframe-container">
    <iframe src="@yield('catalogue-url')" allowfullscreen></iframe>
</div>

<div class="bg-white order-now p-5 shadow-lg">
    <img src="/storage/images/grimes-logo-black.png" alt="Grimes Engravers Ltd" class="pb-5 pt-5 text-center"/>

    <h2 class="mb-5 text-2xl">Order From The Catalogue Below:</h2>
    <form class="w-full">
        <div class="flex flex-wrap -mx-3 mb-6">
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="grid-first-name">
                    First Name
                </label>
                <input class="appearance-none block w-full bg-gray-200 text-gray-700 border border-red-500 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white" id="grid-first-name" type="text" placeholder="Jane">
                <p class="text-red-500 text-xs italic">Please fill out this field.</p>
            </div>
            <div class="w-full md:w-1/2 px-3">
                <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="grid-last-name">
                    Last Name
                </label>
                <input class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="grid-last-name" type="text" placeholder="Doe">
            </div>
        </div>
        <div class="flex flex-wrap -mx-3 mb-6">
            <div class="w-full px-3">
                <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="grid-password">
                    Password
                </label>
                <input class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="grid-password" type="password" placeholder="******************">
                <p class="text-gray-600 text-xs italic">Make it as long and as crazy as you'd like</p>
            </div>
        </div>
        <div class="flex flex-wrap -mx-3 mb-2">
            <div class="w-full md:w-1/3 px-3 mb-6 md:mb-0">
                <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="grid-city">
                    City
                </label>
                <input class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="grid-city" type="text" placeholder="Albuquerque">
            </div>
            <div class="w-full md:w-1/3 px-3 mb-6 md:mb-0">
                <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="grid-state">
                    State
                </label>
                <div class="relative">
                    <select class="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="grid-state">
                        <option>New Mexico</option>
                        <option>Missouri</option>
                        <option>Texas</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>
            <div class="w-full md:w-1/3 px-3 mb-6 md:mb-0">
                <label class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" for="grid-zip">
                    Zip
                </label>
                <input class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="grid-zip" type="text" placeholder="90210">
            </div>
        </div>
        <button class="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow">Submit</button>
    </form>
</div>

<style>
    .iframe-container {
        /* overflow: hidden; */
        /* padding-top: 56.25%; */
        /* position: relative; */
        height: 100%;
    }

    .iframe-container iframe {
        border: 0;
        height: 100%;
        left: 0;
        position: absolute;
        top: 0;
        width: 100%;
    }

    /* 4x3 Aspect Ratio */
    .iframe-container-4x3 {
        padding-top: 75%;
    }
    .order-now {
        -webkit-overflow-scrolling: touch;
        -webkit-transition: left .3s;
        -moz-transition: left .3s;
        -ms-transition: left .3s;
        transition: left .3s;
        height: 100%;
        left: -50%;
        overflow: auto;
        position: fixed;
        top: 0;
        width: 80%;
        width: 50%;
    }

    .order-now .open{
        left: 0;
    }
</style>

<div class="absolute bg-white bottom-0 cursor-pointer font-semibold hover:bg-gray-100 left-0 m-5 order-now-button px-4 py-2 rounded shadow-lg text-gray-800 text-white mb-12 text-xs md:text-base lg:text-base">
    <a href="/trophies-awards"><i class="fas fa-caret-left mr-1"></i> Back to Catalogues</a>
</div>

<div class="absolute bg-green-600 bottom-0 cursor-pointer hover:bg-green-500 m-5 order-now-button px-4 py-2 right-0 rounded text-white mb-12 font-semibold text-xs md:text-base lg:text-base">
    <a href="/contact" target="_blank">Order Now <i class="fas fa-shopping-basket ml-1"></i></a>
</div>


@section('scripts')
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=UA-10959033-1"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'UA-10959033-1');
    </script>



@show


</body>

</html>
