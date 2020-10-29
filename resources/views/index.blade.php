@extends('layouts.app')
@section('title','Professional Engravers Cardiff')

@section('styles')
@endsection

@section('content')
    <div class="bg-gray-300">
        <!--    <div class="bg-fixed p-24" style="background-image: url('/storage/images/hero-one.jpg'); min-height: 400px;">-->
        <div class="bg-fixed p-8 lg:p-24 flex items-center" style="background-image: url('/storage/images/hero-1.jpg'); min-height: 400px;">
            <div>
                <h1 class="leading-none mb-5 text-4xl lg:text-5xl text-white">Professional Engravers</h1>
                <p class="max-w-3xl text-white pb-6">
                    The most established Engravers in South Wales. We can provide not only signs but the complete package for all your company's requirements. Please browse our site, we're here to help.                        </p>
                </p>

                <a href="/contact" class="bg-teal-800 hover:bg-gray-100 hover:text-black text-white font-semibold py-2 px-4 rounded shadow">
                    Contact Us Today
                </a>
            </div>
        </div>
    </div>

    <div class="container mx-auto">
        <div class="shadow-md">

            <!-- Two columns -->
            <div class="flex flex-col lg:flex-row">
                <div class="bg-gray-900 h-12 h-auto p-8 lg:p-32 text-center text-gray-100 w-full lg:w-1/2 flex items-center" style="min-height: 600px;">
                    <div>
                        <h2 class="pb-6 text-2xl font-semibold">Memorial Plaques</h2>
                        <p class="pb-12">
                            In these terrible times, we need to remember our loved ones, when you are ready we are here to help with your needs.</p>
                        <a href="/memorial-plaques" class="hover:bg-gray-100 hover:text-black text-white font-semibold py-2 px-4 border border-gray-400 rounded shadow">
                            View Memorial Plaques
                        </a>
                    </div>
                </div>
                <div class="bg-center bg-cover bg-white h-12 w-full lg:w-1/2 bg-contain" style="background-image: url('/storage/images/memorial-plaques/memorial-plaque-slate-home.jpg'); min-height: 600px;"></div>

            </div>


            <!-- Two columns -->
            <div class="flex flex-col lg:flex-row">
                <div class="bg-center bg-cover bg-gray-400 h-12 w-full lg:w-1/2" style="background-image: url('/storage/images/glass-engraving.jpg'); min-height: 600px;"></div>
                <div class="bg-teal-800 h-12 h-auto p-8 lg:p-32 text-center text-gray-100 w-full lg:w-1/2 flex items-center" style="min-height: 600px;">
                    <div>
                        <h2 class="pb-6 text-2xl font-semibold">Glass and Crystal Trophies</h2>
                        <p class="pb-12">
                            We can supply and engrave crystal and glass awards for corporate events or sporting occasions, please browse through our catalogues, we can provide an artwork service or you can supply artwork to us in PDF or eps file formats.
                        </p>
                        <a href="http://www.logocrystal.co.uk/" target="_blank" class="hover:bg-gray-100 hover:text-black text-white font-semibold py-2 px-4 border border-gray-400 rounded shadow">
                            View Glass Catalogue
                        </a>
                    </div>
                </div>
            </div>

            <!-- Two columns -->
            <div class="flex flex-col lg:flex-row">
                <div class="bg-gray-900 h-12 h-auto p-8 lg:p-32 text-center text-gray-100 w-full lg:w-1/2 flex items-center" style="min-height: 600px;">
                    <div>
                        <h2 class="pb-6 text-2xl font-semibold">Trophies and Medals</h2>
                        <p class="pb-12">
                            One of the biggest suppliers of trophies and medals, nickel plated trophy cups, glass trophies, glass awards, football trophies in Cardiff.</p>
                        <a href="/trophies-awards-catalogue" class="hover:bg-gray-100 hover:text-black text-white font-semibold py-2 px-4 border border-gray-400 rounded shadow">
                            View Catalogue
                        </a>
                    </div>
                </div>
                <div class="bg-center bg-cover bg-white h-12 w-full lg:w-1/2 bg-contain bg-no-repeat" style="background-image: url('/storage/images/trophies-awards.jpg'); min-height: 600px;"></div>

            </div>

            <!-- Two columns -->
            <div class="flex flex-col lg:flex-row">
                <div class="bg-center bg-cover bg-gray-400 h-12 w-full lg:w-1/2" style="background-image: url('/storage/images/grimes-original.jpg'); min-height: 600px;"></div>
                <div class="bg-teal-800 h-12 h-auto p-8 lg:p-32 text-center text-gray-100 w-full lg:w-1/2 flex items-center" style="min-height: 600px;">
                    <div>
                        <h2 class="pb-6 text-2xl font-semibold">Our Story</h2>
                        Established in 1947, Grimes Engravers are a small but well-established family business situated in Cardiff offering a wide range of services including Ceremony Plaques, Labels, Nameplates, Badges, Trophies, Glass Awards and much more.               </div>
                </div>
            </div>
        </div>
    </div>
@endsection
