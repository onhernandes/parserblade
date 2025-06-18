import { resolve } from "node:path";
/// <reference types="vite/client" />
/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "cli/index": resolve(__dirname, "src/cli/index.ts"),
      },
      name: "ParserBlade",
      fileName: (format, entryName) => {
        if (entryName === "cli/index") {
          return "cli/index.js";
        }
        return `parserblade.${format}.js`;
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [
        // Node.js built-in modules
        "stream",
        "node:stream",
        "node:stream/promises",
        "fs",
        "node:fs",
        "path",
        "node:path",
        "crypto",
        "node:crypto",
        "zlib",
        "node:zlib",
        "util",
        // Dependencies
        "csv-parse",
        "csv-stringify",
        "js-yaml",
        "xml-js",
        "JSONStream",
        "node-xml-stream",
        "chalk",
        "commander",
        "tar",
        "adm-zip",
      ],
      output: {
        globals: {
          "csv-parse": "csvParse",
          "csv-stringify": "csvStringify",
          "js-yaml": "jsYaml",
          "xml-js": "xmlJs",
          JSONStream: "JSONStream",
          "node-xml-stream": "nodeXmlStream",
          chalk: "chalk",
          commander: "commander",
        },
      },
    },
    target: "node16",
    sourcemap: true,
    minify: false,
  },
  plugins: [
    dts({
      include: ["src/**/*"],
      exclude: ["**/*.test.ts", "tests/**/*", "src/**/*.test.ts"],
      rollupTypes: true,
    }),
  ],
  // Vitest configuration
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.d.ts",
        "src/cli/**/*",
        "tests/**/*",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    testTimeout: 10000,
  },
});
