<?php
require_once __DIR__ . '/../services/ProgramService.php';

/**
 * CRUD routes for programs.
 * Routes only handle HTTP: read the request, call the service, return JSON.
 * Errors thrown by the service are turned into JSON by the error handler in index.php.
 */
$programsService = new ProgramService();

// READ all
Flight::route('GET /programs', function () use ($programsService) {
    Flight::json($programsService->getAll());
});

// READ one
Flight::route('GET /programs/@id:[0-9]+', function ($id) use ($programsService) {
    Flight::json($programsService->getById((int) $id));
});

// CREATE
Flight::route('POST /programs', function () use ($programsService) {
    $data = Flight::request()->data->getData();
    Flight::json($programsService->create($data), 201);
});

// UPDATE
Flight::route('PUT /programs/@id:[0-9]+', function ($id) use ($programsService) {
    $data = Flight::request()->data->getData();
    Flight::json($programsService->update((int) $id, $data));
});

// DELETE
Flight::route('DELETE /programs/@id:[0-9]+', function ($id) use ($programsService) {
    $programsService->delete((int) $id);
    Flight::json(['message' => 'Program deleted.']);
});
