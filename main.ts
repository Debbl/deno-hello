import { Application, Router } from "./deps.ts";
import { THEME } from "./theme.ts";

const app = new Application();

const db = await Deno.openKv();
const USER = "Debbl";

function getCountImage(
  count: number,
  theme: Record<string, { width: number; height: number; data: string }>,
  length = 7
) {
  const countArray = count.toString().padStart(length, "0").split("");
  let x = 0;
  let y = 0;

  const parts = countArray.reduce((acc, next) => {
    const { width = 45, height = 100, data } = theme[next];
    const image = `${acc}<image x="${x}" y="0" width="${width}" height="${height}" xlink:href="${data}" />`;
    x += width;
    if (height > y) y = height;
    return image;
  }, "");

  return `<?xml version="1.0" encoding="UTF-8"?><svg width="${x}" height="${y}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>Moe Count</title><g>${parts}</g></svg>`;
}

const router = new Router();
router.get("/", async (ctx) => {
  let { value } = await db.get<number>([USER]);
  if (!value) value = 0;

  const count = value + 1;
  await db.set([USER], count);

  ctx.response.headers.set("Content-Type", "image/svg+xml");
  ctx.response.headers.set(
    "Cache-Control",
    "max-age=0, no-cache, no-store, must-revalidate"
  );
  const renderSVG = getCountImage(count, THEME);
  ctx.response.body = renderSVG;
});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
