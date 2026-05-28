-- Seed role-permission mappings
INSERT INTO role_permissions (role_id, permission_id) VALUES
    (1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
    (2, 1), (2, 2),
    (3, 1), (3, 5)
ON CONFLICT ON CONSTRAINT role_permissions_role_id_permission_id_key DO NOTHING;
