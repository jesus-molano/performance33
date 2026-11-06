// The account rules the edge functions apply on the server (supabase/functions/_shared/accounts.ts): one source for
// the coaches' web, the functions and this app.

export { isAcceptablePassword, isEmailIdentifier, normalizeUsername, PASSWORD_MIN_LENGTH } from '@accounts'
