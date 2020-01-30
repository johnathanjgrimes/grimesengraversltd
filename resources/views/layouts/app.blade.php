<!DOCTYPE html>
<html lang="en-gb">
<head>
    <meta charset="UTF-8">
    <title>@yield('title') | Grimes Engravers Ltd</title>

    <link href="https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css" rel="stylesheet">

    {{-- Custom styles --}}
    @section('styles')
    @show
</head>

<body>

@section('header')
<div class="header p-5">
    <a href="/">
        <img src="/storage/images/grimes-logo-black.png" alt="Grimes Engravers Ltd" class="m-auto w-auto"/>
    </a></div>

<nav class="bg-gray-900 flex font-semibold p-1 shadow-2xl text-sm text-white">
    <ul class="container flex mx-auto p-2 text-white">
        <li class="flex-1 text-center">
            <a href="/commercial-engraving">
                Commercial Engraving
            </a>
        </li>
        <li class="flex-1 text-center">
            <a href="/commercial-engraving">
                Signs & Plaques
            </a>
        </li>
        <li class="flex-1 text-center">
            <a href="/trophies-awards">
                Trophies & Awards
            </a>
        </li>
        <li class="flex-1 text-center">
            <a href="/trophies-awards">
                Presentation Cups
            </a>
        </li>
        <li class="flex-1 text-center">
            <a href="/trophies-awards">
                Glass Awards
            </a>
        </li>
        <li class="flex-1 text-center">
            <a href="/industrial-engraving">
                Industrial Engraving
            </a>
        </li>
        <li class="flex-1 text-center">
            <a href="/contact">
                Contact
            </a>
        </li>
    </ul>
</nav>

@show

@section('content')

@show

@section('scripts')
        <script id="ze-snippet" src="https://static.zdassets.com/ekr/snippet.js?key=d56f3eaa-2b6a-4be7-9e66-8f3197c5cd10"> </script>

        <!-- Global site tag (gtag.js) - Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=UA-10959033-1"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'UA-10959033-1');
        </script>

@show

@section('footer')
    <div class="flex items-center justify-between pb-5 pt-5">
{{--        <button class="px-2 opacity-50 hover:opacity-100 focus:opacity-100"><img class="w-full" src="https://stripe.com/img/v3/payments/overview/logos/kickstarter.svg" alt="" style="max-height: 60px;"></button>--}}
{{--        <button class="px-2 opacity-50 hover:opacity-100 focus:opacity-100"><img class="w-full" src="https://stripe.com/img/v3/payments/overview/logos/slack.svg" alt="" style="max-height: 60px;"></button>--}}
{{--        <button class="px-2 opacity-50 hover:opacity-100 focus:opacity-100"><img class="w-full" src="https://stripe.com/img/v3/payments/overview/logos/glossier.svg" alt="" style="max-height: 60px;"></button>--}}
{{--        <button class="px-2 opacity-50 hover:opacity-100 focus:opacity-100"><img class="w-full" src="https://stripe.com/img/v3/payments/overview/logos/charity_water.svg" alt="" style="max-height: 60px;"></button>--}}
{{--        <button class="px-2 opacity-100 hover:opacity-100 focus:opacity-100"><img class="w-full" src="https://stripe.com/img/v3/payments/overview/logos/missguided.svg" alt="" style="max-height: 60px;"></button>--}}
    </div>

    <footer class="bg-gray-900 p-3 text-gray-100 text-white text-center">
        © {{ now()->year }} Grimes Engravers Ltd. All rights reserved.
    </footer>
@show
<script type="text/javascript" id="cookieinfo"
        src="//cookieinfoscript.com/js/cookieinfo.min.js"
        data-link="#000000"
        data-cookie="CookieInfoScript"
        data-close-text="Got it!">
</script>

</body>

</html>
