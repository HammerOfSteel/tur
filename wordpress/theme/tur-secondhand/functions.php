<?php
add_action(
    'after_setup_theme',
    static function (): void {
        add_theme_support('woocommerce');
    }
);

add_action(
    'wp_enqueue_scripts',
    static function (): void {
        wp_enqueue_style(
            'tur-secondhand-style',
            get_stylesheet_uri(),
            [],
            wp_get_theme()->get('Version')
        );

        wp_enqueue_style(
            'tur-secondhand-variant',
            get_stylesheet_directory_uri() . '/variant.css',
            ['tur-secondhand-style'],
            null
        );
    }
);
