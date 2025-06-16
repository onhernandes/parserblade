import { readFileSync, writeFileSync } from "node:fs";
import chalk from "chalk";
import { Command } from "commander";
import parserblade, { type DataFormat } from "../../index";
import {
  detectFormat,
  getFormatFromExtension,
  getSupportedFormats,
  isValidFormat,
} from "../utils/format-detection";

export const parseCommand = new Command("parse")
  .description("Parse a file and convert it to another format")
  .argument("<file>", "input file to parse")
  .option("-t, --to <format>", "output format (json, xml, csv, yaml)")
  .option("-o, --output <file>", "output file (default: stdout)")
  .option(
    "-f, --from <format>",
    "input format (auto-detected if not specified)"
  )
  .option("--pretty", "pretty print the output (for JSON and YAML)")
  .option("--minify", "minify the output")
  .action(
    async (
      inputFile: string,
      options: {
        to?: string;
        output?: string;
        from?: string;
        pretty?: boolean;
        minify?: boolean;
      }
    ) => {
      try {
        // Read input file
        const content = readFileSync(inputFile, "utf8");

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
          inputFormat =
            getFormatFromExtension(inputFile) || detectFormat(content);
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

        // Parse the input
        const inputParser = parserblade[inputFormat];
        const data = inputParser.parse(content);

        // Stringify to output format
        const outputParser = parserblade[outputFormat];
        let result: string;

        if (outputFormat === "json" && options.pretty) {
          result = JSON.stringify(data, null, 2);
        } else if (outputFormat === "json" && options.minify) {
          result = JSON.stringify(data);
        } else if (outputFormat === "yaml" && options.pretty) {
          result = outputParser.stringify(data, { indent: 2 });
        } else {
          result = outputParser.stringify(data);
        }

        // Output result
        if (options.output) {
          writeFileSync(options.output, result);
          console.log(
            chalk.green(
              `✓ Converted ${chalk.bold(
                inputFile
              )} (${inputFormat}) to ${chalk.bold(
                options.output
              )} (${outputFormat})`
            )
          );
        } else {
          console.log(result);
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
