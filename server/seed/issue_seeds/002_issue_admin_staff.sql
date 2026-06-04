-- Bind admin user to an issue staff profile.
INSERT INTO issue_staffs (name, department, job_role, email, phone, user_id, status)
VALUES ('admin', '系统管理', '系统管理员', 'admin@internal', '', 1, '启用')
ON CONFLICT (email) DO NOTHING;
