// The anon key is public, so the function also needs to know a real user is
// asking. Supabase checks the token's signature before this code runs, because
// the function is deployed with verify_jwt on, so only its role is left to read.
export function isUserToken(authorization: string | null): boolean {
  const payload = authorization?.split('.')[1];
  if (!payload) return false;
  try {
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return claims.role === 'authenticated';
  } catch {
    return false;
  }
}
