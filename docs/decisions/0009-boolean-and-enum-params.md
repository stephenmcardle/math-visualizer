# 0009: Boolean and enum parameters

- **Status:** Accepted
- **Date:** 2026-10-09

## Context

ADR 0004 made parameters schema-driven but numeric only. Visualizations need on/off options
(show trails) and choices from a fixed set (lattice type, rule, algorithm). Shared links must keep
working: adding a param to an existing visualization can't change how old URLs replay.

## Decision

- `ParamSpec` is a union discriminated by `type`: `NumberParamSpec` (`type` optional, so every
  existing schema is unchanged), `BooleanParamSpec` (`type: "boolean"`) and `EnumParamSpec`
  (`type: "enum"`, `options: { value, label }[]`). `ParamValues` maps them to `number`, `boolean`
  and `string`. Enum values are typed as `string`, not a literal union, to keep schemas free of
  `as const`.
- URLs: booleans serialize as `1`/`0` (`true`/`false` also parse); enums as the option `value`.
  Missing, malformed or unknown values fall back to the default, as numbers already did.
- Enum option values must be lowercase kebab-case and unique; the default must be an option.
  `validateDefinition` enforces this, along with boolean defaults, so mistakes fail tests and the
  build.
- Controls: booleans render as a `Switch`, enums as a `Select`, each with the same label and
  description wiring as sliders. `live` works the same for every type.
- Adding a param to an existing visualization requires a default that reproduces the old
  behavior, and a test that pins the output of an old link (see the random walk).

## Alternatives considered

- **Enums as numeric indices:** fits the old number-only code, but URLs like `directions=1` are
  opaque and break if options are reordered.
- **Literal-typed enum values (`as const`):** stronger types in simulations, at the cost of
  boilerplate in every schema. Can be added later without changing URLs.
- **Radio groups or segmented controls for enums:** more visible for two or three options, but a
  select scales to longer lists and matches the existing quality control.

## Consequences

- New visualizations can offer choices without custom React code.
- Per-visualization custom controls (the other half of the roadmap item) are still not supported;
  add them when a visualization needs a control the schema can't express.
- This extends ADR 0004 rather than replacing it.
