-- Seed permissions
INSERT INTO permissions (id, key, name, parent_key, sort_order) VALUES
    (1, 'common', '系统配置', NULL, 0),
    (2, 'common/dashboard', '主页面', 'common', 1),
    (3, 'common/user', '用户管理', 'common', 2),
    (4, 'common/role', '角色管理', 'common', 3),
    (5, 'common/auditlog', '审计日志', 'common', 4)
ON CONFLICT (id) DO NOTHING;

SELECT setval('permissions_id_seq', COALESCE((SELECT MAX(id) FROM permissions), 1));
