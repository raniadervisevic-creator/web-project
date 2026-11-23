<?php
require_once __DIR__ . '/../config/Logger.php';

/**
 * External API: OpenWeatherMap.
 * Calls the API with a timeout, turns the answer into the small format the
 * frontend widget needs, and logs every call. If anything fails it writes
 * to error.log and throws a friendly 503 error, so the website keeps working.
 */
class WeatherService
{
    private const URL = 'https://api.openweathermap.org/data/2.5/weather';
    private const FRIENDLY_ERROR = 'Our weather moon is taking a nap — please check back soon!';

    private array $config;

    public function __construct()
    {
        $this->config = (require __DIR__ . '/../config/config.local.php')['weather'];
    }

    public function getCurrent(): array
    {
        $url = self::URL . '?' . http_build_query([
            'lat'   => $this->config['lat'],
            'lon'   => $this->config['lon'],
            'units' => 'metric',
            'appid' => $this->config['api_key'],
        ]);

        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => $this->config['timeout'],
            CURLOPT_TIMEOUT        => $this->config['timeout'],
        ]);
        $body = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curlError = curl_error($curl);
        curl_close($curl);

        // 1. no answer at all (timeout, no internet, wrong host)
        if ($body === false) {
            Logger::error("Weather API failed: $curlError");
            throw new Exception(self::FRIENDLY_ERROR, 503);
        }
        // 2. an error answer (e.g. 401 = wrong API key, 429 = too many requests)
        $json = json_decode($body, true);
        if ($status !== 200 || !is_array($json)) {
            $reason = is_array($json) && isset($json['message']) ? $json['message'] : 'unknown error';
            Logger::error("Weather API returned HTTP $status: $reason");
            throw new Exception(self::FRIENDLY_ERROR, 503);
        }

        Logger::info("Weather API call OK ({$this->config['city']})");
        return $this->format($json);
    }

    /** Turns OpenWeatherMap's answer into what the frontend widget shows */
    public function format(array $json): array
    {
        $main = $json['weather'][0]['main'] ?? 'Clouds';
        $icon = match ($main) {
            'Clear' => 'sunny',
            'Rain', 'Drizzle', 'Thunderstorm', 'Snow' => 'rain',
            default => 'partly',
        };
        $temp = round($json['main']['temp']);

        return [
            'city'        => $this->config['city'],
            'temp'        => $temp,
            'description' => ucfirst($json['weather'][0]['description'] ?? $main),
            'icon'        => $icon,
            'wind_kmh'    => round(($json['wind']['speed'] ?? 0) * 3.6), // m/s → km/h
            'humidity'    => $json['main']['humidity'] ?? null,
            'outdoor_ok'  => $icon !== 'rain' && $temp >= 5 && $temp <= 30,
            'updated_at'  => date('c'),
        ];
    }
}
