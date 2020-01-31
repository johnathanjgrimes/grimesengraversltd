@extends('layouts.app')
@section('title','Trophies & Awards')

@section('styles')
@endsection

@section('content')
    <div class="container mx-auto">
        <div class="px-6 py-4">
            <h1 class="pb-5 pt-10 text-3xl">Trophies & Awards</h1>

            <p class="pb-5">Below is a list with a link to the catalogues and product ranges we can offer to you.</p>

            <p class="pb-5">If you see something your are intrested in then please get in contact with one of our team providing
                as much information as possible.
            </p>
        </div>

        <div class="flex flex-col lg:flex-row">
            <a href="/trophies-awards-catalogue" class="w-full lgw-1/3 sm:mb-12 mr-0 lg:mr-4 overflow-hidden rounded shadow-lg">
                <div>
                    <img class="w-full" src="/storage/images/trophies-awards.jpg" alt="Trophies  & Awards">
                    <div class="px-6 py-4">
                        <div class="font-bold text-xl mb-2">Trophies  & Awards</div>
                        <p class="text-gray-700 text-base">
                            <span class="text-blue-500 hover:text-blue-800" href="">View All Trophies & Awards</span>
                        </p>
                    </div>
                    <div class="px-6 py-4">
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">Cups</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">Tankards</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">Hip flasks</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">Trophies</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">Shields</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">Medals</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">Sports Awards</span>
                    </div>
                </div>
            </a>
            <a href="/swatkins-catalogue" class="w-full lgw-1/3 sm:mb-12 mr-0 lg:mr-4 overflow-hidden rounded shadow-lg">
                <div>
                    <img class="w-full" src="/storage/images/cups.jpg" alt=">Presentations Cups & Awards">
                    <div class="px-6 py-4">
                        <div class="font-bold text-xl mb-2">Presentation Cups & Awards</div>
                        <p class="text-gray-700 text-base">
                            <span class="text-blue-500 hover:text-blue-800" href="">View All Presentation Cups & Awards</span>
                        </p>
                    </div>
                    <div class="px-6 py-4">
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">Cups</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">Trophies</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">Shields</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">Glass Awards</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">Gifts</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">Sports Awards</span>
                    </div>
                </div>
            </a>
            <a href="/crystal-catalogue" class="w-full lgw-1/3 sm:mb-12 overflow-hidden rounded shadow-lg">
                <div >
                    <img class="w-full" src="/storage/images/glass-engraving.jpg" alt="Glass Gifts & Awards">
                    <div class="px-6 py-4">
                        <div class="font-bold text-xl mb-2">Glass Gifts & Awards</div>
                        <p class="text-gray-700 text-base">
                            <span class="text-blue-500 hover:text-blue-800" href="">View All Glass Gifts & Awards</span>
                        </p>
                    </div>
                    <div class="px-6 py-4">
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">Awards</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">Tableware</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">Promotional Gifts</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">Trophies</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">Corporate Gifts</span>
                        <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mb-2">Sports Awards</span>
                    </div>
                </div>
            </a>
        </div>


    </div>

@endsection
