#!/usr/bin/env python3
from __future__ import annotations

import dataclasses
import datetime as dt
import html
import json
import re
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "posts"
INDEX_PATH = ROOT / "index.html"
AUTHORS_PATH = ROOT / "data" / "authors.json"

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
    source_path: Path

    @property
    def datetime(self) -> dt.datetime:
        return dt.datetime.strptime(f"{self.date} {self.time}", "%Y-%m-%d %H:%M")


@dataclasses.dataclass
class Author:
    key: str
    name: str
    title: str
    bio: str
    image: str
    image_alt: str


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
{author_card}
      </article>
{related_section}
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

HERO_TEMPLATE = """        <article class="hero__card">
          <a href="posts/{slug}.html">
            <img class="hero__thumb" src="{image}" alt="{alt}" />
          </a>
          <div class="hero__content">
            <div class="badge">En portada</div>
            <h2>
              <a class="post__title-link" href="posts/{slug}.html">{title}</a>
            </h2>
            <p>{summary}</p>
            <div class="post__actions">
              <a class="button" href="posts/{slug}.html">Leer artículo</a>
            </div>
          </div>
        </article>"""


RELATED_ITEM_TEMPLATE = """          <article class="post post--compact">
            <a href="{slug}.html">
              <img class="post__thumb" src="{image}" alt="{alt}" />
            </a>
            <div class="post__body">
              <h3>
                <a class="post__title-link" href="{slug}.html">{title}</a>
              </h3>
              <div class="post__meta">
                <span>{date}</span>
                <span>{author} · {category}</span>
              </div>
              <div class="post__tags">
{tags}
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
        source_path=path,
    )


def load_authors() -> dict[str, Author]:
    if not AUTHORS_PATH.exists():
        return {}

    data = json.loads(AUTHORS_PATH.read_text(encoding="utf-8"))
    authors: dict[str, Author] = {}
    for key, details in data.items():
        authors[key] = Author(
            key=key,
            name=details.get("name", key),
            title=details.get("title", ""),
            bio=details.get("bio", ""),
            image=details.get("image", ""),
            image_alt=details.get("image_alt", f"Retrato de {details.get('name', key)}"),
        )
    return authors


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


def normalize_tag(tag: str) -> str:
    return tag.strip().lower().replace(" ", "")


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


def render_related_section(related_posts: list[Post]) -> str:
    if not related_posts:
        return ""

    items: list[str] = []
    for post in related_posts:
        items.append(
            RELATED_ITEM_TEMPLATE.format(
                image=html.escape(normalize_post_image(post.featured_image)),
                alt=html.escape(post.featured_image_alt),
                title=html.escape(post.title),
                date=html.escape(post.date),
                author=html.escape(post.author),
                category=html.escape(post.category),
                tags=format_tags(post.tags, limit=2, indent="                "),
                slug=html.escape(post.slug),
            )
        )

    items_html = "\n".join(items)
    return (
        "\n"
        "      <section class=\"related\">\n"
        "        <h2 class=\"section-title\">Tal vez te interese</h2>\n"
        "        <div class=\"related__grid\">\n"
        f"{items_html}\n"
        "        </div>\n"
        "      </section>"
    )


def render_post(post: Post, related_posts: list[Post], author: Author | None) -> str:
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
        author_card=render_author_card(author) if author else "",
        related_section=render_related_section(related_posts),
    )


def render_author_card(author: Author) -> str:
    if not author:
        return ""

    image = normalize_post_image(author.image) if author.image else ""
    image_html = (
        f'        <img class="author-card__avatar" src="{html.escape(image)}" alt="{html.escape(author.image_alt)}" />'
        if image
        else ""
    )
    return (
        "\n"
        '        <section class="author-card">\n'
        f"{image_html}\n"
        '          <div class="author-card__details">\n'
        f"            <p class=\"author-card__name\">{html.escape(author.name)}</p>\n"
        f"            <p class=\"author-card__title\">{html.escape(author.title)}</p>\n"
        f"            <p class=\"author-card__bio\">{html.escape(author.bio)}</p>\n"
        "          </div>\n"
        "        </section>"
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


def render_portada(post: Post) -> str:
    return HERO_TEMPLATE.format(
        image=html.escape(normalize_index_image(post.featured_image)),
        alt=html.escape(post.featured_image_alt),
        title=html.escape(post.title),
        summary=html.escape(post.summary),
        slug=html.escape(post.slug),
    )


def select_related(post: Post, candidates: list[Post], limit: int = 3) -> list[Post]:
    if not post.tags:
        return []

    base_tags = {normalize_tag(tag) for tag in post.tags if tag.strip()}
    if not base_tags:
        return []

    scored: list[tuple[int, dt.datetime, Post]] = []
    for candidate in candidates:
        if candidate.slug == post.slug:
            continue
        candidate_tags = {normalize_tag(tag) for tag in candidate.tags if tag.strip()}
        overlap = base_tags & candidate_tags
        if not overlap:
            continue
        scored.append((len(overlap), candidate.datetime, candidate))

    scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
    return [candidate for _, _, candidate in scored[:limit]]


def update_index(stream_html: str, portada_html: str | None = None) -> None:
    content = INDEX_PATH.read_text(encoding="utf-8")
    start_marker = "<!-- posts:begin -->"
    end_marker = "<!-- posts:end -->"
    portada_start = "<!-- portada:begin -->"
    portada_end = "<!-- portada:end -->"

    if start_marker not in content or end_marker not in content:
        raise RuntimeError("Missing stream markers in index.html")

    before, rest = content.split(start_marker, 1)
    _, after = rest.split(end_marker, 1)

    updated = f"{before}{start_marker}\n{stream_html}\n        {end_marker}{after}"

    if portada_html is not None:
        if portada_start not in updated or portada_end not in updated:
            raise RuntimeError("Missing portada markers in index.html")
        before_portada, rest_portada = updated.split(portada_start, 1)
        _, after_portada = rest_portada.split(portada_end, 1)
        updated = f"{before_portada}{portada_start}\n{portada_html}\n        {portada_end}{after_portada}"

    INDEX_PATH.write_text(updated, encoding="utf-8")


def main() -> None:
    authors = load_authors()
    posts = [parse_post(path) for path in POSTS_DIR.glob("*.txt")]
    posts_sorted = sorted(posts, key=lambda post: post.datetime, reverse=True)

    published = [post for post in posts_sorted if post.status.lower() == "published"]

    for post in posts:
        related_posts = select_related(post, published)
        author = authors.get(post.author)
        html_output = render_post(post, related_posts, author)
        output_path = POSTS_DIR / f"{post.slug}.html"
        output_path.write_text(html_output, encoding="utf-8")
        if post.status.lower() == "published" and post.source_path.exists():
            post.source_path.unlink()

    stream_html = render_stream(published)
    portada_html = render_portada(published[0]) if published else None
    update_index(stream_html, portada_html)


if __name__ == "__main__":
    main()
