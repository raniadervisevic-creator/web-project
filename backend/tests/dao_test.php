<?php
/**
 * Quick check that every DAO can Create, Read, Update and Delete.
 * Run from the project folder:   php backend/tests/dao_test.php
 * (or open http://localhost/magicni-svijet/backend/tests/dao_test.php)
 */
require_once __DIR__ . '/../dao/UserDao.php';
require_once __DIR__ . '/../dao/ChildDao.php';
require_once __DIR__ . '/../dao/ProgramDao.php';
require_once __DIR__ . '/../dao/EnrollmentDao.php';
require_once __DIR__ . '/../dao/EventDao.php';

header('Content-Type: text/plain; charset=utf-8');

function check(string $label, bool $ok): void
{
    echo ($ok ? '[OK]   ' : '[FAIL] ') . $label . PHP_EOL;
}

$users = new UserDao();
$children = new ChildDao();
$programs = new ProgramDao();
$enrollments = new EnrollmentDao();
$events = new EventDao();

// ---- READ ----
check('users: getAll returns rows', count($users->getAll()) > 0);
check('users: getByEmail finds the admin', $users->getByEmail('admin@magicnisvijet.ba') !== null);
check('programs: getForAge(4) finds Preschool Explorers', count($programs->getForAge(4)) > 0);
check('children: getByParentId(2) returns Ana\'s children', count($children->getByParentId(2)) === 2);
check('enrollments: getAllWithNames includes child_name', isset($enrollments->getAllWithNames()[0]['child_name']));
check('events: getAll returns rows', count($events->getAll()) > 0);

// ---- CREATE ----
$user = $users->insert([
    'first_name' => 'Test', 'last_name' => 'Parent', 'email' => 'test' . time() . '@example.com',
    'password_hash' => password_hash('Test1234', PASSWORD_BCRYPT), 'role' => 'parent',
]);
check('users: insert', $user !== null && $user['first_name'] === 'Test');

$program = $programs->insert(['name' => 'Test Program', 'min_age' => 2, 'max_age' => 4, 'price' => 100, 'capacity' => 5]);
check('programs: insert', $program['name'] === 'Test Program');

$child = $children->insert(['parent_id' => $user['id'], 'first_name' => 'Tina', 'last_name' => 'Parent', 'date_of_birth' => '2023-04-01']);
check('children: insert', $child['parent_id'] == $user['id']);

$enrollment = $enrollments->insert(['child_id' => $child['id'], 'program_id' => $program['id'], 'start_date' => '2027-01-01']);
check('enrollments: insert (status defaults to pending)', $enrollment['status'] === 'pending');

$event = $events->insert(['program_id' => $program['id'], 'title' => 'Test event', 'event_date' => '2027-02-02']);
check('events: insert', $event['title'] === 'Test event');

// ---- UPDATE ----
check('users: update', $users->update($user['id'], ['phone' => '061 123 456'])['phone'] === '061 123 456');
check('children: update', $children->update($child['id'], ['notes' => 'Likes dinosaurs'])['notes'] === 'Likes dinosaurs');
check('programs: update', (float) $programs->update($program['id'], ['price' => 150])['price'] === 150.0);
check('enrollments: update status', $enrollments->update($enrollment['id'], ['status' => 'approved'])['status'] === 'approved');
check('events: update', $events->update($event['id'], ['location' => 'Garden'])['location'] === 'Garden');

// ---- DELETE (child first, because of the foreign keys) ----
check('events: delete', $events->delete($event['id']));
check('enrollments: delete', $enrollments->delete($enrollment['id']));
check('children: delete', $children->delete($child['id']));
check('programs: delete', $programs->delete($program['id']));
check('users: delete', $users->delete($user['id']));
check('users: getById after delete returns null', $users->getById($user['id']) === null);

echo PHP_EOL . 'Done.' . PHP_EOL;
