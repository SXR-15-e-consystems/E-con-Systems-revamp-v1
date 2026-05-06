import nh3

_ALLOWED_TAGS = {
    "a", "abbr", "b", "blockquote", "br", "code", "em", "h1", "h2", "h3",
    "h4", "h5", "h6", "i", "img", "li", "ol", "p", "pre", "s", "span",
    "strong", "table", "tbody", "td", "th", "thead", "tr", "ul",
}

_ALLOWED_ATTRS: dict[str, set[str]] = {
    "a": {"href", "title", "target"},
    "img": {"src", "alt", "width", "height"},
    "td": {"colspan", "rowspan"},
    "th": {"colspan", "rowspan"},
    "*": {"class"},
}


def sanitize_html(html: str) -> str:
    """Sanitize HTML using nh3 (Rust-backed ammonia library). Safe against XSS bypass."""
    return nh3.clean(
        html,
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRS,
        url_schemes={"http", "https", "mailto"},
        link_rel=None,
    )
