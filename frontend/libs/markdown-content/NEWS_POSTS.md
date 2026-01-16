# News Posts

This directory contains markdown files for news/blog posts that appear in the ArtCraft app and website.

## Creating a New Post

1. Create a new `.md` file in `src/lib/content/news/` with a URL-friendly filename (e.g., `my-new-feature.md`)
2. Add the required frontmatter at the top of the file
3. Write your content in markdown below the frontmatter

### Frontmatter Template

```yaml
---
title: Your Post Title
abstract: A brief description of the post (shown in the news list)
date: YYYY-MM-DD
thumbnail: https://optional-image-url.com/image.png
---
```

| Field       | Required | Description                                           |
|-------------|----------|-------------------------------------------------------|
| `title`     | Yes      | The title displayed in the news list and post header |
| `abstract`  | Yes      | Short description shown in the news list preview     |
| `date`      | Yes      | Publication date in `YYYY-MM-DD` format              |
| `thumbnail` | No       | URL to an optional header image for the post         |

### Example Post

```markdown
---
title: Welcome to the ArtCraft Blog
abstract: We are excited to launch our new blog where we will share updates and tutorials.
date: 2026-01-16
thumbnail: https://example.com/blog-header.png
---

# Hello World!

Welcome to the official **ArtCraft Blog**. This is where we'll be posting about:

- **New Features**: Be the first to know about the latest tools.
- **Tutorials**: Learn how to get the most out of ArtCraft.
- **Community Showcases**: Highlighting amazing work created by our users.

## Stay Tuned

We have a lot of exciting things in the pipeline!
```

## Building the News Feed

The news posts are compiled into a `news.json` file that is served to the app.

### Automatic Build (Dev Server)

When you run the dev server, news posts are automatically compiled:

```bash
npx nx dev artcraft-website
```

### Manual Build

To manually regenerate `news.json`:

```bash
cd frontend
node scripts/generate-news-json.mjs
```

This will output the compiled JSON to:
```
frontend/apps/artcraft-website/public/news.json
```

## How It Works

1. The `generate-news-json.mjs` script reads all `.md` files from the news content directory
2. It parses the frontmatter and body content
3. It generates a sorted JSON array (newest first by date)
4. The JSON is saved to the website's `public/` folder
5. The app fetches this JSON to display the news feed

## Tips

- **Filename = Slug**: The filename (without `.md`) becomes the URL slug for the post
- **Sorting**: Posts are automatically sorted by date, newest first
- **Markdown Support**: Full markdown is supported including headers, lists, bold, italic, images, and code blocks
- **Hot Reload**: After adding/editing a post, restart the dev server to see changes (or run the build script manually)
