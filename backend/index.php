<?php
/**
 * Entry point of the REST API. Every request comes here.
 * Run locally:  C:\xampp\php\php.exe -S localhost:8080 -t backend backend/index.php
 */

// With PHP's built-in server, let real files (like the Swagger page) be served directly
if (php_sapi_name() === 'cli-server' && is_file(__DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH))) {
    return false;
}

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/Logger.php';

$config = require __DIR__ . '/config/config.local.php';

// CORS: allow the frontend (running on another port) to call the API
header('Access-Control-Allow-Origin: ' . $config['app']['cors_origin']);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/**
 * One place that turns errors into JSON:
 *  - errors the services throw on purpose (400, 404, 409, 503) keep their status and message
 *  - anything else becomes 500, is written to error.log, and the user only sees a short message
 *    (never a stack trace, SQL query or file path)
 */
Flight::map('error', function (Throwable $e) {
    $code = $e->getCode();
    if (is_int($code) && $code >= 400 && $code < 600 && !($e instanceof PDOException)) {
        Flight::jsonHalt(['message' => $e->getMessage()], $code);
        return;
    }
    Logger::error(get_class($e) . ': ' . $e->getMessage() . ' (' . basename($e->getFile()) . ':' . $e->getLine() . ')');
    Flight::jsonHalt(['message' => 'Something went wrong on our side. Please try again later.'], 500);
});

Flight::map('notFound', function () {
    Flight::json(['message' => 'This endpoint does not exist.'], 404);
});

Flight::route('GET /', function () {
    Flight::json(['message' => 'Magični Svijet API is running. Documentation: /swagger/index.html']);
});

require_once __DIR__ . '/routes/UserRoutes.php';
require_once __DIR__ . '/routes/ChildRoutes.php';
require_once __DIR__ . '/routes/ProgramRoutes.php';
require_once __DIR__ . '/routes/EnrollmentRoutes.php';
require_once __DIR__ . '/routes/EventRoutes.php';
require_once __DIR__ . '/routes/WeatherRoutes.php';

Flight::start();
