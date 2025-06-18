import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import parserblade, { type DataFormat } from "../../index";
import { detectFormat, getFormatFromExtension, isValidFormat } from "../utils/format-detection";
import { ZodAdapter } from "../../validation/adapters/ZodAdapter";
import { JoiAdapter } from "../../validation/adapters/JoiAdapter";
import { JsonSchemaAdapter } from "../../validation/adapters/JsonSchemaAdapter";
import type { ValidationAdapter } from "../../types/validation";

export const validateCommand = new Command("validate")
  .description("Validate a file against a schema")
  .argument("<file>", "input file to validate")
  .argument("<schema>", "schema file to validate against")
  .option("-f, --format <format>", "input format (auto-detected if not specified)")
  .option("-t, --type <type>", "schema type (zod, joi, json-schema)", "zod")
  .option("--throw", "throw on validation error (default: false)")
  .action(
    async (
      inputFile: string,
      schemaFile: string,
      options: {
        format?: string;
        type?: "zod" | "joi" | "json-schema";
        throw?: boolean;
      },
    ) => {
      try {
        // Resolve file paths relative to current working directory
        const resolvedInputFile = resolve(process.cwd(), inputFile);
        const resolvedSchemaFile = resolve(process.cwd(), schemaFile);

        // Read input file
        const content = readFileSync(resolvedInputFile, "utf8");

        // Determine input format
        let inputFormat: DataFormat;
        if (options.format) {
          if (!isValidFormat(options.format)) {
            console.error(chalk.red(`Error: Unsupported input format '${options.format}'`));
            process.exit(1);
          }
          inputFormat = options.format as DataFormat;
        } else {
          inputFormat = getFormatFromExtension(resolvedInputFile) || detectFormat(content);
        }

        // Read and parse schema file
        const schemaContent = readFileSync(resolvedSchemaFile, "utf8");
        let adapter: ValidationAdapter;

        switch (options.type) {
          case "zod": {
            // For Zod, we need to evaluate the schema file as a module
            const schemaModule = await import(resolvedSchemaFile);
            const schema = schemaModule.default || schemaModule.schema;
            if (!schema || typeof schema.parse !== "function") {
              throw new Error("Invalid Zod schema: schema must export a Zod schema object");
            }
            adapter = new ZodAdapter(schema);
            break;
          }
          case "joi": {
            // For Joi, we need to evaluate the schema file as a module
            const schemaModule = await import(resolvedSchemaFile);
            const schema = schemaModule.default || schemaModule.schema;
            if (!schema || typeof schema.validate !== "function") {
              throw new Error("Invalid Joi schema: schema must export a Joi schema object");
            }
            adapter = new JoiAdapter(schema);
            break;
          }
          case "json-schema": {
            // For JSON Schema, we can parse the file directly
            const schema = JSON.parse(schemaContent);
            adapter = new JsonSchemaAdapter(schema);
            break;
          }
          default:
            throw new Error(`Unsupported schema type: ${options.type}`);
        }

        // Parse and validate the input
        const parser = parserblade[inputFormat];
        const result = parser.validateSchema(content, {
          adapter,
          throwOnError: options.throw || false,
        });

        // Output result
        if (result.success) {
          console.log(chalk.green("✓ Validation successful"));
          process.exit(0);
        } else {
          console.error(chalk.red("✗ Validation failed"));
          if (result.error) {
            console.error(chalk.yellow("\nValidation errors:"));
            for (const issue of result.error.issues) {
              const path = issue.path.length > 0 ? issue.path.join(".") : "root";
              console.error(chalk.red(`  - ${path}: ${issue.message}`));
            }
          }
          process.exit(1);
        }
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`),
        );
        process.exit(1);
      }
    },
  ); 