-- Default products
INSERT INTO issue_products (name, description) VALUES
    ('RayScan', 'RayScan 产品'),
    ('RayBox', 'RayBox 产品'),
    ('主机加固', '主机加固产品')
ON CONFLICT (name) DO NOTHING;

-- Default issue types
INSERT INTO issue_issue_types (name, sort_order)
SELECT name, sort_order
FROM (
    VALUES
        ('硬件问题', 1),
        ('性能问题', 2),
        ('功能问题', 3),
        ('漏报误报', 4),
        ('设计缺陷', 5),
        ('配置问题', 6),
        ('兼容性问题', 7)
) AS defaults(name, sort_order)
WHERE NOT EXISTS (
    SELECT 1 FROM issue_issue_types existing WHERE existing.name = defaults.name
);
