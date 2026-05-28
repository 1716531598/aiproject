-- Seed built-in roles
INSERT INTO roles (id, name, built_in, description) VALUES
    (1, '超级管理员', true, '拥有所有权限'),
    (2, '普通用户', true, '基本访问权限'),
    (3, '审计角色', true, '审计日志查看权限')
ON CONFLICT (id) DO NOTHING;

SELECT setval('roles_id_seq', COALESCE((SELECT MAX(id) FROM roles), 1));
