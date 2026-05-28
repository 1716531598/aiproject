-- Seed default users (password hashes are injected by runner)
INSERT INTO users (id, name, password_hash, role_id, parent_id, is_login, errcount, timeout) VALUES
    (1, 'admin', '{{ADMIN_PASSWORD_HASH}}', 1, NULL, 1, 5, 30),
    (2, 'user', '{{USER_PASSWORD_HASH}}', 2, NULL, 1, 5, 30),
    (3, 'audit', '{{AUDIT_PASSWORD_HASH}}', 3, NULL, 1, 5, 30)
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
