<?php

return [
    'app' => [
        'name'        => 'Magični Svijet API',
        'env'         => 'development',          // 'production' hides error details
        'cors_origin' => '*',                    // who may call the API from a browser ('*' = anyone, fine for local work)
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

    
    'weather' => [
        'api_key'   => 'CHANGE_ME',
        'city'      => 'Sarajevo',
        'lat'       => 43.8563,
        'lon'       => 18.4131,
        'timeout'   => 4,                        // seconds
        'cache_ttl' => 600,                      // seconds
    ],
];
