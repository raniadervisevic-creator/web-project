<?php
require_once __DIR__ . '/BaseService.php';
require_once __DIR__ . '/../dao/ChildDao.php';
require_once __DIR__ . '/../dao/UserDao.php';

class ChildService extends BaseService
{
    private const FIELDS = ['parent_id', 'first_name', 'last_name', 'date_of_birth', 'notes'];

    public function __construct()
    {
        parent::__construct(new ChildDao(), 'Child');
    }

    public function getByParent(int $parentId): array
    {
        return $this->dao->getByParentId($parentId);
    }

    public function create(array $data): array
    {
        $data = $this->onlyFields($data, self::FIELDS);
        $this->requireFields($data, ['parent_id', 'first_name', 'last_name', 'date_of_birth']);
        $this->validate($data);
        return $this->dao->insert($data);
    }

    public function update(int $id, array $data): array
    {
        $this->getById($id);
        $data = $this->onlyFields($data, self::FIELDS);
        if (empty($data)) {
            throw new Exception('Nothing to update.', 400);
        }
        $this->validate($data);
        return $this->dao->update($id, $data);
    }

    private function validate(array $data): void
    {
        if (isset($data['date_of_birth'])) {
            $this->checkDate($data['date_of_birth'], 'date_of_birth');
            if ($data['date_of_birth'] > date('Y-m-d')) {
                throw new Exception('The date of birth cannot be in the future.', 400);
            }
        }
        if (isset($data['parent_id'])) {
            $parent = (new UserDao())->getById((int) $data['parent_id']);
            if (!$parent || $parent['role'] !== 'parent') {
                throw new Exception('The parent_id must belong to a user with the parent role.', 400);
            }
        }
    }
}
