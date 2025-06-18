import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import chalk from "chalk";
import { Command } from "commander";

/**
 * Read data from stdin
 */
function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";

    process.stdin.setEncoding("utf8");

    process.stdin.on("readable", () => {
      let chunk: string | null;
      // biome-ignore lint/suspicious/noAssignInExpressions: Standard Node.js pattern for reading streams
      while (null !== (chunk = process.stdin.read())) {
        data += chunk;
      }
    });

    process.stdin.on("end", () => {
      resolve(data);
    });

    process.stdin.on("error", (error) => {
      reject(error);
    });
  });
}
import parserblade, { type DataFormat } from "../../index";
import {
  detectFormat,
  getFormatFromExtension,
  getSupportedFormats,
  isValidFormat,
} from "../utils/format-detection";
import {
  isCompressed,
  extractFirstTextFile,
  writeCompressedFile,
} from "../../compression";
import { ZodAdapter } from "../../validation/adapters/ZodAdapter";
import { JoiAdapter } from "../../validation/adapters/JoiAdapter";
import { JsonSchemaAdapter } from "../../validation/adapters/JsonSchemaAdapter";
import type { ValidationAdapter } from "../../types/validation";

export const parseCommand = new Command("parse")
  .description("Parse a file and convert it to another format")
  .argument("[file]", "input file to parse (use '-' or omit for stdin)")
  .option("-t, --to <format>", "output format (json, xml, csv, yaml)")
  .option("-o, --output <file>", "output file (default: stdout)")
  .option(
    "-f, --from <format>",
    "input format (auto-detected if not specified)"
  )
  .option("--pretty", "pretty print the output (for JSON and YAML)")
  .option("--minify", "minify the output")
  .option("--schema <file>", "schema file to validate against during parsing")
  .option("--schema-type <type>", "schema type (zod, joi, json-schema)", "zod")
  .option("--validate-throw", "throw on validation error (default: false)")
  .action(
    async (
      inputFile: string | undefined,
      options: {
        to?: string;
        output?: string;
        from?: string;
        pretty?: boolean;
        minify?: boolean;
        schema?: string;
        schemaType?: "zod" | "joi" | "json-schema";
        validateThrow?: boolean;
      }
    ) => {
      try {
        // Determine if we should read from stdin
        const shouldReadFromStdin = !inputFile || inputFile === "-";

        // Read input content
        let content: string;
        if (shouldReadFromStdin) {
          content = await readStdin();
        } else {
          // Check if file is compressed
          if (isCompressed(inputFile)) {
            content = extractFirstTextFile(inputFile);
          } else {
            content = readFileSync(inputFile, "utf8");
          }
        }

        // Determine input format
        let inputFormat: DataFormat;
        if (options.from) {
          if (!isValidFormat(options.from)) {
            console.error(
              chalk.red(`Error: Unsupported input format '${options.from}'`)
            );
            console.error(
              chalk.gray(
                `Supported formats: ${getSupportedFormats().join(", ")}`
              )
            );
            process.exit(1);
          }
          inputFormat = options.from as DataFormat;
        } else {
          inputFormat = shouldReadFromStdin
            ? detectFormat(content)
            : getFormatFromExtension(inputFile) || detectFormat(content);
        }

        // Determine output format
        let outputFormat: DataFormat;
        if (options.to) {
          if (!isValidFormat(options.to)) {
            console.error(
              chalk.red(`Error: Unsupported output format '${options.to}'`)
            );
            console.error(
              chalk.gray(
                `Supported formats: ${getSupportedFormats().join(", ")}`
              )
            );
            process.exit(1);
          }
          outputFormat = options.to as DataFormat;
        } else if (options.output) {
          outputFormat = getFormatFromExtension(options.output) || "json";
        } else {
          outputFormat = "json"; // Default to JSON
        }

        // Setup validation if schema is provided
        let validationAdapter: ValidationAdapter | undefined;
        if (options.schema) {
          const resolvedSchemaFile = resolve(process.cwd(), options.schema);
          const schemaContent = readFileSync(resolvedSchemaFile, "utf8");

          switch (options.schemaType) {
            case "zod": {
              // For Zod, we need to evaluate the schema file as a module
              const schemaModule = await import(resolvedSchemaFile);
              const schema = schemaModule.default || schemaModule.schema;
              if (!schema || typeof schema.parse !== "function") {
                throw new Error(
                  "Invalid Zod schema: schema must export a Zod schema object"
                );
              }
              validationAdapter = new ZodAdapter(schema);
              break;
            }
            case "joi": {
              // For Joi, we need to evaluate the schema file as a module
              const schemaModule = await import(resolvedSchemaFile);
              const schema = schemaModule.default || schemaModule.schema;
              if (!schema || typeof schema.validate !== "function") {
                throw new Error(
                  "Invalid Joi schema: schema must export a Joi schema object"
                );
              }
              validationAdapter = new JoiAdapter(schema);
              break;
            }
            case "json-schema": {
              // For JSON Schema, we can parse the file directly
              const schema = JSON.parse(schemaContent);
              validationAdapter = new JsonSchemaAdapter(schema);
              break;
            }
            default:
              throw new Error(`Unsupported schema type: ${options.schemaType}`);
          }
        }

        // Parse the input with optional validation
        const inputParser = parserblade[inputFormat];
        const parseOptions = validationAdapter
          ? {
              validation: {
                adapter: validationAdapter,
                throwOnError: options.validateThrow || false,
              },
            }
          : undefined;

        const data = inputParser.parse(content, parseOptions);

        // Check if parsing with validation returned a validation result
        if (
          validationAdapter &&
          typeof data === "object" &&
          data !== null &&
          "success" in data
        ) {
          const validationResult = data as any;
          if (!validationResult.success) {
            console.error(chalk.red("✗ Validation failed during parsing"));
            if (validationResult.error) {
              console.error(chalk.yellow("\nValidation errors:"));
              for (const issue of validationResult.error.issues) {
                const path =
                  issue.path.length > 0 ? issue.path.join(".") : "root";
                console.error(chalk.red(`  - ${path}: ${issue.message}`));
              }
            }
            process.exit(1);
          }
          // Use the validated data
          const actualData = validationResult.data;

          // Stringify to output format
          const outputParser = parserblade[outputFormat];
          let result: string;

          if (outputFormat === "json" && options.pretty) {
            result = JSON.stringify(actualData, null, 2);
          } else if (outputFormat === "json" && options.minify) {
            result = JSON.stringify(actualData);
          } else if (outputFormat === "yaml" && options.pretty) {
            result = outputParser.stringify(actualData, { indent: 2 });
          } else {
            result = outputParser.stringify(actualData);
          }

          // Output result
          if (options.output) {
            // Check if output should be compressed
            if (isCompressed(options.output)) {
              writeCompressedFile(result, options.output);
            } else {
              writeFileSync(options.output, result);
            }
            const inputSource = shouldReadFromStdin ? "stdin" : inputFile;
            console.log(
              chalk.green(
                `✓ Converted and validated ${chalk.bold(
                  inputSource
                )} (${inputFormat}) to ${chalk.bold(
                  options.output
                )} (${outputFormat})`
              )
            );
          } else {
            console.log(result);
          }
        } else {
          // Normal parsing without validation or successful validation
          const actualData = data;

          // Stringify to output format
          const outputParser = parserblade[outputFormat];
          let result: string;

          if (outputFormat === "json" && options.pretty) {
            result = JSON.stringify(actualData, null, 2);
          } else if (outputFormat === "json" && options.minify) {
            result = JSON.stringify(actualData);
          } else if (outputFormat === "yaml" && options.pretty) {
            result = outputParser.stringify(actualData, { indent: 2 });
          } else {
            result = outputParser.stringify(actualData);
          }

          // Output result
          if (options.output) {
            // Check if output should be compressed
            if (isCompressed(options.output)) {
              writeCompressedFile(result, options.output);
            } else {
              writeFileSync(options.output, result);
            }
            const inputSource = shouldReadFromStdin ? "stdin" : inputFile;
            const successMessage = validationAdapter
              ? `✓ Converted and validated ${chalk.bold(
                  inputSource
                )} (${inputFormat}) to ${chalk.bold(
                  options.output
                )} (${outputFormat})`
              : `✓ Converted ${chalk.bold(
                  inputSource
                )} (${inputFormat}) to ${chalk.bold(
                  options.output
                )} (${outputFormat})`;
            console.log(chalk.green(successMessage));
          } else {
            console.log(result);
          }
        }
      } catch (error) {
        console.error(
          chalk.red(
            `Error: ${error instanceof Error ? error.message : "Unknown error"}`
          )
        );
        process.exit(1);
      }
    }
  );
