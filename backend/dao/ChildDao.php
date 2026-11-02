<?php
require_once __DIR__ . '/BaseDao.php';

class ChildDao extends BaseDao
{
    public function __construct()
    {
        parent::__construct('children');
    }

    /** All children of one parent (for the parent's "My children" page) */
    public function getByParentId(int $parentId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM children WHERE parent_id = :parent_id ORDER BY first_name');
        $stmt->execute(['parent_id' => $parentId]);
        return $stmt->fetchAll();
    }
}
