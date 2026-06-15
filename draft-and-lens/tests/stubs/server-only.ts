// Test-only stub. In a real Next.js build, the `server-only` package throws if a
// server module is imported into a client bundle — that protection is what keeps
// the prompt IP off the client. The plain test runner is not a Next.js server, so
// importing any `server-only` module would throw on load and prevent the guard
// tests from running. This no-op stand-in lets the tests *import* server modules in
// order to inspect them. It does NOT relax any real protection: the security checks
// read files as text and scan the built browser bundle — they never depend on this
// stub. Aliased in vitest.config.ts for `server-only` and `client-only`.
export {};
