# Automate Markdown(.md) File Creation with Pre-defined Template

> Crafting a Node.js script to automate .md file generation with frontmatter templates and its own content folders.

- Type: Post
- Published: 2024-04-08
- Tags: tooling
- Source: https://irfanadziri.dev/posts/automate-md-file-creation-with-template/

---

Using Markdown(.md) file format for online content writing is popular amongst content writer because of the easiness to use and its simple text formatting.

## What is Frontmatter?

Frontmatter allow content writer to embed unique metadata to the specific content such as the title, the date its written, the author, etc.

Below shows the example of frontmatter in YAML format in the top of an .md file; separated with the actual content with delimiter (---):

```
---
title: 'The Domination of Big 3 CSP Player (AWS vs Azure vs GCP)'
date: '2024-04-08'
author: 'Irfan Zaki'
---
```

## Automating the Task

While frontmatter makes content more organized, manually adding it to each new file can be tedious. To automate the process, simply create a Node.js script(assuming you’re in Node environment).

1. Create a javascript file in the project root folder. For example `newContent.js`.
2. Paste the following code in the file:

```javascript
import fs from "fs";
import path from "path";
import readline from "readline";

// Prompt question in CLI for Title and Author
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function createContent() {
  const title = await prompt("Enter the title for the new content: ");
  const author = await prompt("Enter the author for the new content: ");

  // Define the content folder
  // Assuming the content folder is in /src/writeups and .md file is in the folder
  const folderName = title.toLowerCase().replace(/\s+/g, "-");
  const folderPath = path.join(__dirname, "src", "writeups", folderName);
  const mdFilePath = path.join(folderPath, "content.md");

  fs.mkdirSync(folderPath, { recursive: true });

  // Define the frontmatter template
  const frontmatter = `
  ---
  title: '${title}'
  date: '${new Date().toISOString().split("T")[0]}'
  author: '${author}'
  ---
  `;

  fs.writeFileSync(mdFilePath, frontmatter);

  // Log successful content folder and md file creation with frontmatter template written
  console.log(
    `Template "${title}" created successfully at ${mdFilePath}. Happy writing 😆`
  );
}

createContent().catch((error) => console.error(error));
```

3. Execute `node newContent.js` from the project’s root directory.
4. Node will prompt the **Title** and **Author** for the new content.

**Explanation**: The script will create a folder (based on the title) within a designated content directory (e.g., ‘src/writeups’). Inside the folder, a new Markdown file `content.md` will be created with the frontmatter pre-populated.
