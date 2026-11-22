<?php
require_once __DIR__ . '/../services/WeatherService.php';

/**
 * External API endpoint: the frontend calls GET /weather and never
 * talks to OpenWeatherMap directly, so the API key stays secret.
 */
$weatherService = new WeatherService();

Flight::route('GET /weather', function () use ($weatherService) {
    Flight::json($weatherService->getCurrent());
});
