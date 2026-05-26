export default function access(initialState: { currentUser?: API.CurrentUser } | undefined) {
  const { currentUser } = initialState ?? {};
  const roleType = currentUser?.role_type;
  return {
    canDashboard: roleType === 1 || roleType === 2,
    canUser: roleType === 1,
    canAuditlog: roleType === 1 || roleType === 3,
  };
}
