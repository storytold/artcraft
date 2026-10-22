import { expect, test } from "@playwright/test";

const MOBILE_WIDTHS = [320, 360, 375, 390, 414, 430];

test("home page fits common mobile viewport widths without horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /What will you craft today\?/i })).toBeVisible();

  for (const width of MOBILE_WIDTHS) {
    await page.setViewportSize({ width, height: 844 });
    const metrics = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const elements = [...document.querySelectorAll<HTMLElement>("body *")];
      const overflow = elements
        .filter((element) => {
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden") return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.left < -1 || rect.right > viewportWidth + 1);
        })
        .slice(0, 12)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className : "",
          left: Math.round(element.getBoundingClientRect().left),
          right: Math.round(element.getBoundingClientRect().right),
          width: Math.round(element.getBoundingClientRect().width),
        }));

      const main = document.querySelector("main");
      const rect = main?.getBoundingClientRect();

      return {
        viewportWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        main: rect
          ? { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }
          : null,
        overflow,
      };
    });

    console.log("mobile layout metrics:", JSON.stringify(metrics));
    expect(metrics.documentScrollWidth, JSON.stringify(metrics, null, 2)).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(metrics.main, "main content should render").not.toBeNull();
    expect(metrics.main!.width, JSON.stringify(metrics, null, 2)).toBeGreaterThanOrEqual(metrics.viewportWidth - 2);
  }
});
