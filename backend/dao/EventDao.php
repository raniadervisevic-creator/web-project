<?php
require_once __DIR__ . '/BaseDao.php';

class EventDao extends BaseDao
{
    public function __construct()
    {
        parent::__construct('events');
    }

    /** Events from today onwards, with the program name ("All groups" when program_id is NULL) */
    public function getUpcoming(): array
    {
        $stmt = $this->db->prepare(
            "SELECT ev.*, COALESCE(p.name, 'All groups') AS program_name
             FROM events ev
             LEFT JOIN programs p ON p.id = ev.program_id
             WHERE ev.event_date >= CURDATE()
             ORDER BY ev.event_date"
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
