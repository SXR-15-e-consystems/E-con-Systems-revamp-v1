import re


def sanitize_html(html: str) -> str:
    html = re.sub(r"<script[\\s\\S]*?</script>", "", html, flags=re.IGNORECASE)
    html = re.sub(r"<style[\\s\\S]*?</style>", "", html, flags=re.IGNORECASE)
    html = re.sub(r"\\s+on\\w+\\s*=\\s*[\"\'][^\"\']*[\"\']", "", html, flags=re.IGNORECASE)
    html = re.sub(r"\\s+on\\w+\\s*=\\s*\\S+", "", html, flags=re.IGNORECASE)
    html = re.sub(
        r"href\\s*=\\s*[\"\']javascript:[^\"\']*[\"\']",
        'href="#"',
        html,
        flags=re.IGNORECASE,
    )
    html = re.sub(
        r"src\\s*=\\s*[\"\']javascript:[^\"\']*[\"\']",
        'src=""',
        html,
        flags=re.IGNORECASE,
    )
    return html
