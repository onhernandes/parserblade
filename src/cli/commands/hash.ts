import { existsSync } from "node:fs";
import chalk from "chalk";
import { Command } from "commander";
import {
  type HashAlgorithm,
  type HashResult,
  getSupportedAlgorithms,
  isValidAlgorithm,
  hashFile,
  hashFileMultiple,
  hashStdin,
  formatHashResult,
} from "../utils/hash";

/**
 * Read data from stdin
 */
function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";

    process.stdin.setEncoding("utf8");

    process.stdin.on("readable", () => {
      let chunk;
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

export const hashCommand = new Command("hash")
  .description("Generate checksums/hashes for files or stdin data")
  .argument("[files...]", "files to hash (use '-' or omit for stdin)")
  .option(
    "-a, --algo <algorithm>",
    "hash algorithm (md5, sha1, sha256, sha512)",
    "sha256"
  )
  .option("--all", "generate all supported hash algorithms")
  .option("--short", "output only the hash value (no metadata)")
  .option("--verify <hash>", "verify file against expected hash value")
  .action(
    async (
      files: string[] | undefined,
      options: {
        algo?: string;
        all?: boolean;
        short?: boolean;
        verify?: string;
      }
    ) => {
      try {
        // Determine if we should read from stdin
        const shouldReadFromStdin =
          !files ||
          files.length === 0 ||
          (files.length === 1 && files[0] === "-");

        // Validate algorithm if specified
        if (options.algo && !isValidAlgorithm(options.algo)) {
          console.error(
            chalk.red(`Error: Unsupported algorithm '${options.algo}'`)
          );
          console.error(
            chalk.gray(
              `Supported algorithms: ${getSupportedAlgorithms().join(", ")}`
            )
          );
          process.exit(1);
        }

        const algorithm = (options.algo as HashAlgorithm) || "sha256";
        const outputFormat = options.short ? "short" : "long";

        if (shouldReadFromStdin) {
          // Handle stdin input
          const data = await readStdin();

          if (options.all) {
            // Generate all algorithms for stdin data
            const algorithms = getSupportedAlgorithms();
            const results = algorithms.map((algo) => hashStdin(data, algo));

            for (const result of results) {
              console.log(formatHashResult(result, outputFormat));
            }
          } else {
            // Single algorithm for stdin
            const result = hashStdin(data, algorithm);

            if (options.verify) {
              const isValid =
                result.hash.toLowerCase() === options.verify.toLowerCase();
              if (isValid) {
                console.log(chalk.green("✓ Hash verification successful"));
                console.log(formatHashResult(result, outputFormat));
              } else {
                console.error(chalk.red("✗ Hash verification failed"));
                console.error(chalk.gray(`Expected: ${options.verify}`));
                console.error(chalk.gray(`Actual:   ${result.hash}`));
                process.exit(1);
              }
            } else {
              console.log(formatHashResult(result, outputFormat));
            }
          }
        } else {
          // Handle file input(s)
          for (const filePath of files) {
            // Check if file exists
            if (!existsSync(filePath)) {
              console.error(chalk.red(`Error: File '${filePath}' not found`));
              process.exit(1);
            }

            if (options.all) {
              // Generate all algorithms for file
              const results = hashFileMultiple(filePath);

              if (files.length > 1) {
                console.log(chalk.blue(`\n${filePath}:`));
              }

              for (const result of results) {
                console.log(formatHashResult(result, outputFormat));
              }
            } else {
              // Single algorithm for file
              const result = hashFile(filePath, algorithm);

              if (options.verify) {
                const isValid =
                  result.hash.toLowerCase() === options.verify.toLowerCase();
                if (isValid) {
                  console.log(chalk.green("✓ Hash verification successful"));
                  console.log(formatHashResult(result, outputFormat));
                } else {
                  console.error(chalk.red("✗ Hash verification failed"));
                  console.error(chalk.gray(`Expected: ${options.verify}`));
                  console.error(chalk.gray(`Actual:   ${result.hash}`));
                  process.exit(1);
                }
              } else {
                console.log(formatHashResult(result, outputFormat));
              }
            }
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
