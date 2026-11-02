<?php
require_once __DIR__ . '/BaseDao.php';

class ProgramDao extends BaseDao
{
    public function __construct()
    {
        parent::__construct('programs');
    }

    /** Programs that fit a child's age (for the age filter on the Classes page) */
    public function getForAge(int $age): array
    {
        $stmt = $this->db->prepare('SELECT * FROM programs WHERE :age BETWEEN min_age AND max_age');
        $stmt->execute(['age' => $age]);
        return $stmt->fetchAll();
    }
}
