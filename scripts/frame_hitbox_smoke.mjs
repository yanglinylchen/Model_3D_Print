import { _electron as electron } from "playwright";
import electronPath from "electron";

const app = await electron.launch({
  executablePath: electronPath,
  args: ["."],
  cwd: process.cwd()
});

try {
  const page = await app.firstWindow();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("#viewport", { timeout: 10_000 });
  await page.locator("#shapeList").selectOption("frame_cube");
  await page.waitForTimeout(1000);

  const viewport = await page.locator("#viewport").boundingBox();
  const center = {
    x: viewport.x + viewport.width / 2,
    y: viewport.y + viewport.height / 2
  };
  await page.mouse.click(center.x, center.y);
  await page.waitForTimeout(300);

  const afterFirstPlace = await page.locator("#blockCount").textContent();
  if (!afterFirstPlace?.includes("1 / 10000")) {
    throw new Error(`Frame cube was not placed: ${afterFirstPlace}`);
  }

  await page.mouse.click(center.x - 160, center.y - 40);
  await page.waitForTimeout(300);

  const metrics = await page.evaluate(() => ({
    blockCountText: document.querySelector("#blockCount")?.textContent || "",
    cursorState: document.querySelector("#cursorState")?.textContent || "",
    selectionInfo: document.querySelector("#selectionInfo")?.textContent || ""
  }));

  if (!metrics.blockCountText.includes("2 / 10000")) {
    throw new Error(`Frame cube hitbox did not support adjacent placement: ${JSON.stringify(metrics)}`);
  }
  if (!metrics.cursorState.includes("1, 0, 0")) {
    throw new Error(`Frame cube adjacent placement used an unexpected target: ${JSON.stringify(metrics)}`);
  }

  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await app.close();
}
