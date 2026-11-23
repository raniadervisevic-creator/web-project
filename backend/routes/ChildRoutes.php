<?php
require_once __DIR__ . '/../services/ChildService.php';

/**
 * CRUD routes for children.
 * Routes only handle HTTP: read the request, call the service, return JSON.
 * Errors thrown by the service are turned into JSON by the error handler in index.php.
 */
$childrenService = new ChildService();

// READ all
Flight::route('GET /children', function () use ($childrenService) {
    Flight::json($childrenService->getAll());
});

// READ one
Flight::route('GET /children/@id:[0-9]+', function ($id) use ($childrenService) {
    Flight::json($childrenService->getById((int) $id));
});

// CREATE
Flight::route('POST /children', function () use ($childrenService) {
    $data = Flight::request()->data->getData();
    Flight::json($childrenService->create($data), 201);
});

// UPDATE
Flight::route('PUT /children/@id:[0-9]+', function ($id) use ($childrenService) {
    $data = Flight::request()->data->getData();
    Flight::json($childrenService->update((int) $id, $data));
});

// DELETE
Flight::route('DELETE /children/@id:[0-9]+', function ($id) use ($childrenService) {
    $childrenService->delete((int) $id);
    Flight::json(['message' => 'Child deleted.']);
});
