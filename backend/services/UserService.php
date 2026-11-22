<?php
require_once __DIR__ . '/BaseService.php';
require_once __DIR__ . '/../dao/UserDao.php';

class UserService extends BaseService
{
    private const ROLES = ['admin', 'parent', 'teacher'];

    public function __construct()
    {
        parent::__construct(new UserDao(), 'User');
    }

    /** Never send password hashes to the client */
    public function getAll(): array
    {
        return array_map([$this, 'hidePassword'], parent::getAll());
    }

    public function getById(int $id): array
    {
        return $this->hidePassword(parent::getById($id));
    }

    public function create(array $data): array
    {
        $data = $this->onlyFields($data, ['first_name', 'last_name', 'email', 'phone', 'password', 'role']);
        $this->requireFields($data, ['first_name', 'last_name', 'email', 'password']);
        $this->validate($data);

        if ($this->dao->getByEmail($data['email'])) {
            throw new Exception('An account with this email already exists.', 409);
        }

        // store a hash, never the real password
        $data['password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT);
        unset($data['password']);
        $data['role'] = $data['role'] ?? 'parent';

        return $this->hidePassword($this->dao->insert($data));
    }

    public function update(int $id, array $data): array
    {
        $existing = parent::getById($id); // 404 if missing
        $data = $this->onlyFields($data, ['first_name', 'last_name', 'email', 'phone', 'password', 'role']);
        $this->validate($data);

        if (isset($data['email']) && $data['email'] !== $existing['email'] && $this->dao->getByEmail($data['email'])) {
            throw new Exception('An account with this email already exists.', 409);
        }
        if (isset($data['password'])) {
            $data['password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT);
            unset($data['password']);
        }
        if (empty($data)) {
            throw new Exception('Nothing to update.', 400);
        }
        return $this->hidePassword($this->dao->update($id, $data));
    }

    private function validate(array $data): void
    {
        if (isset($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Please enter a valid email address.', 400);
        }
        if (isset($data['password']) && strlen($data['password']) < 8) {
            throw new Exception('The password must be at least 8 characters long.', 400);
        }
        if (isset($data['role']) && !in_array($data['role'], self::ROLES, true)) {
            throw new Exception('The role must be admin, parent or teacher.', 400);
        }
    }

    private function hidePassword(array $user): array
    {
        unset($user['password_hash']);
        return $user;
    }
}
