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
    <title>@yield('title') | Grimes Engravers Ltd</title>
    @section('description','Providing trophies and medals, glass awards, glass trophies, personalised plaques, presentation trophies industrial engraving in Cardiff. Enquire today!')
    <meta name="description" content="@yield('description')">
    {{-- Viewport --}}
    @section('viewport')
        <meta name="viewport" content="width=device-width, initial-scale=1">
    @show
    <link rel="canonical" href="{{ url()->current() }}"/>
    <link href="https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css" rel="stylesheet">
    <link href="{{ mix('css/app.css') }}" rel="stylesheet">
    <style>
        .menu-item {
            flex-grow: 1;
            text-align: center;
        }
    </style>

{{-- Custom styles --}}
    @section('styles')
    @show

    <!-- TrustBox script -->
    <script type="text/javascript" src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" async></script>
    <!-- End TrustBox script -->
    <script type="application/ld+json">
        {
          "@context" : "http://schema.org",
          "@type" : "Product",
          "brand" : {
            "@type" : "Brand",
            "name" : "Grimes Engravers Ltd",
            "logo" : "https://grimesengravers.com/storage/images/grimes-logo-black.png"
          }
        }
</script>
</head>

<body>

@section('header')
<div class="header p-5 border-b-4 border-gray-900 lg:border-none">
    <a href="/">
        <img src="/storage/images/grimes-logo-black.png" alt="Grimes Engravers Ltd" class="m-auto w-48 lg:w-auto"/>
    </a></div>

<div>
    <div class="">
        <nav>
            <div class="block lg:hidden">
                <button
                    class="border border-white flex hover:border-white hover:text-white items-center navbar-burger
                    px-3 py-2 rounded absolute mt-5 ml-5 top-0 text-white">
                    <svg class="fill-current h-6 w-6 text-gray-700" viewBox="0 0 20 20"
                         xmlns="http://www.w3.org/2000/svg">
                        <title>Menu</title>
                        <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
                    </svg>
                </button>
            </div>
            <div id="main-nav" class="w-full flex-grow lg:flex items-center lg:w-auto hidden bg-gray-900 ">
                <ul class="container flex flex-col lg:flex-row mx-auto p-2 text-white items-center">
                    <li class="menu-item text-center py-3 lg:py-0  lg:text-base">
                        <a href="/commercial-engraving" class="hover:text-teal-600">
                            Commercial Engraving
                        </a>
                    </li>
                    <li class="menu-item text-center py-3 lg:py-0  lg:text-base">
                        <a href="/commercial-engraving" class="hover:text-teal-600">
                            Signs & Plaques
                        </a>
                    </li>
                    <li class="menu-item text-center py-3 lg:py-0  lg:text-base">
                        <a href="/trophies-awards" class="hover:text-teal-600">
                            Trophies & Medals
                        </a>
                    </li>
                    <li class="menu-item text-center py-3 lg:py-0  lg:text-base">
                        <a href="/trophies-awards" class="hover:text-teal-600">
                            Presentation Trophies
                        </a>
                    </li>
                    <li class="menu-item text-center py-3 lg:py-0  lg:text-base">
                        <a href="/trophies-awards" class="hover:text-teal-600">
                            Glass Awards
                        </a>
                    </li>
                    <li class="menu-item text-center py-3 lg:py-0  lg:text-base">
                        <a href="/industrial-engraving" class="hover:text-teal-600">
                            Industrial Engraving
                        </a>
                    </li>
                    <li class="menu-item text-center py-3 lg:py-0  lg:text-base">
                        <a href="/contact" class="hover:text-teal-600">
                            Contact
                        </a>
                    </li>
                </ul>
            </div>
        </nav>
    </div>
</div>
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

        <script>
            // Navbar Toggle
            document.addEventListener('DOMContentLoaded', function () {

                // Get all "navbar-burger" elements
                var $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

                // Check if there are any navbar burgers
                if ($navbarBurgers.length > 0) {

                    // Add a click event on each of them
                    $navbarBurgers.forEach(function ($el) {
                        $el.addEventListener('click', function () {

                            // Get the "main-nav" element
                            var $target = document.getElementById('main-nav');

                            // Toggle the class on "main-nav"
                            $target.classList.toggle('hidden');

                        });
                    });
                }

            });
        </script>

@show

@section('footer')
    <div class="container mx-auto pt-10">
        <div class="flex items-center justify-between pb-5 pt-5">
            <button class="px-2 opacity-50 hover:opacity-100 focus:opacity-100">
                <img class="w-full" src="/storage/images/principality.png" alt="Principality client of Grimes Engravers" style="max-width: 150px; filter: grayscale(1);-webkit-filter: grayscale(1);filter: grayscale(1);">
            </button>
            <button class="px-2 opacity-50 hover:opacity-100 focus:opacity-100">
                <img class="w-full" src="/storage/images/royalmint.png" alt="Royal Mint client of Grimes Engravers" style="max-width: 150px; filter: grayscale(1);-webkit-filter: grayscale(1);filter: grayscale(1);">
            </button>
            <button class="px-2 opacity-50 hover:opacity-100 focus:opacity-100">
                <img class="w-full" src="/storage/images/council.jpg" alt="Cardiff City Council client of Grimes Engravers" style="max-width: 60px; filter: grayscale(1);-webkit-filter: grayscale(1);filter: grayscale(1);">
            </button>
            <button class="px-2 opacity-50 hover:opacity-100 focus:opacity-100">
                <img class="w-full" src="/storage/images/bbc.svg" alt="BBC client of Grimes Engravers" style="max-width: 150px; filter: grayscale(1);-webkit-filter: grayscale(1);filter: grayscale(1);">
            </button>
            <button class="px-2 opacity-100 hover:opacity-100 focus:opacity-100">
                <img class="w-full" src="/storage/images/admiral.svg" alt="Admiral client of Grimes Engravers" style="max-width: 150px; filter: grayscale(1);-webkit-filter: grayscale(1);filter: grayscale(1);">
            </button>
        </div>
    </div>

    <footer class="pt-5 bg-gray-900 p-3 text-gray-100 text-white text-center mt-10">
        <div>© {{ now()->year }} Grimes Engravers Ltd Cardiff. All rights reserved.</div>
        <!-- TrustBox widget - Micro Review Count -->
        <div class="mt-2 trustpilot-widget" data-locale="en-GB" data-template-id="5419b6a8b0d04a076446a9ad" data-businessunit-id="59391fba0000ff0005a4207e" data-style-height="24px" data-style-width="100%" data-theme="dark"> <a href="https://uk.trustpilot.com/review/grimesengravers.com" target="_blank" rel="noopener">Trustpilot</a>
        </div> <!-- End TrustBox widget -->
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
