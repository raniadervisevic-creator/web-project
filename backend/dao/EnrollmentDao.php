<?php
require_once __DIR__ . '/BaseDao.php';

class EnrollmentDao extends BaseDao
{
    public function __construct()
    {
        parent::__construct('enrollments');
    }

    /** Enrollments with the child's and program's names (JOIN) — for the admin list */
    public function getAllWithNames(): array
    {
        $stmt = $this->db->prepare(
            "SELECT e.*, CONCAT(c.first_name, ' ', c.last_name) AS child_name, p.name AS program_name
             FROM enrollments e
             JOIN children c ON c.id = e.child_id
             JOIN programs p ON p.id = e.program_id
             ORDER BY e.created_at DESC"
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /** Enrollments of all children that belong to one parent */
    public function getByParentId(int $parentId): array
    {
        $stmt = $this->db->prepare(
            "SELECT e.*, CONCAT(c.first_name, ' ', c.last_name) AS child_name, p.name AS program_name
             FROM enrollments e
             JOIN children c ON c.id = e.child_id
             JOIN programs p ON p.id = e.program_id
             WHERE c.parent_id = :parent_id
             ORDER BY e.created_at DESC"
        );
        $stmt->execute(['parent_id' => $parentId]);
        return $stmt->fetchAll();
    }
}
