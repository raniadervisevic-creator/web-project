-- =========================================================
-- Magični Svijet — database schema + sample data
-- Import in phpMyAdmin: Import → choose this file → Go
-- =========================================================

CREATE DATABASE IF NOT EXISTS magicni_svijet
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE magicni_svijet;

-- drop in reverse order of dependencies so the file can be re-imported
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS children;
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS users;

-- ---------- 1. users ----------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(50)  NOT NULL,
  last_name     VARCHAR(50)  NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','parent','teacher') NOT NULL DEFAULT 'parent',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- 2. programs ----------
CREATE TABLE programs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  min_age     TINYINT      NOT NULL,
  max_age     TINYINT      NOT NULL,
  description TEXT,
  schedule    VARCHAR(100),
  price       DECIMAL(10,2) NOT NULL DEFAULT 0,
  capacity    INT          NOT NULL DEFAULT 10,
  teacher     VARCHAR(100),
  image       VARCHAR(100)
) ENGINE=InnoDB;

-- ---------- 3. children ----------
CREATE TABLE children (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  parent_id     INT          NOT NULL,
  first_name    VARCHAR(50)  NOT NULL,
  last_name     VARCHAR(50)  NOT NULL,
  date_of_birth DATE         NOT NULL,
  notes         TEXT,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_children_parent FOREIGN KEY (parent_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- 4. enrollments ----------
CREATE TABLE enrollments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  child_id   INT  NOT NULL,
  program_id INT  NOT NULL,
  status     ENUM('pending','approved','active','rejected') NOT NULL DEFAULT 'pending',
  start_date DATE NOT NULL,
  notes      TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_enrollments_child FOREIGN KEY (child_id)
    REFERENCES children(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_program FOREIGN KEY (program_id)
    REFERENCES programs(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------- 5. events ----------
CREATE TABLE events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  program_id  INT NULL,                 -- NULL = event for all groups
  title       VARCHAR(150) NOT NULL,
  description TEXT,
  event_date  DATE NOT NULL,
  location    VARCHAR(100),
  CONSTRAINT fk_events_program FOREIGN KEY (program_id)
    REFERENCES programs(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- Sample data
-- Passwords (hashed with PHP password_hash):
--   admin@magicnisvijet.ba   / Admin123!
--   parent@magicnisvijet.ba  / Parent123!
--   amar@magicnisvijet.ba    / Parent123!
--   teacher@magicnisvijet.ba / Teacher123!
-- =========================================================

INSERT INTO users (first_name, last_name, email, phone, password_hash, role) VALUES
('Admin',   'Magični', 'admin@magicnisvijet.ba',   NULL,              '$2y$10$WH/i1/N7uIoKEOtCZ6ZBP.AkG8iKjs.75.fjNtb25Ipxq2aam.57S', 'admin'),
('Ana',     'Anić',    'parent@magicnisvijet.ba',  '+387 61 000 000', '$2y$10$SOttodp4HniNHkQVcfsTYOKcFSYZdo98kGtoVgvslFdOa.8kEATR.', 'parent'),
('Amar',    'Hodžić',  'amar@magicnisvijet.ba',    '+387 62 111 111', '$2y$10$SOttodp4HniNHkQVcfsTYOKcFSYZdo98kGtoVgvslFdOa.8kEATR.', 'parent'),
('Teacher', 'Demo',    'teacher@magicnisvijet.ba', NULL,              '$2y$10$UxqHsmdfXMW5ZTo4uMJqneYCh5OKrtwgClwGTZIpLfJyK/AIX2PL2', 'teacher');

INSERT INTO programs (name, min_age, max_age, description, schedule, price, capacity, teacher, image) VALUES
('Toddler Bloom',       1, 3, 'Gentle first steps into group play — songs, sensory corners and lots of cuddles.', 'Mon–Fri, 07:30–16:00', 250.00, 12, '[TEACHER NAME]', 'class-toddler.svg'),
('Preschool Explorers', 3, 5, 'Nature walks, story circles and early science — curiosity turned into expeditions.', 'Mon–Fri, 07:30–16:30', 280.00, 18, '[TEACHER NAME]', 'class-preschool.svg'),
('Little Astronauts',   5, 6, 'Letters, numbers and big questions — a confident launch into the first school year.', 'Mon–Fri, 08:00–16:30', 300.00, 20, '[TEACHER NAME]', 'class-astronauts.svg');

INSERT INTO children (parent_id, first_name, last_name, date_of_birth, notes) VALUES
(2, 'Lana',  'Anić',   '2022-03-14', 'Loves painting'),
(2, 'Mirza', 'Anić',   '2024-06-02', 'Allergic to peanuts'),
(3, 'Emina', 'Hodžić', '2021-01-20', NULL);

INSERT INTO enrollments (child_id, program_id, status, start_date, notes) VALUES
(1, 2, 'active',   '2026-09-01', NULL),
(2, 1, 'pending',  '2026-12-01', 'Mornings only at first'),
(3, 3, 'approved', '2027-01-10', NULL);

INSERT INTO events (program_id, title, description, event_date, location) VALUES
(2,    'Autumn leaf hunt',       'Park walk — bring rain boots!',        '2026-11-05', 'City park'),
(NULL, 'Pajama story night',     'Bedtime stories and warm milk.',       '2026-11-07', 'Moon room'),
(3,    'Planetarium field trip', 'Signed permission slip needed.',       '2026-11-12', 'Planetarium'),
(1,    'Music morning',          'Shakers, drums and singing together.', '2026-11-16', 'Story & music room');
