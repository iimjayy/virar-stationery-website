import re
from pathlib import Path

index_path = Path('index.html')
html = index_path.read_text()

# We need to insert the shop-info-bar at the top of the header.
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

# Insert it before or after <div class="top-header border-bottom"> inside <header>
if 'class="shop-info-bar"' not in html:
    html = re.sub(
        r'(<header class="site-header sticky-top">)',
        r'\1\n' + info_bar_html,
        html
    )
    index_path.write_text(html)
    print("Added shop-info-bar to index.html")
else:
    print("shop-info-bar already in index.html")
