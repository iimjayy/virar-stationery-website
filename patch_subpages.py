import re
from pathlib import Path

# Paths to the 7 sub-pages
pages = [
    Path('pages/pricing.html'),
    Path('services/binding.html'),
    Path('services/lamination.html'),
    Path('services/passport-photos.html'),
    Path('services/printing.html'),
    Path('services/thesis-printing.html'),
    Path('services/xerox.html')
]

info_bar_html = """
  <!-- Shop Info Bar -->
  <div class="shop-info-bar" aria-label="Shop contact information">
    <div class="container-fluid px-3 px-xl-4 d-flex justify-content-between align-items-center">
      <div class="info-items-left d-none d-sm-flex">
        <span class="info-item"><i class="fa-solid fa-location-dot"></i> Virar West, Maharashtra</span>
        <span class="info-item"><i class="fa-solid fa-clock"></i> Open: 8:00 AM - 9:00 PM</span>
      </div>
      <div class="info-items-right w-100 w-sm-auto text-center text-sm-end">
        <a href="tel:+919702073424" class="info-phone-link"><i class="fa-solid fa-phone"></i> +91 97020 73424</a>
      </div>
    </div>
  </div>
"""

floating_actions_html = """
  <!-- Floating Actions (Sticky WhatsApp) -->
  <div class="floating-actions" aria-label="Floating action buttons">
    <a
      id="stickyWhatsAppBtn"
      class="sticky-whatsapp-btn is-visible"
      href="https://wa.me/917021072757?text=Hi!%20I%20want%20to%20place%20a%20print%20order.%20Please%20share%20details."
      aria-label="Chat with us on WhatsApp"
      target="_blank"
      rel="noopener noreferrer">
      <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
      <span class="sticky-whatsapp-tooltip">Chat with us</span>
    </a>
  </div>
"""

for page in pages:
    if not page.exists():
        continue
    
    html = page.read_text()
    changed = False
    
    # Insert info bar before <header class="sp-header">
    if 'class="shop-info-bar"' not in html:
        html = re.sub(
            r'(<header class="sp-header">)',
            info_bar_html + r'\n  \1',
            html
        )
        changed = True
        
    # Insert floating actions before </body>
    if 'id="stickyWhatsAppBtn"' not in html:
        html = re.sub(
            r'(</body>)',
            floating_actions_html + r'\n\1',
            html
        )
        changed = True
        
    if changed:
        page.write_text(html)
        print(f"Updated {page}")
    else:
        print(f"Already updated {page}")

