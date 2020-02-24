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
    @section('description','One of the biggest suppliers of trophies and medals, nickel plated trophy cups, glass trophies, glass awards, football trophies in Cardiff. Enquire today!')
    <meta name="description" content="@yield('description')">
    {{-- Viewport --}}
    @section('viewport')
        <meta name="viewport" content="width=device-width, initial-scale=1">
    @show

    <title>@yield('title')</title>

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
<div id="app">

    <catalogue-order-form :visible="quickViewVisible"></catalogue-order-form>

<div class="absolute bg-white bottom-0 cursor-pointer font-semibold hover:bg-gray-100 left-0 m-5 order-now-button px-4 py-2 rounded shadow-lg text-gray-800 text-white mb-12 text-xs md:text-base lg:text-base">
    <a href="/trophies-awards"><i class="fas fa-caret-left mr-1"></i> Back to Catalogues</a>
</div>

<div class="absolute bg-green-600 bottom-0 cursor-pointer hover:bg-green-500 m-5 order-now-button px-4 py-2 right-0 rounded text-white mb-12 font-semibold text-xs md:text-base lg:text-base">
    <a @click="quickViewVisible = !quickViewVisible">Order Now <i class="fas fa-shopping-basket ml-1"></i></a>
</div>
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

</style>


@section('scripts')
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=UA-10959033-1"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'UA-10959033-1');
    </script>

    <script src="{{ mix('js/app.js') }}"></script>
@show


</body>

</html>
