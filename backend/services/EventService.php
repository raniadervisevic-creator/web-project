<?php
require_once __DIR__ . '/BaseService.php';
require_once __DIR__ . '/../dao/EventDao.php';
require_once __DIR__ . '/../dao/ProgramDao.php';

class EventService extends BaseService
{
    private const FIELDS = ['program_id', 'title', 'description', 'event_date', 'location'];

    public function __construct()
    {
        parent::__construct(new EventDao(), 'Event');
    }

    /** The list includes the program name ("All groups" when there is none) */
    public function getAll(): array
    {
        return $this->dao->getAllWithProgram();
    }

    public function getUpcoming(): array
    {
        return $this->dao->getUpcoming();
    }

    public function create(array $data): array
    {
        $data = $this->onlyFields($data, self::FIELDS);
        $this->requireFields($data, ['title', 'event_date']);
        $data = $this->validate($data);
        return $this->dao->insert($data);
    }

    public function update(int $id, array $data): array
    {
        $this->getById($id);
        $data = $this->onlyFields($data, self::FIELDS);
        if (empty($data)) {
            throw new Exception('Nothing to update.', 400);
        }
        $data = $this->validate($data);
        return $this->dao->update($id, $data);
    }

    private function validate(array $data): array
    {
        if (isset($data['event_date'])) {
            $this->checkDate($data['event_date'], 'event_date');
        }
        if (array_key_exists('program_id', $data)) {
            if ($data['program_id'] === '' || $data['program_id'] === null) {
                $data['program_id'] = null; // empty = event for all groups
            } elseif (!(new ProgramDao())->getById((int) $data['program_id'])) {
                throw new Exception('Program not found.', 400);
            }
        }
        if (isset($data['title']) && strlen($data['title']) > 150) {
            throw new Exception('The title can be at most 150 characters long.', 400);
        }
        return $data;
    }
}
