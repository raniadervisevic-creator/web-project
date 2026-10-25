<?php
/**
 * Configuration TEMPLATE — safe to commit to GitHub.
 *
 * 1. Copy this file to   backend/config/config.local.php
 * 2. Fill in your real values there.
 * The real file is listed in .gitignore, so secrets never reach GitHub.
 *
 * NOTE (Windows): do NOT name the real file "config.php" — Windows treats
 * config.php and Config.php (the loader class) as the same file.
 */
return [
    'app' => [
        'name'        => 'Magični Svijet API',
        'env'         => 'development',          // 'production' hides error details
        'cors_origin' => 'http://localhost',     // where the frontend runs
    ],

    'db' => [
        'host'    => 'localhost',
        'port'    => 3306,
        'name'    => 'magicni_svijet',
        'user'    => 'root',
        'pass'    => 'CHANGE_ME',
        'charset' => 'utf8mb4',
    ],

    'jwt' => [
        'secret' => 'CHANGE_ME_TO_A_LONG_RANDOM_STRING',
        'issuer' => 'magicni-svijet',
        'ttl'    => 3600,                        // seconds
    ],

    // OpenWeatherMap — free key at https://openweathermap.org/api
    'weather' => [
        'api_key'   => 'CHANGE_ME',
        'city'      => 'Sarajevo',
        'lat'       => 43.8563,
        'lon'       => 18.4131,
        'timeout'   => 4,                        // seconds
        'cache_ttl' => 600,                      // seconds
    ],
];
