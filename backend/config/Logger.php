<?php
/**
 * Writes lines to backend/logs/info.log and backend/logs/error.log.
 * Example: [2026-11-22 14:05:12] ERROR Weather API failed: timeout
 */
class Logger
{
    public static function info(string $message): void
    {
        self::write('info.log', 'INFO', $message);
    }

    public static function error(string $message): void
    {
        self::write('error.log', 'ERROR', $message);
    }

    private static function write(string $file, string $level, string $message): void
    {
        $dir = __DIR__ . '/../logs';
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        $line = '[' . date('Y-m-d H:i:s') . "] $level $message" . PHP_EOL;
        file_put_contents("$dir/$file", $line, FILE_APPEND);
    }
}
