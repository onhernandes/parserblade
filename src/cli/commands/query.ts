import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import jsonpath from "jsonpath";
import parserblade, { type DataFormat } from "../../index";
import {
  detectFormat,
  getFormatFromExtension,
  getSupportedFormats,
  isValidFormat,
} from "../utils/format-detection";
import { isCompressed, extractFirstTextFile } from "../../compression";

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

/**
 * Parse data to JSON object for querying
 */
function parseDataToJson(content: string, format: DataFormat): unknown {
  const parser = parserblade[format];
  return parser.parse(content);
}

/**
 * Format query results for output
 */
function formatResults(
  results: unknown,
  outputFormat: DataFormat,
  pretty: boolean
): string {
  if (outputFormat === "json") {
    return pretty ? JSON.stringify(results, null, 2) : JSON.stringify(results);
  }

  // For other formats, convert through JSON first
  const parser = parserblade[outputFormat];

  if (outputFormat === "yaml" && pretty) {
    return parser.stringify(results, { indent: 2 });
  }

  return parser.stringify(results);
}

export const queryCommand = new Command("query")
  .description("Query data using JSONPath expressions")
  .argument("[file]", "input file to query (use '-' or omit for stdin)")
  .argument("<query>", "JSONPath query expression (e.g., '$.users[*].email')")
  .option(
    "-f, --from <format>",
    "input format (auto-detected if not specified)"
  )
  .option("-t, --to <format>", "output format (json, xml, csv, yaml)", "json")
  .option("--pretty", "pretty print the output")
  .option(
    "--count",
    "return count of matching elements instead of the elements"
  )
  .option("--first", "return only the first matching element")
  .option("--unique", "return only unique values (removes duplicates)")
  .action(
    async (
      inputFile: string | undefined,
      queryExpression: string,
      options: {
        from?: string;
        to?: string;
        pretty?: boolean;
        count?: boolean;
        first?: boolean;
        unique?: boolean;
      }
    ) => {
      try {
        // Validate JSONPath expression
        if (!queryExpression) {
          console.error(
            chalk.red("Error: JSONPath query expression is required")
          );
          console.error(
            chalk.gray(
              "Example: npx parserblade query data.json '$.users[*].email'"
            )
          );
          process.exit(1);
        }

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

        // Validate output format
        const outputFormat = options.to as DataFormat;
        if (!isValidFormat(outputFormat)) {
          console.error(
            chalk.red(`Error: Unsupported output format '${outputFormat}'`)
          );
          console.error(
            chalk.gray(`Supported formats: ${getSupportedFormats().join(", ")}`)
          );
          process.exit(1);
        }

        // Parse data to JSON for querying
        const jsonData = parseDataToJson(content, inputFormat);

        // Validate JSONPath expression by testing it
        let queryResults: unknown;
        try {
          queryResults = jsonpath.query(jsonData, queryExpression);
        } catch (error) {
          console.error(chalk.red("Error: Invalid JSONPath expression"));
          console.error(chalk.gray(`Expression: ${queryExpression}`));
          console.error(
            chalk.gray(
              `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            )
          );
          console.error(
            chalk.yellow("\nExamples of valid JSONPath expressions:")
          );
          console.error(
            chalk.gray("  $.users[*].email          # All user emails")
          );
          console.error(
            chalk.gray("  $.data[?(@.active)]       # All active items")
          );
          console.error(
            chalk.gray(
              "  $..name                   # All name fields recursively"
            )
          );
          console.error(chalk.gray("  $.users[0]                # First user"));
          console.error(
            chalk.gray("  $.users.length            # Number of users")
          );
          process.exit(1);
        }

        // Process results based on options
        let finalResults: unknown = queryResults;

        if (options.count) {
          finalResults = Array.isArray(queryResults)
            ? queryResults.length
            : queryResults !== undefined
            ? 1
            : 0;
        } else if (options.first) {
          finalResults =
            Array.isArray(queryResults) && queryResults.length > 0
              ? queryResults[0]
              : null;
        } else if (options.unique && Array.isArray(queryResults)) {
          finalResults = [
            ...new Set(queryResults.map((item) => JSON.stringify(item))),
          ].map((item) => JSON.parse(item));
        }

        // Handle empty results
        if (Array.isArray(finalResults) && finalResults.length === 0) {
          console.log(
            chalk.yellow("No results found for the given JSONPath expression")
          );
          process.exit(0);
        }

        // Format and output results
        const formattedResults = formatResults(
          finalResults,
          outputFormat,
          options.pretty || false
        );
        console.log(formattedResults);

        // Show helpful information in some cases
        if (
          !options.count &&
          Array.isArray(queryResults) &&
          queryResults.length > 0
        ) {
          const inputSource = shouldReadFromStdin ? "stdin" : inputFile;
          console.error(
            chalk.gray(
              `✓ Found ${queryResults.length} result(s) from ${inputSource} using query: ${queryExpression}`
            )
          );
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
