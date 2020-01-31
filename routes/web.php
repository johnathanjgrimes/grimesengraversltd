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
