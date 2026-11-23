<?php
require_once __DIR__ . '/BaseService.php';
require_once __DIR__ . '/../dao/EnrollmentDao.php';
require_once __DIR__ . '/../dao/ChildDao.php';
require_once __DIR__ . '/../dao/ProgramDao.php';

class EnrollmentService extends BaseService
{
    private const FIELDS = ['child_id', 'program_id', 'status', 'start_date', 'notes'];
    private const STATUSES = ['pending', 'approved', 'active', 'rejected'];

    public function __construct()
    {
        parent::__construct(new EnrollmentDao(), 'Enrollment');
    }

    /** The list includes the child's and program's names */
    public function getAll(): array
    {
        return $this->dao->getAllWithNames();
    }

    public function create(array $data): array
    {
        $data = $this->onlyFields($data, self::FIELDS);
        $this->requireFields($data, ['child_id', 'program_id', 'start_date']);
        $data['status'] = $data['status'] ?? 'pending'; // new applications start as pending
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
        $this->validate($data + $existing);
        return $this->dao->update($id, $data);
    }

    private function validate(array $data): void
    {
        if (!in_array($data['status'], self::STATUSES, true)) {
            throw new Exception('The status must be pending, approved, active or rejected.', 400);
        }
        $this->checkDate($data['start_date'], 'start_date');

        $child = (new ChildDao())->getById((int) $data['child_id']);
        if (!$child) {
            throw new Exception('Child not found.', 400);
        }
        $program = (new ProgramDao())->getById((int) $data['program_id']);
        if (!$program) {
            throw new Exception('Program not found.', 400);
        }

        // the child's age on the start date must fit the program
        $age = (new DateTime($child['date_of_birth']))->diff(new DateTime($data['start_date']))->y;
        if ($age < $program['min_age'] || $age > $program['max_age']) {
            throw new Exception("{$program['name']} is for ages {$program['min_age']}–{$program['max_age']}, but {$child['first_name']} will be $age.", 400);
        }
    }
}
