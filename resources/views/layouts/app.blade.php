<!DOCTYPE html>
<html lang="en-gb">
<head>
    <meta charset="UTF-8">
    <title>@yield('title')</title>

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

<nav class="bg-gray-900 bg-gray-900 flex p-2 shadow-2xl text-white uppercase">
    <ul class="flex p-2 text-white uppercase container mx-auto">
        <li class="flex-1 text-center">
            Glass Engraving
        </li>
        <li class="flex-1 text-center">
            Bottle Engraving
        </li>
        <li class="flex-1 text-center">
            Trophies & Awards
        </li>
        <li class="flex-1 text-center">
            Industrial Engraving
        </li>
        <li class="flex-1 text-center">
            Contact
        </li>
    </ul>
</nav>

@show

@section('content')

@show
</body>


@section('footer')
    <div class="flex items-center justify-between pb-5 pt-5">
        <button class="px-2 opacity-50 hover:opacity-100 focus:opacity-100"><img class="w-full" src="https://stripe.com/img/v3/payments/overview/logos/kickstarter.svg" alt="" style="max-height: 60px;"></button>
        <button class="px-2 opacity-50 hover:opacity-100 focus:opacity-100"><img class="w-full" src="https://stripe.com/img/v3/payments/overview/logos/slack.svg" alt="" style="max-height: 60px;"></button>
        <button class="px-2 opacity-50 hover:opacity-100 focus:opacity-100"><img class="w-full" src="https://stripe.com/img/v3/payments/overview/logos/glossier.svg" alt="" style="max-height: 60px;"></button>
        <button class="px-2 opacity-50 hover:opacity-100 focus:opacity-100"><img class="w-full" src="https://stripe.com/img/v3/payments/overview/logos/charity_water.svg" alt="" style="max-height: 60px;"></button>
        <button class="px-2 opacity-100 hover:opacity-100 focus:opacity-100"><img class="w-full" src="https://stripe.com/img/v3/payments/overview/logos/missguided.svg" alt="" style="max-height: 60px;"></button>
    </div>

    <footer class="bg-gray-900 p-3 text-gray-100 text-white text-center">
        © 2020 GRIMES ENGRAVERS LTD. ALL RIGHTS RESERVED.
    </footer>
@show

</body>

</html>
