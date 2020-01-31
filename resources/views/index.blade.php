@extends('layouts.app')
@section('title','Home')

@section('styles')
@endsection

@section('content')
    <div class="bg-gray-300">
        <!--    <div class="bg-fixed p-24" style="background-image: url('/storage/images/hero-one.jpg'); min-height: 400px;">-->
        <div class="bg-fixed p-24" style="background-image: url('/storage/images/hero-1.jpg'); min-height: 400px;">
            <h1 class="text-5xl text-white">Professional Engravers</h1>
            <p class="max-w-3xl text-white pb-6">
                Commemorative Plaques & Signs, Jewellery & Glass Engraving, Brass, Stainless, Aluminium Industrial & Commercial Control Panels & Switch Plates Glass & Crystal Engraving
            </p>

            <a href="/contact" class="hover:bg-gray-100 hover:text-black text-white font-semibold py-2 px-4 border border-gray-400 rounded shadow">
                Contact Us Today
            </a>
        </div>
    </div>

    <div class="container mx-auto">
        <div class="shadow-md">
            <!-- Two columns -->
            <div class="flex flex-col lg:flex-row">
                <div class="bg-center bg-cover bg-gray-400 h-12 w-full lg:w-1/2" style="background-image: url('/storage/images/glass-engraving.jpg'); min-height: 600px;"></div>
                <div class="bg-yellow-900 h-12 h-auto p-32 text-center text-gray-100 w-full lg:w-1/2 flex items-center" style="min-height: 600px;">
                    <div>
                        <h2 class="pb-6 text-2xl uppercase">Glass Awards</h2>
                        <p class="pb-12">
                            We can supply and engrave crystal and glass awards for corporate events or sporting occasions, please browse through our catalogues, we can provide an artwork service or you can supply artwork to us in PDF or eps file formats.
                        </p>
                        <a href="/crystal-catalogue" class="hover:bg-gray-100 hover:text-black text-white font-semibold py-2 px-4 border border-gray-400 rounded shadow">
                            View Glass Catalogue
                        </a>
                    </div>
                </div>
            </div>

            <!-- Two columns -->
            <div class="flex flex-col lg:flex-row">
                <div class="bg-gray-900 h-12 h-auto p-32 text-center text-gray-100 w-full lg:w-1/2 flex items-center" style="min-height: 600px;">
                    <div>
                        <h2 class="pb-6 text-2xl uppercase">Trophies & Awards</h2>
                        <p class="pb-12">
                            We are one of the biggest supplier of awards and trophies in Wales, and can provide you with medals, trophies and awards to suit all sporting, corporate, leisure and charitable events and special occasions
                        </p>
                        <a href="/trophies-awards-catalogue" class="hover:bg-gray-100 hover:text-black text-white font-semibold py-2 px-4 border border-gray-400 rounded shadow">
                            View Trophies & Awards Catalogue
                        </a>
                    </div>
                </div>
                <div class="bg-center bg-cover bg-gray-400 h-12 w-full lg:w-1/2" style="background-image: url('/storage/images/trophies-awards.jpg'); min-height: 600px;"></div>

            </div>

            <!-- Two columns -->
            <div class="flex flex-col lg:flex-row">
                <div class="bg-center bg-cover bg-gray-400 h-12 w-full lg:w-1/2" style="background-image: url('/storage/images/grimes-original.jpg'); min-height: 600px;"></div>
                <div class="bg-yellow-900 h-12 h-auto p-32 text-center text-gray-100 w-full lg:w-1/2 flex items-center" style="min-height: 600px;">
                    <div>
                        <h2 class="pb-6 text-2xl uppercase">Our Story</h2>
                        <p>Established in 1947, Grimes Engravers offers excellent service and reliability in all that we do and are competitively priced. We are a small but well established familly business situated in Cardiff offering a wide range of services for your needs, including Ceremony plaques, Lables, Nameplates, Badges, Trophies, Tankards, Jewellery Engraving and glass engraving. and also supply rubber stamps and marking inks with a 24 hour service. A delivery and collection service is available in the Cardiff area, please contact us to arrange an appointment.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
