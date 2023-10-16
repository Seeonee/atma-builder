jQuery(document).ready(function ($) {


    clean = function(s) {
        return s.trim().toLowerCase().replace(/[^a-z ]/g, '').replace(/ +/g, '-');
    }


    var unloader = function(e) {
        return ''; // Returning anything prompts an "Are you sure?"
    }


    // Manages the locally loaded content.
    class ContentManager {
        constructor() {
            this.db = dbManager; // By default, use Google Sheet as database.
            this.outstanding = 0;
            this.clear();
        }

        // Reset our cached content.
        clear() {
            this.lookedUp = false;
            this.stores = {
                'set': {}, 
                'char': {}, 
                'campaign': {}
            };
            this.standalone = null;
            this.changes = false;
        }

        // Public method for initializing a new (empty) creation.
        create(type, name, counts, receiver=console.log) {
            this.db.create(type, name, counts, (status, data) => {
                if (status == 'success') {
                    var creation = {};
                    for (var k in counts) {
                        for (var i = 0; i < counts[k]; i++) {
                            creation[k + '_' + i] = {};
                        }
                    }
                    this.stores[type][name] = creation;
                }
                receiver(status, data);
            });
        }

        // Public method for deleting a creation.
        delete(type, name, receiver=console.log) {
            this.db.delete(type, name, (status, data) => {
                if (status == 'success') {
                    delete this.stores[type][name];
                }
                receiver(status, data);
            });
        }

        // Public method for listing sets/characters.
        // Receiver is passed a status code and a list of entity names of the requested type.
        // If we haven't performed a lookup, it does so.
        // If the lookup fails, clear flag so we can try again later.
        list(type, receiver=console.log) {
            if (this.lookedUp) {
                this._list(type, receiver);
            } else {
                this.db.list((status, data) => {
                    if (status == 'success') {
                        data.forEach(function(value) {
                            this.stores[value.type][value.name] = undefined;
                        }, this);
                        this.lookedUp = true;
                        this._list(type, receiver);
                    } else {
                        receiver(status, data);
                    }
                });
            }
        }

        // Internal method for retrieving a list of typed entities.
        _list(type, receiver=console.log) {
            var store = this.stores[type];
            if (store) {
                receiver('success', Object.keys(store));
            } else {
                receiver('error', 'Invalid type');
            }
        }

        query(type, name, receiver=console.log) {
            var store = this.stores[type];
            if (store) {
                if (name in store) {
                    var entity = store[name];
                    if (entity == undefined) {
                        this.db.query(type, name, (status, data) => {
                            if (status == 'success') {
                                data.forEach((card) => {
                                    card['_changed'] = false;
                                    ['front', 'back'].forEach((k) => {
                                        var key = '{0}-extra'.format(k);
                                        card[key] = key in card ? JSON.parse(card[key]) : {};
                                    });
                                });
                                store[name] = data;
                            }
                            receiver(status, data);
                        });
                    } else {
                        receiver('success', entity);
                    }
                } else {
                    receiver('error', name + ' not found');
                }
            } else {
                receiver('error', 'Invalid type');
            }
        }

        _changed(title=undefined) {
            // Ignore changes to standalones.
            var params = new URLSearchParams(window.location.search);
            if (params.get('name') == null) {
                return;
            }

            // Notifies us that at least some of our data is now changed.
            // For now, just set the page as having unsaved changes.
            title = 'Card Builder: {0}'.format(title) || document.title.match(/[^*].*$/);
            document.title = '*' + title;
            this.changes = true;
            $(window).on('beforeunload', unloader);
            // TODO: Walk the contents to discover what.
            // TODO: How often do we send updates back to the sheet?
        }

        _save() {
            if (!this.changes) {
                return;
            }

            $('<div class="saving">Saving...</div>').appendTo('body').fadeIn(500);

            this.changes = false;
            for (var type in this.stores) {
                var store = this.stores[type];
                for (var name in store) {
                    var cards = store[name];
                    if (cards == undefined) {
                        continue;
                    }
                    var items = {};
                    cards.forEach((card) => {
                        if (card['_changed']) {
                            card['_changed'] = false;
                            var item = {};
                            for (var k in card) {
                                if (k != '_changed' && k != 'type') {
                                    item[k] = card[k];
                                }
                            }
                            ['front', 'back'].forEach((side) => {
                                var k = '{0}-extra'.format(side);
                                if (k in item) {
                                    item[k] = JSON.stringify(item[k]);
                                }
                            });
                            items[card.type] = item;
                        }
                    });
                    this.outstanding += 1;
                    this.db.update(type, name, items, (status, data) => {
                        this.outstanding -= 1;
                        if (this.outstanding == 0) {
                            document.title = document.title.match(/[^*].*$/);
                            $(window).off('beforeunload', unloader);
                            $('.saving').fadeOut(500, () => $('.saving').remove());
                        }
                        if (status == 'error') {
                            alert('The most recent save failed!');
                        }
                    });
                }
            }
        }

    }

    contentManager = new ContentManager();
    if (!dbManager.get()) {
        contentManager.db = localDatabase;
    }

 
});
