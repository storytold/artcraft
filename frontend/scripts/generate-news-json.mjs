
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEWS_DIR = path.resolve(__dirname, '../libs/markdown-content/src/lib/content/news');
const OUTPUT_FILE = path.resolve(__dirname, '../apps/artcraft-website/public/news.json');

const parseFrontmatter = (raw) => {
  const text = raw.replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) {
    return { frontmatter: {}, body: text };
  }
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) return { frontmatter: {}, body: text };
  const header = text.slice(4, end);
  const body = text.slice(end + 5);
  const fm = {};
  for (const line of header.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line
      .slice(idx + 1)
      .trim()
      .replace(/^"|^'|"$|'$/g, "");
    if (key) fm[key] = value;
  }
  return { frontmatter: fm, body };
};

const generateNewsJson = () => {
    if (!fs.existsSync(NEWS_DIR)) {
        console.error(`News directory not found: ${NEWS_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(NEWS_DIR).filter(f => f.endsWith('.md'));
    const posts = files.map(filename => {
        const filePath = path.join(NEWS_DIR, filename);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const { frontmatter, body } = parseFrontmatter(raw);
        const slug = filename.replace(/\.md$/, "");

        return {
            slug,
            title: frontmatter.title || slug,
            description: frontmatter.abstract || "",
            date: frontmatter.date || "",
            thumbnail: frontmatter.thumbnail,
            body,
        };
    }).sort((a, b) => {
      if (a.date && b.date)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      return 0; 
    });

    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2));
    console.log(`Generated news.json at ${OUTPUT_FILE} with ${posts.length} posts.`);
};

generateNewsJson();
