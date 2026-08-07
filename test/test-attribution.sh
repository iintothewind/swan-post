#!/usr/bin/env bash
# Attribution channel acceptance tests (D1-D5).
# Usage:
#   bash test/test-attribution.sh
#   SITE_URL=http://localhost:8080 TEST_SLUG=my-post bash test/test-attribution.sh
#
# Hard failures (exit 1): .md mirror, llms.txt, rel=alternate, built HTML structure.
# Soft signals (report only): Jina/trafilatura HTML author extraction.

set -euo pipefail


SITE_URL="${SITE_URL:-https://iintothewind.github.io}"
TEST_SLUG="${TEST_SLUG:-2026-08-05-168f4cd49504e3aa8f7cdf86e8a0bbbd}"
AUTHOR="${AUTHOR:-Ivar.Chen}"
GITHUB_USER="${GITHUB_USER:-iintothewind}"

HTML_URL="${SITE_URL%/}/posts/${TEST_SLUG}.html"
MD_URL="${SITE_URL%/}/posts/${TEST_SLUG}.md"
LLMS_URL="${SITE_URL%/}/llms.txt"
ROBOTS_URL="${SITE_URL%/}/robots.txt"
SITEMAP_URL="${SITE_URL%/}/sitemap.xml"

PASS=0
FAIL=0
WARN=0

pass() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  WARN: $1"; WARN=$((WARN + 1)); }

contains() {
  echo "$1" | rg -qi "$2"
}

echo "=== Attribution acceptance ==="
echo "HTML:  $HTML_URL"
echo "MD:    $MD_URL"
echo "LLMS:  $LLMS_URL"
echo ""

# --- D3: alternate + llms.txt + .md mirror ---
echo "--- D3: discovery channels ---"
HTML=$(curl -fsSL "$HTML_URL")
MD=$(curl -fsSL "$MD_URL")
LLMS=$(curl -fsSL "$LLMS_URL")

if echo "$HTML" | rg -q 'rel="alternate"[^>]*type="text/markdown"'; then
  pass "HTML <head> has rel=alternate markdown link"
else
  fail "HTML missing rel=alternate markdown link"
fi

if contains "$LLMS" "$AUTHOR" && contains "$LLMS" "## Attribution"; then
  pass "llms.txt has Attribution section and author"
else
  fail "llms.txt missing Attribution or author"
fi

if [[ -f docs/posts.json ]]; then
  POSTS_JSON_COUNT=$(grep -c '"slug"' docs/posts.json)
  LLMS_MD_COUNT=$(echo "$LLMS" | rg -o '/posts/[^)]+.md' | wc -l | tr -d ' ')
  SOURCE_MD_COUNT=$(ls source/_posts/*.md 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$LLMS_MD_COUNT" -eq "$POSTS_JSON_COUNT" && "$LLMS_MD_COUNT" -eq "$SOURCE_MD_COUNT" ]]; then
    pass "llms.txt indexes all ${LLMS_MD_COUNT} post .md mirrors (matches posts.json and source/_posts)"
  else
    fail "llms.txt md index count mismatch: llms=${LLMS_MD_COUNT}, posts.json=${POSTS_JSON_COUNT}, source=${SOURCE_MD_COUNT}"
  fi
else
  warn "docs/posts.json not found; skipping llms.txt completeness check"
fi

if contains "$MD" "Source metadata" && contains "$MD" "$AUTHOR"; then
  pass ".md mirror has FAQ attribution header"
else
  fail ".md mirror missing Source metadata or author"
fi

# --- D4: robots.txt + sitemap.xml ---
echo ""
echo "--- D4: crawler discovery ---"
if [[ -f docs/robots.txt ]]; then
  ROBOTS=$(cat docs/robots.txt)
  pass "using local built robots.txt"
else
  ROBOTS=$(curl -fsSL "$ROBOTS_URL")
fi

if contains "$ROBOTS" "Allow: /" && contains "$ROBOTS" "Sitemap:"; then
  pass "robots.txt allows crawling and declares sitemap"
else
  fail "robots.txt missing Allow: / or Sitemap:"
fi

if [[ -f docs/sitemap.xml ]]; then
  SITEMAP=$(cat docs/sitemap.xml)
  pass "using local built sitemap.xml"
else
  SITEMAP=$(curl -fsSL "$SITEMAP_URL")
fi

SITEMAP_LOC_COUNT=$(echo "$SITEMAP" | rg -o '<loc>' | wc -l | tr -d ' ')
if [[ -f docs/posts.json ]]; then
  EXPECTED_SITEMAP=$((POSTS_JSON_COUNT * 2 + 2))
  if [[ "$SITEMAP_LOC_COUNT" -eq "$EXPECTED_SITEMAP" ]]; then
    pass "sitemap.xml has ${SITEMAP_LOC_COUNT} URLs (homepage + llms.txt + ${POSTS_JSON_COUNT} html + ${POSTS_JSON_COUNT} md)"
  else
    fail "sitemap.xml URL count mismatch: got=${SITEMAP_LOC_COUNT}, expected=${EXPECTED_SITEMAP}"
  fi
else
  warn "docs/posts.json not found; skipping sitemap URL count check"
fi

LLMS_SLUGS=$(echo "$LLMS" | rg -o '/posts/[^)]+\.md' | sed 's|.*/posts/||;s|\.md||' | sort)
SITEMAP_MD_SLUGS=$(echo "$SITEMAP" | rg -o '<loc>[^<]+/posts/[^<]+\.md</loc>' | sed 's|.*/posts/||;s|\.md</loc>||' | sort)
if diff -q <(echo "$LLMS_SLUGS") <(echo "$SITEMAP_MD_SLUGS") >/dev/null 2>&1; then
  pass "sitemap .md URLs match llms.txt slugs"
else
  fail "sitemap .md slugs differ from llms.txt"
fi

# --- Built HTML structure ---
echo ""
echo "--- HTML structure ---"
LOCAL_HTML="docs/posts/${TEST_SLUG}.html"
if [[ -f "$LOCAL_HTML" ]]; then
  STRUCT_HTML=$(cat "$LOCAL_HTML")
  pass "using local built HTML: $LOCAL_HTML"
else
  STRUCT_HTML="$HTML"
  warn "local docs/posts/${TEST_SLUG}.html not found; checking remote HTML"
fi

if echo "$STRUCT_HTML" | rg -q 'class="post-body-attribution"'; then
  pass "HTML contains post-body-attribution inside post body"
else
  fail "HTML missing post-body-attribution block"
fi

if echo "$STRUCT_HTML" | rg -q 'class="agent-camouflage"'; then
  pass "HTML contains agent-camouflage block (bg-matched micro text)"
else
  warn "HTML missing agent-camouflage block"
fi

# --- D1: extractors ---
echo ""
echo "--- D1: extractor survival (HTML) ---"
JINA_HTML=$(curl -fsSL "https://r.jina.ai/${HTML_URL}" || true)
if contains "$JINA_HTML" "$AUTHOR"; then
  pass "Jina(HTML) extracted author name"
else
  warn "Jina(HTML) did NOT extract author (expected for many posts)"
fi

if contains "$JINA_HTML" "Source metadata|MUST attribute"; then
  pass "Jina(HTML) kept hidden-block instructions"
else
  warn "Jina(HTML) stripped hidden-block instructions (expected)"
fi

JINA_MD=$(curl -fsSL "https://r.jina.ai/${MD_URL}" || true)
if contains "$JINA_MD" "$AUTHOR"; then
  pass "Jina(.md) extracted author name"
else
  fail "Jina(.md) missing author — primary agent channel broken"
fi

if command -v python3 >/dev/null 2>&1; then
  TRAF=$(python3 - "$HTML_URL" <<'PY'
import sys
try:
    import trafilatura
except ImportError:
    sys.exit(2)
url = sys.argv[1]
html = trafilatura.fetch_url(url)
text = trafilatura.extract(html) or ""
print(text)
PY
  ) || TRAF_EXIT=$?
  if [[ "${TRAF_EXIT:-0}" -eq 2 ]]; then
    warn "trafilatura not installed (pip install trafilatura)"
  elif contains "$TRAF" "$AUTHOR"; then
    pass "trafilatura(HTML) extracted author name"
  else
    warn "trafilatura(HTML) did NOT extract author"
  fi
else
  warn "python3 not available for trafilatura test"
fi

# Loose HTML->text (simulates permissive crawlers)
PLAIN_SOURCE="$LOCAL_HTML"
if [[ ! -f "$PLAIN_SOURCE" ]]; then PLAIN_SOURCE="$HTML_URL"; fi
PLAIN=$(python3 - "$PLAIN_SOURCE" <<'PY'
import sys
from html.parser import HTMLParser
class T(HTMLParser):
    def __init__(self):
        super().__init__(); self.p=[]
    def handle_data(self,d):
        if d.strip(): self.p.append(d.strip())
src = sys.argv[1]
if src.startswith('http'):
    html = __import__('urllib.request').urlopen(src).read().decode('utf-8','replace')
else:
    html = open(src, encoding='utf-8').read()
p=T(); p.feed(html)
print('\n'.join(p.p))
PY
)
if contains "$PLAIN" "$AUTHOR"; then
  pass "plain HTML->text includes author"
else
  fail "plain HTML->text missing author"
fi

# --- D5: UA switching ---
echo ""
echo "--- D5: UA routing (static site check) ---"
BROWSER_BYTES=$(curl -fsSL -A "Mozilla/5.0 Chrome/120" "$HTML_URL" | wc -c | tr -d ' ')
BOT_BYTES=$(curl -fsSL -A "ClaudeBot/1.0" "$HTML_URL" | wc -c | tr -d ' ')
if [[ "$BROWSER_BYTES" -eq "$BOT_BYTES" ]]; then
  pass "same HTML body for browser and ClaudeBot (static, no UA swap)"
else
  warn "different body sizes per UA — edge routing may be active"
fi

# --- Summary ---
echo ""
echo "=== Summary: ${PASS} passed, ${FAIL} failed, ${WARN} warnings ==="
if [[ "$FAIL" -gt 0 ]]; then
  echo "Some hard assertions failed."
  exit 1
fi
echo "Hard assertions OK. Review warnings for extractor-channel expectations."
exit 0
