# 01 — Green build, dead-code purge, and test triage

**What to build:** The frontend compiles and the whole tree is trustworthy again — the build, lint, and tests are green, and the dead-code chains are gone. This is the foundation every other slice stands on.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `npm run build` (`tsc && vite build`) exits zero with no TypeScript errors
- [ ] `npm run lint` passes at `--max-warnings 0`
- [ ] `npx vitest run` is green, reached by triage: fix correct-but-regressed tests, delete tests for purged dead code + out-of-scope speculative features, rewrite tests asserting old/wrong behavior
- [ ] Dead code removed: `socket.io-client` dependency + orphaned `useSocket`; the duplicate SettingsModal (the `modals` one pulling in the missing icon dep); the duplicate particle system (particleManager/celebrationEffects/particleConfig); other confirmed orphans (unused typography/style modules)
- [ ] Interim fix so no screen reads a field its type/the server doesn't provide (full contract alignment is 02)
- [ ] App still runs in dev after the purge
