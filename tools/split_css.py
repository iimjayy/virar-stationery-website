#!/usr/bin/env python3
"""
split_css.py — Virar Stationery CSS Modularisation
Reads assets/css/style.css and splits it into 25 module files.
Strategy: pattern-based classification of each CSS rule block.
"""

import re, os, sys
from pathlib import Path

BASE = Path(__file__).parent.parent / "assets" / "css"
SOURCE = BASE / "style.css"

# ── Output file paths ──────────────────────────────────────────────────────
MODULES = {
    "variables":         BASE / "base/variables.css",
    "reset":             BASE / "base/reset.css",
    "typography":        BASE / "base/typography.css",
    "animations":        BASE / "base/animations.css",
    "header":            BASE / "layout/header.css",
    "footer":            BASE / "layout/footer.css",
    "sections":          BASE / "layout/sections.css",
    "buttons":           BASE / "components/buttons.css",
    "forms":             BASE / "components/forms.css",
    "badges":            BASE / "components/badges.css",
    "cards":             BASE / "components/cards.css",
    "modals":            BASE / "components/modals.css",
    "hero":              BASE / "features/hero.css",
    "services":          BASE / "features/services.css",
    "gallery":           BASE / "features/gallery.css",
    "contact":           BASE / "features/contact.css",
    "products":          BASE / "features/products.css",
    "testimonials":      BASE / "features/testimonials.css",
    "why-choose":        BASE / "features/why-choose.css",
    "quote-calculator":  BASE / "features/quote-calculator.css",
    "bulk-order":        BASE / "features/bulk-order.css",
    "order-status":      BASE / "features/order-status.css",
    "trust-counters":    BASE / "utilities/trust-counters.css",
    "interactive":       BASE / "utilities/interactive.css",
    "responsive-mobile": BASE / "utilities/responsive-mobile.css",
    "dark":              BASE / "themes/dark.css",
}

# ── Classification rules (selector patterns → module) ─────────────────────
# Each entry: (regex_pattern, module_key)
# First match wins. Order matters.
SELECTOR_RULES = [
    # Dark mode — must come first (overrides any other category)
    (r'\[data-theme=["\']dark["\']', "dark"),
    (r'html\[data-theme=["\']dark["\']', "dark"),

    # Variables
    (r'^:root\s*\{', "variables"),

    # Animations (keyframes go to animations)
    (r'^@keyframes\s+', "animations"),

    # Responsive (media queries)
    (r'^@media\s+', "responsive-mobile"),

    # Header / Nav
    (r'\.(site-header|top-header|nav-strip|navbar|brand-mark|brand-logo|brand-text|brand-name|brand-tagline|brand-logo-wrap|search-box|search-mobile-row|search-input|search-icon|search-button|search-target|smart-search|smart-suggestion|smart-item|smart-see-all|mobile-menu-btn|action-btn|header-actions|lang-toggle|theme-toggle|desktop-toggler)\b', "header"),
    (r'\.nav-(link|item|strip)\b', "header"),

    # Footer
    (r'\.(site-footer|footer-|footer-logo|footer-bottom|footer-links)\b', "footer"),
    (r'\.footer-', "footer"),

    # Hero
    (r'\.(hero-|hero_)\b', "hero"),

    # Gallery
    (r'\.(gallery-|lightbox|image-modal|photo-grid|photo-)\b', "gallery"),

    # Services
    (r'\.(service-card|service-panel|services-section|service-badge|service-icon|service-link)\b', "services"),

    # Contact
    (r'\.(contact-|map-frame|enquiry-|toast-)\b', "contact"),

    # Products / Stationery
    (r'\.(product-card|product-body|stationery-|product-badge)\b', "products"),

    # Testimonials
    (r'\.(testimonial-)\b', "testimonials"),

    # Why Choose
    (r'\.(why-choose|feature-card)\b', "why-choose"),

    # Quote Calculator
    (r'\.(quote-|pdf-drop|pdf-preview|quotePdf)\b', "quote-calculator"),
    (r'#quote', "quote-calculator"),

    # Bulk Order / Business Enquiry
    (r'\.(bulk-|business-|file-drop|file-upload)\b', "bulk-order"),
    (r'#bulkEnquiry', "bulk-order"),

    # Order Status
    (r'\.(order-status|order-step|order-result|order-track)\b', "order-status"),

    # Trust Counters
    (r'\.(trust-counter|counter-|counter-value)\b', "trust-counters"),

    # Interactive / Floating elements
    (r'\.(chat-|sticky-wa|scroll-progress|back-to-top|skip-link|ripple|typing-|quick-convert|wa-float|fab-|mobile-bottom-bar|scroll-to-top|social-ticker)\b', "interactive"),

    # Buttons
    (r'\.(btn-|cta-btn|wa-btn|call-btn|dir-btn|enquire-btn)\b', "buttons"),
    (r'\.btn\b', "buttons"),

    # Forms
    (r'\.(form-control|form-select|form-label|form-group|form-check|form-field|input-group)\b', "forms"),
    (r'^input|^select|^textarea', "forms"),

    # Badges
    (r'\.(section-kicker|badge-|popular-badge|trust-pill|eyebrow|open-badge)\b', "badges"),

    # Cards (generic card base)
    (r'\.(card\b|card-body|card-title|card-footer|card-header|reveal-child)\b', "cards"),

    # Modals
    (r'\.(modal-|lightbox-|overlay-)\b', "modals"),

    # Sections (structural)
    (r'\.(section-pad|section-heading|section-alt|quick-convert-bar|scroll-progress)\b', "sections"),
    (r'^section\[', "sections"),

    # Typography / Reset
    (r'^(html|body|a|img|\*)\s*[\{,]', "reset"),
    (r'\.(section-kicker|eyebrow)\b', "badges"),
    (r'^(h[1-6]|p|ul|ol|li|strong|em)\s*[\{,]', "typography"),
]

def classify_selector(selector_block_header: str) -> str:
    """Return the module key for a given CSS selector string."""
    s = selector_block_header.strip()
    for pattern, module in SELECTOR_RULES:
        if re.search(pattern, s):
            return module
    return "sections"  # fallback

def parse_css_blocks(css_text: str):
    """
    Parse a CSS file into a list of (raw_text, module_key) tuples.
    Handles: rules, @keyframes, @media, :root, comments.
    """
    blocks = []
    i = 0
    n = len(css_text)
    current_comment = []

    while i < n:
        # Skip whitespace between blocks
        if css_text[i:i+2] == '/*':
            # Read comment
            end = css_text.find('*/', i)
            if end == -1:
                end = n - 2
            comment = css_text[i:end+2]
            i = end + 2
            current_comment.append(comment)
            continue

        # Whitespace
        if css_text[i] in ' \t\r\n':
            if current_comment:
                # flush comment with next block
                pass
            else:
                i += 1
                continue

        # Find the start of a rule/block
        # Read selector (up to first '{')
        # But handle @media/@keyframes which have nested braces

        # Find next '{' or end
        brace_pos = css_text.find('{', i)
        if brace_pos == -1:
            # No more rules
            remainder = css_text[i:]
            if remainder.strip():
                blocks.append((remainder, "sections"))
            break

        selector = css_text[i:brace_pos].strip()

        # Now read the block body, tracking nested braces
        depth = 0
        j = brace_pos
        while j < n:
            if css_text[j] == '{':
                depth += 1
            elif css_text[j] == '}':
                depth -= 1
                if depth == 0:
                    break
            elif css_text[j:j+2] == '/*':
                # Skip comment inside block
                end_c = css_text.find('*/', j)
                if end_c != -1:
                    j = end_c + 1
            j += 1

        block_end = j + 1
        full_block = css_text[i:block_end]

        # Determine module
        # For @media blocks, classify by content not selector
        if selector.startswith('@media'):
            module = "responsive-mobile"
        elif selector.startswith('@keyframes'):
            module = "animations"
        elif '[data-theme=' in selector or 'html[data-theme=' in selector:
            module = "dark"
        else:
            module = classify_selector(selector)

        # Prepend any accumulated comments
        prefix = ""
        if current_comment:
            prefix = "\n".join(current_comment) + "\n"
            current_comment = []

        blocks.append((prefix + full_block, module))
        i = block_end

    return blocks

def main():
    print(f"Reading {SOURCE}...")
    css_text = SOURCE.read_text(encoding="utf-8")

    # Remove the AI context notice comment at top (lines 1-10)
    # Keep it only as a reference, strip from modules
    ai_notice_end = css_text.find('*/\n', 0) + 3
    preamble = css_text[:ai_notice_end]
    css_text = css_text[ai_notice_end:]

    print("Parsing CSS blocks...")
    blocks = parse_css_blocks(css_text)
    print(f"  Found {len(blocks)} blocks")

    # Collect content per module
    module_content = {k: [] for k in MODULES}

    for raw, module_key in blocks:
        if module_key not in module_content:
            module_key = "sections"
        module_content[module_key].append(raw)

    # Write each module file
    for module_key, path in MODULES.items():
        content = module_content[module_key]
        header = f"/* {'='*68}\n   {path.name.upper()} — Virar Stationery\n   Auto-extracted from style.css\n   {'='*68} */\n\n"
        body = "\n\n".join(c.strip() for c in content if c.strip())
        path.write_text(header + body + "\n", encoding="utf-8")
        rule_count = body.count('{')
        print(f"  ✅ {path.name} — {rule_count} rule blocks, {len(body)} bytes")

    # Write empty style.css with redirect comment
    SOURCE.write_text(
        "/* migrated — see assets/css/main.css */\n"
        "/* This file is intentionally empty. All styles are in assets/css/main.css */\n",
        encoding="utf-8"
    )
    print("\n✅ style.css cleared")
    print("✅ All 25 modules written")
    print("\nVerification checks:")

    # Spot checks
    checks = [
        ("dark.css", "themes/dark.css", "[data-theme"),
        ("header.css", "layout/header.css", "site-header"),
        ("hero.css", "features/hero.css", "hero-"),
        ("variables.css", "base/variables.css", ":root"),
        ("animations.css", "base/animations.css", "@keyframes"),
        ("responsive-mobile.css", "utilities/responsive-mobile.css", "@media"),
    ]
    for label, rel_path, check_str in checks:
        full_path = BASE / rel_path
        if full_path.exists():
            content = full_path.read_text()
            found = check_str in content
            print(f"  {'✅' if found else '❌'} {label}: '{check_str}' {'found' if found else 'MISSING'}")
        else:
            print(f"  ❌ {label}: file not found")

if __name__ == "__main__":
    main()
