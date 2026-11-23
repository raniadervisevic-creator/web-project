<?php
/**
 * Shared logic for every service.
 * A service is the ONLY layer that calls a DAO; routes call services.
 *
 * Errors are thrown as exceptions with the HTTP status as the code:
 *   400 = bad input, 404 = not found, 409 = conflict (e.g. email already used).
 * The error handler in index.php turns them into JSON responses.
 */
class BaseService
{
    protected $dao;
    protected string $entity; // used in messages, e.g. "Child not found."

    public function __construct($dao, string $entity)
    {
        $this->dao = $dao;
        $this->entity = $entity;
    }

    public function getAll(): array
    {
        return $this->dao->getAll();
    }

    /** Returns the row or throws 404 */
    public function getById(int $id): array
    {
        $row = $this->dao->getById($id);
        if (!$row) {
            throw new Exception("{$this->entity} not found.", 404);
        }
        return $row;
    }

    public function delete(int $id): void
    {
        $this->getById($id); // 404 if it doesn't exist
        $this->dao->delete($id);
    }

    // ---------- validation helpers ----------

    /** Keep only the columns we allow (ignores anything else the client sends) */
    protected function onlyFields(array $data, array $allowed): array
    {
        return array_intersect_key($data, array_flip($allowed));
    }

    /** Every field in $fields must be present and not empty */
    protected function requireFields(array $data, array $fields): void
    {
        foreach ($fields as $field) {
            if (!isset($data[$field]) || trim((string) $data[$field]) === '') {
                throw new Exception("The field '$field' is required.", 400);
            }
        }
    }

    /** A valid yyyy-mm-dd date */
    protected function checkDate(string $value, string $field): void
    {
        $date = DateTime::createFromFormat('Y-m-d', $value);
        if (!$date || $date->format('Y-m-d') !== $value) {
            throw new Exception("The field '$field' must be a date in the format YYYY-MM-DD.", 400);
        }
    }

    /** A whole number between $min and $max */
    protected function checkNumber($value, string $field, float $min, float $max): void
    {
        if (!is_numeric($value) || $value < $min || $value > $max) {
            throw new Exception("The field '$field' must be a number between $min and $max.", 400);
        }
    }
}
