<?php
/**
 * Title: Product Card
 * Slug: tur-secondhand/product-card
 * Categories: woocommerce
 * Description: Insertable Shop archive reference pattern; use it in the Site Editor as a visual starting point rather than a required product-loop layout.
 */
?>
<!-- wp:group {"tagName":"article","backgroundColor":"surface","textColor":"ink","className":"tur-secondhand-product-card","style":{"spacing":{"padding":{"top":"var:preset|spacing|4","bottom":"var:preset|spacing|4","left":"var:preset|spacing|4","right":"var:preset|spacing|4"},"blockGap":"var:preset|spacing|3"},"border":{"color":"var:preset|color|border","radius":"var(--wp--custom--radius-lg)"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group tur-secondhand-product-card has-surface-background-color has-ink-color has-background has-text-color has-border-color" style="border-color:var(--wp--preset--color--border);border-radius:var(--wp--custom--radius-lg);padding-top:var(--wp--preset--spacing--4);padding-right:var(--wp--preset--spacing--4);padding-bottom:var(--wp--preset--spacing--4);padding-left:var(--wp--preset--spacing--4)">
	<!-- wp:woocommerce/product-image {"isDescendentOfQueryLoop":true} /-->

	<!-- wp:paragraph {"className":"badge","backgroundColor":"accent","textColor":"on-primary","style":{"border":{"radius":"999rem"},"spacing":{"padding":{"top":"var:preset|spacing|1","bottom":"var:preset|spacing|1","left":"var:preset|spacing|3","right":"var:preset|spacing|3"}},"typography":{"fontSize":"var:preset|font-size|small","fontStyle":"normal","fontWeight":"700"}}} -->
	<p class="badge has-on-primary-color has-accent-background-color has-text-color has-background" style="border-radius:999rem;padding-top:var(--wp--preset--spacing--1);padding-right:var(--wp--preset--spacing--3);padding-bottom:var(--wp--preset--spacing--1);padding-left:var(--wp--preset--spacing--3);font-size:var(--wp--preset--font-size--small);font-style:normal;font-weight:700">Begagnad</p>
	<!-- /wp:paragraph -->

	<!-- wp:woocommerce/product-title {"level":3,"isLink":true,"isDescendentOfQueryLoop":true,"style":{"typography":{"fontSize":"var:preset|font-size|x-large"}}} /-->
	<!-- wp:woocommerce/product-price {"isDescendentOfQueryLoop":true} /-->

	<!-- wp:paragraph {"textColor":"text-muted"} -->
	<p class="has-text-muted-color has-text-color">Varsamt utvald second hand för nya turer.</p>
	<!-- /wp:paragraph -->

	<!-- wp:woocommerce/product-button {"isDescendentOfQueryLoop":true} /-->
</div>
<!-- /wp:group -->
