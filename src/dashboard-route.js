// BY-17: the landing shell needs to recognise dashboard hashes for sign-in
// routing without downloading the dashboard UI. The dashboard module imports
// these routes for its own navigation.
export const dashboardRoutes = Object.freeze({
  home: '#dashboard',
  documents: '#dashboard/documents',
  saved: '#dashboard/saved',
  assessments: '#dashboard/assessments',
  verifications: '#dashboard/verifications',
  account: '#dashboard/account'
});
export const isDashboardRoute = hash => Object.values(dashboardRoutes).includes(hash);
