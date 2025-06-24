import fetch from "node-fetch";
import readline from "readline";
import { stdin as input, stdout as output } from "node:process";
import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import boxen from "boxen";
import { v4 as uuidv4 } from "uuid";
import gradient from "gradient-string";

const salesEngineerUrl = process.env.SALES_ENGINEER_URL;

const mimeTypes = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
  ".webp": "image/webp",
};

// Helper function to display messages in a box
function displayMessage(role, content) {
  const boxStyle = {
    padding: 1,
    margin: { top: 1, bottom: 1 },
    borderStyle: "round",
    borderColor: role === "assistant" ? "blue" : "green",
  };

  const prefix = role === "assistant" ? "🤖" : "👤";
  console.log(
    boxen(`${prefix} ${chalk.bold(role.toUpperCase())}\n\n${content}`, boxStyle)
  );
}

async function main() {
  // Display welcome banner with rainbow effect
  const title = "🚀 Welcome to the Sales Engineer Assistant 🤖";
  console.log(
    boxen(gradient.pastel.multiline(title), {
      padding: 1,
      margin: 1,
      borderStyle: "double",
      borderColor: "cyan",
      textAlignment: "center",
    })
  );

  const rl = readline.createInterface({ input, output });

  // Handle template selection
  const templateInput = await new Promise((resolve) => {
    console.log(chalk.cyan("\n📄 Template Selection"));
    rl.question(
      chalk.yellow(
        "Enter a path to a template file (PDF/image), or press Enter to use the default template: "
      ),
      resolve
    );
  });

  let template, templateContentType;

  try {
    if (!templateInput.trim()) {
      console.log(chalk.dim("Using default template..."));
      const fileBuffer = await fs.readFile("RFP.jpg");
      template = fileBuffer.toString("base64");
      templateContentType = "image/jpeg";
      console.log(chalk.green("✓ Default template loaded successfully."));
    } else {
      console.log(chalk.dim("Reading template file..."));
      const absPath = path.resolve(templateInput.trim());
      const fileBuffer = await fs.readFile(absPath);
      const ext = path.extname(absPath).toLowerCase();
      templateContentType = mimeTypes[ext] || "application/octet-stream";
      template = fileBuffer.toString("base64");
      console.log(chalk.green(`✓ Template loaded: ${chalk.bold(absPath)}`));
    }
  } catch (err) {
    console.error(chalk.red("Error reading template file:"), err);
    rl.close();
    return;
  }

  // Start conversation
  const sessionId = String(uuidv4());
  let jsonObject;
  let done = false;

  async function chat() {
    let isFirstMessage = true;
    while (!done) {
      const userMessage = await new Promise((resolve) => {
        console.log(
          chalk.cyan(
            `\n💬 ${
              isFirstMessage ? "Talk a little about your project" : "Your turn"
            }:`
          )
        );
        rl.question(chalk.yellow("> "), resolve);
      });

      if (userMessage.trim()) {
        displayMessage("user", userMessage);
        console.log(chalk.dim("Processing..."));

        try {
          const payload = isFirstMessage
            ? { sessionId, template, userMessage, templateContentType }
            : { sessionId, userMessage };

          isFirstMessage = false;

          const response = await fetch(salesEngineerUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await response.json();

          if (data.error) {
            console.error(chalk.red("\n❌ Error:"), data.error);
            break;
          }

          jsonObject = data.jsonObject;
          done = data.done;

          displayMessage("assistant", data.message);

          if (done && data.filledTemplate) {
            console.log(
              boxen(
                chalk.cyan.bold("📝 Filled Template\n\n") +
                  chalk.white(data.filledTemplate),
                {
                  padding: 1,
                  margin: 1,
                  borderStyle: "double",
                  borderColor: "cyan",
                }
              )
            );
            break;
          }
        } catch (err) {
          console.error(chalk.red("\n❌ Error:"), err);
          break;
        }
      }
    }
    rl.close();
  }

  await chat();
}

main().catch((err) => console.error(chalk.red("\n❌ Fatal Error:"), err));
