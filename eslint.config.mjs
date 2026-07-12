import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // shadcn / magic-ui primitives are third-party-sourced. The React-Compiler
  // hooks rules flag legitimate-but-nonideal patterns in them; keep those as
  // warnings HERE only, while our own app code keeps them as errors.
  {
    files: ["src/components/ui/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
    },
  },
]);

export default eslintConfig;
