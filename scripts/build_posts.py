#!/usr/bin/env python3
from __future__ import annotations

import dataclasses
import datetime as dt
import html
import re
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "posts"
INDEX_PATH = ROOT / "index.html"

FIELD_LABELS = {
    "Title:": "title",
    "Body:": "body",
    "Tags (comma-separated):": "tags",
    "Date Created (YYYY-MM-DD):": "date",
    "Time Created (HH:MM, 24h):": "time",
    "Author:": "author",
    "Summary/Excerpt:": "summary",
    "Featured Image URL:": "featured_image",
    "Featured Image Alt:": "featured_image_alt",
    "Slug (URL-friendly title):": "slug",
    "Category:": "category",
    "Status (draft/published):": "status",
    "Additional Notes:": "notes",
}


@dataclasses.dataclass
class Post:
    title: str
    body: str
    tags: list[str]
    date: str
    time: str
    author: str
    summary: str
    featured_image: str
    featured_image_alt: str
    slug: str
    category: str
    status: str
    notes: str

    @property
    def datetime(self) -> dt.datetime:
        return dt.datetime.strptime(f"{self.date} {self.time}", "%Y-%m-%d %H:%M")


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ANXiNA · {title}</title>
  <link rel="stylesheet" href="../assets/css/style.css" />
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
</head>
<body>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  <header class="site-header">
    <div class="container">
      <div class="header-top">
        <div class="central-clock" aria-live="polite">
          <span class="central-clock__label">Central</span>
          <time class="central-clock__time" data-central-time></time>
        </div>
        <div class="central-clock">
          <span class="status-dot status-dot--ok" aria-hidden="true"></span>
          <span class="central-clock__label">Conectado</span>
        </div>
      </div>
      <div class="brand">
        <div class="brand__badge">
          <h1 class="brand__title">ANXiNA</h1>
        </div>
        <p class="brand__subtitle">Noticias de tecnología, ciencia y videojuegos con señal clara.</p>
      </div>
      <div class="header-meta">
        <nav class="nav" aria-label="Navegación principal">
          <a href="../index.html">Inicio</a>
          <a href="../pages/contactanos.html">Contáctanos</a>
          <a href="../pages/politica_de_privacidad.html">Política de privacidad</a>
          <a href="../pages/benefactores.html">Benefactores</a>
          <a href="../pages/terminos_de_servicio.html">Términos</a>
        </nav>
        <label class="search" aria-label="Buscar en ANXiNA">
          <span class="search__prompt" aria-hidden="true">&gt;_</span>
          <input type="search" placeholder="buscar..." />
        </label>
        <button class="theme-toggle" type="button" aria-pressed="false" aria-label="Activar tema claro">
          <span class="theme-toggle__icon material-symbols-outlined" aria-hidden="true">dark_mode</span>
          <span class="theme-toggle__switch" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </header>

  <main id="contenido" class="page">
    <div class="container">
      <article class="post">
        <div class="badge">Análisis · {category}</div>
        <h1>{title}</h1>
        <div class="post__meta">
          <span>{date} · {time}</span>
          <span>{author}</span>
        </div>
        <img src="{featured_image}" alt="{featured_image_alt}" style="width: 100%; border-radius: 12px;" />
{body}
        <div class="post__tags">
{tags}
        </div>
      </article>
    </div>
  </main>

  <footer class="footer">
    <div class="container">
      <p>
        ANXiNA · Tecnología con criterio. Escríbenos en <a href="../pages/contactanos.html">Contáctanos</a> o revisa nuestra
        <a href="../pages/politica_de_privacidad.html">política de privacidad</a>.
      </p>
    </div>
  </footer>
  <script src="../assets/js/central-time.js"></script>
  <script src="../assets/js/theme-toggle.js"></script>
  <script src="../assets/js/nav-menu.js"></script>
</body>
</html>
"""


STREAM_ITEM_TEMPLATE = """        <article class="post post--compact">
          <a href="posts/{slug}.html">
            <img class="post__thumb" src="{image}" alt="{alt}" />
          </a>
          <div class="post__body">
            <h4>
              <a class="post__title-link" href="posts/{slug}.html">{title}</a>
            </h4>
            <div class="post__meta">
              <span>{date}</span>
              <span>{author} · {category}</span>
            </div>
            <p>{summary}</p>
            <div class="post__tags">
{tags}
            </div>
            <div class="post__actions">
              <a class="button" href="posts/{slug}.html">Leer artículo</a>
            </div>
          </div>
        </article>"""


def parse_post(path: Path) -> Post:
    content = path.read_text(encoding="utf-8")
    lines = content.splitlines()
    data: dict[str, list[str]] = {key: [] for key in FIELD_LABELS.values()}
    current_key: str | None = None

    for line in lines:
        line_stripped = line.strip()
        if line_stripped in FIELD_LABELS:
            current_key = FIELD_LABELS[line_stripped]
            continue

        if current_key:
            data[current_key].append(line)

    def join_field(key: str) -> str:
        return "\n".join(data[key]).strip()

    tags = [tag.strip() for tag in join_field("tags").split(",") if tag.strip()]

    return Post(
        title=join_field("title"),
        body=join_field("body"),
        tags=tags,
        date=join_field("date"),
        time=join_field("time"),
        author=join_field("author"),
        summary=join_field("summary"),
        featured_image=join_field("featured_image"),
        featured_image_alt=join_field("featured_image_alt") or f"Imagen destacada de {join_field('title')}",
        slug=join_field("slug"),
        category=join_field("category"),
        status=join_field("status"),
        notes=join_field("notes"),
    )


def normalize_post_image(src: str) -> str:
    if src.startswith(("http://", "https://", "/", "../")):
        return src
    if src.startswith("assets/"):
        return f"../{src}"
    return f"../assets/img/{src}"


def normalize_index_image(src: str) -> str:
    if src.startswith(("http://", "https://", "/")):
        return src
    if src.startswith("../"):
        return src[3:]
    if src.startswith("assets/"):
        return src
    return f"assets/img/{src}"


def format_tags(tags: Iterable[str], limit: int | None = None, indent: str = "          ") -> str:
    normalized: list[str] = []
    for tag in tags:
        cleaned = tag.strip()
        if not cleaned:
            continue
        cleaned = cleaned.lower().replace(" ", "")
        normalized.append(cleaned)

    if limit is not None:
        normalized = normalized[:limit]

    return "\n".join(f"{indent}<span>#{html.escape(tag)}</span>" for tag in normalized)


def render_body_markdown(text: str) -> str:
    lines = text.splitlines()
    html_lines: list[str] = []
    paragraph: list[str] = []
    in_list = False

    def flush_paragraph() -> None:
        nonlocal paragraph
        if paragraph:
            content = " ".join(html.escape(line.strip()) for line in paragraph if line.strip())
            html_lines.append(f"        <p>{content}</p>")
            paragraph = []

    def close_list() -> None:
        nonlocal in_list
        if in_list:
            html_lines.append("        </ul>")
            in_list = False

    for raw_line in lines:
        line = raw_line.rstrip()
        stripped = line.strip()

        if not stripped:
            flush_paragraph()
            close_list()
            continue

        heading_match = re.match(r"^(#{1,3})\s+(.*)", stripped)
        if heading_match:
            flush_paragraph()
            close_list()
            level = len(heading_match.group(1))
            content = html.escape(heading_match.group(2))
            html_lines.append(f"        <h{level}>{content}</h{level}>")
            continue

        if stripped.startswith("- "):
            flush_paragraph()
            if not in_list:
                html_lines.append("        <ul>")
                in_list = True
            item = html.escape(stripped[2:].strip())
            html_lines.append(f"          <li>{item}</li>")
            continue

        paragraph.append(stripped)

    flush_paragraph()
    close_list()

    return "\n".join(html_lines)


def render_post(post: Post) -> str:
    body_html = render_body_markdown(post.body)
    tags_html = format_tags(post.tags)
    return HTML_TEMPLATE.format(
        title=html.escape(post.title),
        category=html.escape(post.category),
        date=html.escape(post.date),
        time=html.escape(post.time),
        author=html.escape(post.author),
        featured_image=html.escape(normalize_post_image(post.featured_image)),
        featured_image_alt=html.escape(post.featured_image_alt),
        body=body_html,
        tags=tags_html,
    )


def render_stream(posts: list[Post]) -> str:
    items: list[str] = []
    for post in posts:
        items.append(
            STREAM_ITEM_TEMPLATE.format(
                image=html.escape(normalize_index_image(post.featured_image)),
                alt=html.escape(post.featured_image_alt),
                title=html.escape(post.title),
                date=html.escape(post.date),
                author=html.escape(post.author),
                category=html.escape(post.category),
                summary=html.escape(post.summary),
                tags=format_tags(post.tags, limit=2, indent="              "),
                slug=html.escape(post.slug),
            )
        )
    return "\n".join(items)


def update_index(stream_html: str) -> None:
    content = INDEX_PATH.read_text(encoding="utf-8")
    start_marker = "<!-- posts:begin -->"
    end_marker = "<!-- posts:end -->"

    if start_marker not in content or end_marker not in content:
        raise RuntimeError("Missing stream markers in index.html")

    before, rest = content.split(start_marker, 1)
    _, after = rest.split(end_marker, 1)

    updated = f"{before}{start_marker}\n{stream_html}\n        {end_marker}{after}"
    INDEX_PATH.write_text(updated, encoding="utf-8")


def main() -> None:
    posts = [parse_post(path) for path in POSTS_DIR.glob("*.txt")]
    posts_sorted = sorted(posts, key=lambda post: post.datetime, reverse=True)

    for post in posts:
        html_output = render_post(post)
        output_path = POSTS_DIR / f"{post.slug}.html"
        output_path.write_text(html_output, encoding="utf-8")

    published = [post for post in posts_sorted if post.status.lower() == "published"]
    stream_html = render_stream(published)
    update_index(stream_html)


if __name__ == "__main__":
    main()
