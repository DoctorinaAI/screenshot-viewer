// Compile-time backend selector. Vite inlines `import.meta.env.VITE_BACKEND`
// as a string literal during build, so Rollup can dead-code-eliminate the
// unused branch in any `if (USE_FAKE_BACKEND) { ... } else { ... }` block —
// the Firebase SDK does not land in the fake bundle, and vice versa.
//
// Toggle with `vite --mode fake` (loads .env.fake) or by exporting
// `VITE_BACKEND=fake` before running any vite command.

export const USE_FAKE_BACKEND: boolean = import.meta.env.VITE_BACKEND === "fake";
