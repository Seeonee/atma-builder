jQuery(document).ready(function ($) {


    // Manages the stored image root directory.
    class ArtRootManager {
        constructor() {
            this.root = undefined;
            this.set(window.localStorage.getItem('root'));
        }

        set(root) {
            root = root == 'null' ? null : root;
            window.localStorage.setItem('root', root);
            this.root = root;
            // Make sure we have a trailing slash.
            if (this.root) {
                this.root = this.root + (this.root.slice(-1) == '/' ? '' : '/');
            }
        }

        get() {
            return this.root;
        }

        clear() {
            window.localStorage.removeItem('root');
            this.root = undefined;
        }
    }

    artManager = new ArtRootManager();



 
});
