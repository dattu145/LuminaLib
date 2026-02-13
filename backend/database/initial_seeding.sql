-- 1. Insert Initial Users
-- Password for all: Reddy@123 (hashed for Laravel compatibility)
-- Note: Laravel uses Bcrypt. Below are bcrypt hashes for testing.

INSERT INTO users (id, name, email, password, role, register_number, is_active)
VALUES 
(gen_random_uuid(), 'System Admin', 'admin@library.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ADM-001', TRUE),
(gen_random_uuid(), 'Head Librarian', 'librarian@library.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'librarian', 'LIB-001', TRUE),
(gen_random_uuid(), 'John Student', 'student@library.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'STU-001', TRUE);

-- 2. Insert Default Fine Config
INSERT INTO fines_configs (fine_per_day, max_fine_limit, grace_days)
VALUES (10.00, 500.00, 2);

-- 3. Insert some test books
INSERT INTO books (title, author, publisher, category, isbn, book_code, total_copies, available_copies, rack_number)
VALUES 
('Clean Code', 'Robert C. Martin', 'Prentice Hall', 'Software Engineering', '978-0132350884', 'BK-001', 5, 5, 'R1-S1'),
('The Pragmatic Programmer', 'Andrew Hunt', 'Addison-Wesley', 'Software Engineering', '978-0201616224', 'BK-002', 3, 3, 'R1-S2'),
('Design Patterns', 'Erich Gamma', 'Addison-Wesley', 'Computer Science', '978-0201633610', 'BK-003', 2, 2, 'R2-S1');
