<?php
require_once __DIR__ . '/../services/EnrollmentService.php';

/**
 * CRUD routes for enrollments.
 * Routes only handle HTTP: read the request, call the service, return JSON.
 * Errors thrown by the service are turned into JSON by the error handler in index.php.
 */
$enrollmentsService = new EnrollmentService();

// READ all
Flight::route('GET /enrollments', function () use ($enrollmentsService) {
    Flight::json($enrollmentsService->getAll());
});

// READ one
Flight::route('GET /enrollments/@id:[0-9]+', function ($id) use ($enrollmentsService) {
    Flight::json($enrollmentsService->getById((int) $id));
});

// CREATE
Flight::route('POST /enrollments', function () use ($enrollmentsService) {
    $data = Flight::request()->data->getData();
    Flight::json($enrollmentsService->create($data), 201);
});

// UPDATE
Flight::route('PUT /enrollments/@id:[0-9]+', function ($id) use ($enrollmentsService) {
    $data = Flight::request()->data->getData();
    Flight::json($enrollmentsService->update((int) $id, $data));
});

// DELETE
Flight::route('DELETE /enrollments/@id:[0-9]+', function ($id) use ($enrollmentsService) {
    $enrollmentsService->delete((int) $id);
    Flight::json(['message' => 'Enrollment deleted.']);
});
