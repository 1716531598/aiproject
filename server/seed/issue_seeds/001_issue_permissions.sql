-- Issue tracking permission tree
INSERT INTO permissions (key, name, parent_key, sort_order) VALUES
    ('issue', '问题管理', NULL, 10),
    ('issue/dashboard', '个人看板', 'issue', 1),
    ('issue/bug_view', '查看网上问题', 'issue', 2),
    ('issue/bug_edit', '编辑扩展信息', 'issue', 3),
    ('issue/bug_export', '导出问题报表', 'issue', 4),
    ('issue/bug_import', '导入禅道数据', 'issue', 5),
    ('issue/resp_assign', '编辑责任分配', 'issue', 6),
    ('issue/assessment', '配置考核版本', 'issue', 7),
    ('issue/poc_import', '导入周报数据', 'issue', 8),
    ('issue/stat_view', '查看统计大盘', 'issue', 9),
    ('issue/stat_export', '导出统计报表', 'issue', 10),
    ('issue/todo_manage', '管理全部待办', 'issue', 11),
    ('issue/product_manage', '管理产品/模块/版本', 'issue', 12)
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE key LIKE 'issue%'
ON CONFLICT (role_id, permission_id) DO NOTHING;
