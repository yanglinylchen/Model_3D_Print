import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "dist", "web");

async function copyDirectory(source, target) {
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

async function buildWeb() {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(path.join(outDir, "src"), { recursive: true });
  await fs.mkdir(path.join(outDir, "node_modules", "three"), { recursive: true });

  await copyDirectory(path.join(root, "src", "core"), path.join(outDir, "src", "core"));
  await copyDirectory(path.join(root, "src", "renderer"), path.join(outDir, "src", "renderer"));
  await copyDirectory(path.join(root, "assets"), path.join(outDir, "assets"));
  await copyDirectory(
    path.join(root, "node_modules", "three", "build"),
    path.join(outDir, "node_modules", "three", "build")
  );

  const sourceHtml = await fs.readFile(path.join(root, "src", "renderer", "index.html"), "utf8");
  const webHtml = sourceHtml
    .replace('href="./styles.css"', 'href="./src/renderer/styles.css"')
    .replace('src="./web-adapter.js"', 'src="./src/renderer/web-adapter.js"')
    .replace('src="./renderer.js"', 'src="./src/renderer/renderer.js"')
    .replace("../../node_modules/three/build/three.module.js", "./node_modules/three/build/three.module.js");

  await fs.writeFile(path.join(outDir, "index.html"), webHtml, "utf8");
  await fs.writeFile(
    path.join(outDir, ".nojekyll"),
    "Static web build for Model 3D Print.\n",
    "utf8"
  );
  console.log(`Built web app at ${path.relative(root, outDir)}`);
}

await buildWeb();
