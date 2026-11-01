<?php
require_once __DIR__ . '/../config/Database.php';

/**
 * Reusable CRUD methods for every table.
 * Each entity DAO extends this class and only passes its table name.
 * All queries use prepared statements (values are sent separately from the SQL).
 */
class BaseDao
{
    protected PDO $db;
    protected string $table;

    public function __construct(string $table)
    {
        $this->db = Database::connect();
        $this->table = $table;
    }

    /** READ all rows */
    public function getAll(): array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table}");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /** READ one row by id (returns null if it doesn't exist) */
    public function getById(int $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /** CREATE a row from ['column' => value] and return it with its new id */
    public function insert(array $data): array
    {
        $this->checkColumns($data);
        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));

        $stmt = $this->db->prepare("INSERT INTO {$this->table} ($columns) VALUES ($placeholders)");
        $stmt->execute($data);

        return $this->getById((int) $this->db->lastInsertId());
    }

    /** UPDATE the given columns of one row and return the updated row */
    public function update(int $id, array $data): ?array
    {
        $this->checkColumns($data);
        $set = implode(', ', array_map(fn($col) => "$col = :$col", array_keys($data)));

        $stmt = $this->db->prepare("UPDATE {$this->table} SET $set WHERE id = :id");
        $stmt->execute($data + ['id' => $id]);

        return $this->getById($id);
    }

    /** DELETE one row; returns true if something was deleted */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Column names can't be prepared-statement parameters, so we only allow
     * simple names (letters and underscores) to block SQL injection through keys.
     */
    private function checkColumns(array $data): void
    {
        if (empty($data)) {
            throw new InvalidArgumentException('No data given.');
        }
        foreach (array_keys($data) as $column) {
            if (!preg_match('/^[a-z_]+$/', $column)) {
                throw new InvalidArgumentException("Invalid column name: $column");
            }
        }
    }
}
