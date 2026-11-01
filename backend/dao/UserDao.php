<?php
require_once __DIR__ . '/BaseDao.php';

class UserDao extends BaseDao
{
    public function __construct()
    {
        parent::__construct('users');
    }

    /** Used for login and to check if an email is already registered */
    public function getByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = :email');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function getByRole(string $role): array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE role = :role');
        $stmt->execute(['role' => $role]);
        return $stmt->fetchAll();
    }
}
