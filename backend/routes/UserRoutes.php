<?php
require_once __DIR__ . '/../services/UserService.php';

/**
 * CRUD routes for users.
 * Routes only handle HTTP: read the request, call the service, return JSON.
 * Errors thrown by the service are turned into JSON by the error handler in index.php.
 */
$usersService = new UserService();

// READ all
Flight::route('GET /users', function () use ($usersService) {
    Flight::json($usersService->getAll());
});

// READ one
Flight::route('GET /users/@id:[0-9]+', function ($id) use ($usersService) {
    Flight::json($usersService->getById((int) $id));
});

// CREATE
Flight::route('POST /users', function () use ($usersService) {
    $data = Flight::request()->data->getData();
    Flight::json($usersService->create($data), 201);
});

// UPDATE
Flight::route('PUT /users/@id:[0-9]+', function ($id) use ($usersService) {
    $data = Flight::request()->data->getData();
    Flight::json($usersService->update((int) $id, $data));
});

// DELETE
Flight::route('DELETE /users/@id:[0-9]+', function ($id) use ($usersService) {
    $usersService->delete((int) $id);
    Flight::json(['message' => 'User deleted.']);
});
