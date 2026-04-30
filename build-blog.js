#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const SITE_URL = 'https://palmbeachhomesrealty.com';
const BLOG_DIR = path.join(__dirname, 'blog-content');
const BLOG_OUTPUT = path.join(__dirname, 'blog');
const INDEX_OUTPUT = path.join(__dirname, 'blog', 'index.html');
const SITEMAP_OUTPUT = path.join(__dirname, 'sitemap.xml');

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Utility: Parse frontmatter
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, content };

  const meta = {};
  const frontmatter = match[1];
  const body = match[2];

  frontmatter.split('\n').forEach((line) => {
    const [key, ...values] = line.split(':');
    if (key && values.length) {
      let value = values.join(':').trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      meta[key.trim()] = value;
    }
  });

  return { meta, content: body };
}

// Utility: Generate slug from filename
function getSlug(filename) {
  return filename.replace(/\.md$/, '').toLowerCase().replace(/\s+/g, '-');
}

// Utility: Format date (parse as local time to avoid UTC off-by-one)
function formatDate(dateStr) {
  const [year, month, day] = String(dateStr).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Utility: Calculate read time
function calculateReadTime(content) {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes <= 1 ? '1 min' : `${minutes} min`;
}

// Utility: Get related articles
function getRelatedArticles(slug, pillar, articles) {
  return articles
    .filter((a) => a.slug !== slug && a.pillar === pillar)
    .slice(0, 3)
    .map((a) => ({ title: a.title, slug: a.slug, date: a.date }));
}

// Build articles
function build() {
  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
    console.log('Created blog-content directory. Add .md files to it.');
    return;
  }

  if (!fs.existsSync(BLOG_OUTPUT)) {
    fs.mkdirSync(BLOG_OUTPUT, { recursive: true });
  }

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  const articles = [];

  files.forEach((file) => {
    const filepath = path.join(BLOG_DIR, file);
    const rawContent = fs.readFileSync(filepath, 'utf-8');
    const { meta, content } = parseFrontmatter(rawContent);

    if (!meta.title || !meta.date) {
      console.warn(`Skipping ${file}: missing title or date`);
      return;
    }

    const slug = getSlug(file);
    let htmlContent = marked(content);
    // Wrap tables in scrollable container for mobile
    htmlContent = htmlContent.replace(/<table>/g, '<div class="table-scroll"><table>').replace(/<\/table>/g, '</table></div>');
    const readTime = calculateReadTime(content);
    const dateFormatted = formatDate(meta.date);

    articles.push({
      title: meta.title,
      description: meta.description || '',
      keywords: meta.keywords || '',
      slug,
      date: meta.date,
      dateFormatted,
      pillar: meta.pillar || 'General',
      readTime,
      content: htmlContent,
    });
  });

  // Sort by date (newest first)
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Read template
  const templatePath = path.join(BLOG_OUTPUT, '_template.html');
  if (!fs.existsSync(templatePath)) {
    console.warn('_template.html not found. Create it first.');
    return;
  }

  const template = fs.readFileSync(templatePath, 'utf-8');

  // Generate article pages
  articles.forEach((article) => {
    const relatedArticles = getRelatedArticles(article.slug, article.pillar, articles);
    const relatedHTML = relatedArticles
      .map(
        (rel) => `
      <div class="related-article">
        <a href="/blog/${rel.slug}/" class="related-article-link">
          <h4>${rel.title}</h4>
          <span class="related-article-date">${rel.date}</span>
        </a>
      </div>
    `
      )
      .join('');

    let html = template
      .replace(/\{\{TITLE\}\}/g, article.title)
      .replace(/\{\{DESCRIPTION\}\}/g, article.description)
      .replace(/\{\{KEYWORDS\}\}/g, article.keywords)
      .replace(/\{\{SLUG\}\}/g, article.slug)
      .replace(/\{\{DATE\}\}/g, article.date)
      .replace(/\{\{DATE_FORMATTED\}\}/g, article.dateFormatted)
      .replace('{{CONTENT}}', article.content)
      .replace(/\{\{PILLAR\}\}/g, article.pillar)
      .replace(/\{\{READ_TIME\}\}/g, article.readTime)
      .replace('{{RELATED_ARTICLES}}', relatedHTML);

    const articleDir = path.join(BLOG_OUTPUT, article.slug);
    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
    }
    fs.writeFileSync(path.join(articleDir, 'index.html'), html);
    console.log(`✓ ${article.slug}/index.html`);
  });

  // Generate index
  generateIndex(articles);

  // Update sitemap
  updateSitemap(articles);

  console.log(`\n✓ Built ${articles.length} articles`);
}

// Generate blog index
function generateIndex(articles) {
  const indexTemplatePath = path.join(BLOG_OUTPUT, '_index-template.html');
  if (!fs.existsSync(indexTemplatePath)) {
    console.warn('_index-template.html not found.');
    return;
  }

  const indexTemplate = fs.readFileSync(indexTemplatePath, 'utf-8');

  const articleCards = articles
    .map(
      (article) => `
    <div class="article-card">
      <div class="article-card-header">
        <h3><a href="/blog/${article.slug}/">${article.title}</a></h3>
        <span class="article-pillar">${article.pillar}</span>
      </div>
      <p class="article-description">${article.description}</p>
      <div class="article-meta">
        <span class="article-date">${article.dateFormatted}</span>
        <span class="article-read-time">${article.readTime}</span>
      </div>
      <a href="/blog/${article.slug}/" class="btn btn-secondary">Read Article</a>
    </div>
  `
    )
    .join('');

  let html = indexTemplate
    .replace('{{ARTICLE_CARDS}}', articleCards)
    .replace('{{ARTICLE_COUNT}}', articles.length);

  fs.writeFileSync(INDEX_OUTPUT, html);
  console.log('✓ blog/index.html');
}

// Update sitemap
function updateSitemap(articles) {
  const baseEntries = `  <url>
    <loc>${SITE_URL}</loc>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>${SITE_URL}/blog/</loc>
    <changefreq>weekly</changefreq>
  </url>`;

  const articleEntries = articles
    .map(
      (article) => `  <url>
    <loc>${SITE_URL}/blog/${article.slug}/</loc>
    <lastmod>${article.date}</lastmod>
    <changefreq>monthly</changefreq>
  </url>`
    )
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${baseEntries}
${articleEntries}
</urlset>`;

  fs.writeFileSync(SITEMAP_OUTPUT, sitemap);
  console.log('✓ sitemap.xml');
}

// Main
build();
