# Kontakt page: map approach decision

**Decision:** Use a static map image (not a live Google Maps iframe embed) on the Kontakt page,
for all four demos.

**Rationale:** The pitch demo needs to run reliably offline/locally when shown in person at the
shop, and a static image avoids depending on external network access, Google Maps API keys, or
cookie-consent banners during the walkthrough — a live embed can be swapped in later if the shop
adopts the design and hosts it with normal internet access.
