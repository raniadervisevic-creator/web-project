<?php
require_once __DIR__ . '/../services/EventService.php';

/**
 * CRUD routes for events.
 * Routes only handle HTTP: read the request, call the service, return JSON.
 * Errors thrown by the service are turned into JSON by the error handler in index.php.
 */
$eventsService = new EventService();

// READ all
Flight::route('GET /events', function () use ($eventsService) {
    Flight::json($eventsService->getAll());
});

// READ events from today onwards
Flight::route('GET /events/upcoming', function () use ($eventsService) {
    Flight::json($eventsService->getUpcoming());
});

// READ one
Flight::route('GET /events/@id:[0-9]+', function ($id) use ($eventsService) {
    Flight::json($eventsService->getById((int) $id));
});

// CREATE
Flight::route('POST /events', function () use ($eventsService) {
    $data = Flight::request()->data->getData();
    Flight::json($eventsService->create($data), 201);
});

// UPDATE
Flight::route('PUT /events/@id:[0-9]+', function ($id) use ($eventsService) {
    $data = Flight::request()->data->getData();
    Flight::json($eventsService->update((int) $id, $data));
});

// DELETE
Flight::route('DELETE /events/@id:[0-9]+', function ($id) use ($eventsService) {
    $eventsService->delete((int) $id);
    Flight::json(['message' => 'Event deleted.']);
});
