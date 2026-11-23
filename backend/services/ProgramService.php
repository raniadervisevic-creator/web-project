<?php
require_once __DIR__ . '/BaseService.php';
require_once __DIR__ . '/../dao/ProgramDao.php';
require_once __DIR__ . '/../dao/EnrollmentDao.php';

class ProgramService extends BaseService
{
    private const FIELDS = ['name', 'min_age', 'max_age', 'description', 'schedule', 'price', 'capacity', 'teacher', 'image'];

    public function __construct()
    {
        parent::__construct(new ProgramDao(), 'Program');
    }

    public function create(array $data): array
    {
        $data = $this->onlyFields($data, self::FIELDS);
        $this->requireFields($data, ['name', 'min_age', 'max_age']);
        $this->validate($data);
        return $this->dao->insert($data);
    }

    public function update(int $id, array $data): array
    {
        $existing = $this->getById($id);
        $data = $this->onlyFields($data, self::FIELDS);
        if (empty($data)) {
            throw new Exception('Nothing to update.', 400);
        }
        // check the ages together with the values that are not being changed
        $this->validate($data + $existing);
        return $this->dao->update($id, $data);
    }

    /** A program that still has enrollments can't be deleted */
    public function delete(int $id): void
    {
        $this->getById($id);
        if ((new EnrollmentDao())->countByProgramId($id) > 0) {
            throw new Exception('This program still has enrollments. Remove them first.', 409);
        }
        $this->dao->delete($id);
    }

    private function validate(array $data): void
    {
        if (isset($data['min_age'])) $this->checkNumber($data['min_age'], 'min_age', 0, 7);
        if (isset($data['max_age'])) $this->checkNumber($data['max_age'], 'max_age', 0, 7);
        if (isset($data['min_age'], $data['max_age']) && $data['min_age'] > $data['max_age']) {
            throw new Exception('min_age cannot be bigger than max_age.', 400);
        }
        if (isset($data['price'])) $this->checkNumber($data['price'], 'price', 0, 10000);
        if (isset($data['capacity'])) $this->checkNumber($data['capacity'], 'capacity', 1, 100);
    }
}
