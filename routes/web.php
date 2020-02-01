<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('index');
});
Route::get('/trophies-awards', function () {
    return view('trophies-awards');
});
Route::get('/trophies-awards-catalogue', function () {
    return view('trophies-awards-catalogue');
});
Route::get('/swatkins-catalogue', function () {
    return view('swatkins');
});
Route::get('/crystal-catalogue', function () {
    return view('crystal');
});
Route::get('/industrial-engraving', function () {
    return view('industrial');
});
Route::get('/commercial-engraving', function () {
    return view('commercial');
});
Route::get('/contact', function () {
    return view('contact');
});
Route::post('contact', 'ContactController@store');

//Redirects
Route::redirect('/glass-engraving.html', '/trophies-awards', 301);
Route::redirect('/bottle-engraving.html', '/', 301);
Route::redirect('/trophies-awards.html', '/trophies-awards', 301);
Route::redirect('/industrial-engraving.html', '/industrial-engraving', 301);
Route::redirect('/nameplates-plaques.html', '/commercial-engraving', 301);
Route::redirect('/nameplates-plaques/memorial-plaques.html', '/commercial-engraving', 301);
Route::redirect('/badges.html', '/commercial-engraving', 301);
Route::redirect('/badges/engraved-badges.html', '/commercial-engraving', 301);
Route::redirect('/badges/printed-badges.html', '/commercial-engraving', 301);
Route::redirect('/office-signage.html', '/commercial-engraving', 301);
Route::redirect('/office-signage/desk-signs.html', '/commercial-engraving', 301);
Route::redirect('/office-signage/door-signs.html', '/commercial-engraving', 301);
Route::redirect('/bar-signs.html', '/commercial-engraving', 301);
Route::redirect('/bar-signs/table-numbers.html', '/commercial-engraving', 301);
Route::redirect('/hotel-signs.html', '/commercial-engraving', 301);
Route::redirect('/hotel-signs/door-numbers.html', '/commercial-engraving', 301);
Route::redirect('/hotel-signs/key-fobs.html', '/commercial-engraving', 301);
Route::redirect('/stainless-steel-memorial-bench-plaque.html', '/commercial-engraving', 301);
Route::redirect('/aluminium-memorial-bench-plaque.html', '/commercial-engraving', 301);
Route::redirect('/stainless-steel-memorial-wall-plaque.html', '/commercial-engraving', 301);
Route::redirect('/brass-memorial-wall-plaque.html', '/commercial-engraving', 301);
Route::redirect('engraved-rectangular-badges.html', '/commercial-engraving', 301);
Route::redirect('/engraved-oval-badges.html', '/commercial-engraving', 301);
Route::redirect('/printed-rectangular-badges.html', '/commercial-engraving', 301);
Route::redirect('/tent-shaped-desk-plate.html', '/commercial-engraving', 301);
Route::redirect('/mahogany-desk-sign-with-stainless-steel-plate.html', '/commercial-engraving', 301);
Route::redirect('/mahogany-desk-sign-with-brass-plate.html', '/commercial-engraving', 301);
Route::redirect('/mahogany-desk-sign-with-aluminium-plate.html', '/commercial-engraving', 301);
Route::redirect('/brass-door-sign.html', '/commercial-engraving', 301);
Route::redirect('/aluminium-door-sign.html', '/commercial-engraving', 301);
Route::redirect('/slatz-aluminium-door-signs.html', '/commercial-engraving', 301);
Route::redirect('/stainless-steel-table-numbers.html', '/commercial-engraving', 301);
Route::redirect('/brass-effect-table-numbers.html', '/commercial-engraving', 301);
Route::redirect('/aluminium-effect-table-numbers.html', '/commercial-engraving', 301);
Route::redirect('/brass-hotel-door-number.html', '/commercial-engraving', 301);
Route::redirect('/aluminium-room-numbers.html', '/commercial-engraving', 301);
Route::redirect('/brass-effect-key-fobs.html', '/commercial-engraving', 301);
Route::redirect('/aluminium-effect-key-fobs.html', '/commercial-engraving', 301);
Route::redirect('/about', '/', 301);
Route::redirect('/sales/guest/form', '/contact', 301);
