import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const contentRoot = path.join(process.cwd(), "content");
const outputFile = path.join(process.cwd(), "migration.sql");

function escapeSql(value) {
  if (typeof value !== "string") return "";
  return value.replace(/'/g, "''");
}

function normalizeDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value;
  return "";
}

function markdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) => file.endsWith(".md") && !file.startsWith("."));
}

async function run() {
  let sql = "-- Cloudflare D1 content seed\n";
  sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

  sql += "-- Posts\n";
  const postsDir = path.join(contentRoot, "posts");
  for (const file of markdownFiles(postsDir)) {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(postsDir, file), "utf8");
    const { data, content } = matter(raw);
    const title = typeof data.title === "string" ? data.title : slug;
    const date = normalizeDate(data.date);
    const description =
      typeof data.description === "string"
        ? data.description
        : content.replace(/\s+/g, " ").trim().slice(0, 120);
    const category = typeof data.category === "string" ? data.category : "";

    sql +=
      "INSERT OR REPLACE INTO posts (slug, title, date, description, category, content) VALUES " +
      `('${escapeSql(slug)}', '${escapeSql(title)}', '${escapeSql(date)}', '${escapeSql(description)}', '${escapeSql(category)}', '${escapeSql(content)}');\n`;
  }

  sql += "\n-- Daily\n";
  const dailyDir = path.join(contentRoot, "daily");
  for (const file of markdownFiles(dailyDir)) {
    const raw = fs.readFileSync(path.join(dailyDir, file), "utf8");
    const { data, content } = matter(raw);
    const date = normalizeDate(data.date) || file.replace(/\.md$/, "");
    const title = typeof data.title === "string" ? data.title : "";
    const imageUrl =
      typeof data.imageUrl === "string" ? data.imageUrl : typeof data.image === "string" ? data.image : "";

    sql +=
      "INSERT OR REPLACE INTO daily (filename, date, title, content, image_url) VALUES " +
      `('${escapeSql(file)}', '${escapeSql(date)}', '${escapeSql(title)}', '${escapeSql(content)}', '${escapeSql(imageUrl)}');\n`;
  }

  sql += "\n-- Moments\n";
  const momentsDir = path.join(contentRoot, "moments");
  for (const file of markdownFiles(momentsDir)) {
    const raw = fs.readFileSync(path.join(momentsDir, file), "utf8");
    const { data, content } = matter(raw);
    const title = typeof data.title === "string" ? data.title : file;
    const date = normalizeDate(data.date) || file.replace(/\.md$/, "");
    const imageUrl =
      typeof data.imageUrl === "string" ? data.imageUrl : typeof data.image === "string" ? data.image : "";

    sql +=
      "INSERT OR REPLACE INTO moments (filename, title, date, image_url, content) VALUES " +
      `('${escapeSql(file)}', '${escapeSql(title)}', '${escapeSql(date)}', '${escapeSql(imageUrl)}', '${escapeSql(content)}');\n`;
  }

  fs.writeFileSync(outputFile, sql);
  console.log(`Migration SQL generated: ${outputFile}`);
}

run().catch((error) => {
  console.error("Failed to generate migration SQL:", error);
  process.exitCode = 1;
});
