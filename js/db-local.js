jQuery(document).ready(function ($) {

    // Constants.
    const DB_KEY = 'json-db';
    const STATUS = {SUCCESS: 'success', ERROR: 'error'};
    const HEADERS = [
        'front-title', 'front-subtitle', 'front-text', 'front-extra', 'front-image', 'front-comment', 
        'back-title', 'back-subtitle', 'back-text', 'back-extra', 'back-image', 'back-comment', 
    ];

    const ENTITY_TYPES = ['set', 'char', 'campaign'];
    const CARD_TYPES = ['backdrop', 'story', 'scene', 'extra', 'star', 'prop', 'twist', 'character', 'move', 'super', 'journey'];


    // Helpers.
    const removeEmpty = o => Object.fromEntries(Object.entries(o).filter(([_, v]) => v != ''));


    // Manages content saved to local storage.
    class LocalDatabaseManager {
        constructor() {
            this.data = JSON.parse(window.localStorage.getItem(DB_KEY) || '{"index": []}');
        }

        save() {
            window.localStorage.setItem(DB_KEY, JSON.stringify(this.data));
        }

        clear() {
            window.localStorage.removeItem(DB_KEY);
        }

        success(callback, data) {
            setTimeout(() => callback(STATUS.SUCCESS, data), 10);
        }

        error(callback, data) {
            setTimeout(() => callback(STATUS.ERROR, data), 10);
        }

        // List available sets/characters.
        // callback: will be passed the response object
        list(callback) {
            this.success(callback, [...this.data.index]); // Return a copy.
        }

        // Create a new set/character.
        // type: 'set' or 'char'
        // name: the name of the entity to look up
        // counts: map of card types to integer quantities, e.g. {'twist': 12}
        // callback: will be passed the response object
        create(type, name, counts, callback) {
            if (!ENTITY_TYPES.includes(type)) {
                this.error(callback, `Unsupported query type: ${type}`);
                return;
            }
            let id = `${type}-${clean(name)}`;
            let cards = this.data[id];
            if (cards != undefined) {
                this.error(callback, `Entity already exists: ${name}`);
                return;
            }
            this.data.index.push({type: type, name: name});
            cards = [];
            this.data[id] = cards;
            for (let type2 of CARD_TYPES) {
                if (type2 in counts) {
                    for (let j = 0; j < counts[type2]; j++) {
                        cards.push({type: `${type2}-${j}`});
                    }
                }
            }
            this.save();
            this.success(callback, [id]);
        }

        // Delete a set/character.
        // type: 'set' or 'char'
        // name: the name of the entity to look up
        // callback: will be passed the response object
        delete(type, name, callback) {
            if (!ENTITY_TYPES.includes(type)) {
                this.error(callback, `Unsupported query type: ${type}`);
                return;
            }
            let clean_name = clean(name);
            for (let i = 0; i < this.data.index.length; i++) {
                let entity = this.data.index[i];
                if (entity.type == type && clean(entity.name) == clean_name) {
                    this.data.index.splice(i, 1);
                    break;
                }
            }
            let id = `${type}-${clean_name}`;
            if (this.data[id] != undefined) {
                delete this.data[id];
            }
            this.save();
            this.success(callback, [id]);
        }

        // Query the data for a specific set/character.
        // type: 'set' or 'char'
        // name: the name of the entity to look up
        // callback: will be passed the response object
        query(type, name, callback) {
            if (!ENTITY_TYPES.includes(type)) {
                this.error(callback, `Unsupported query type: ${type}`);
                return;
            }
            let id = `${type}-${clean(name)}`;
            let cards = this.data[id];
            if (cards == undefined) {
                this.error(callback, `Entity does not exist: ${type} ${name}`);
                return;
            }
            this.success(callback, JSON.parse(JSON.stringify(cards)));
        }

        // Update the data for a specific set/character.
        // type: 'set' or 'char'
        // name: the name of the entity to look up
        // items: map of numbered card types (e.g. 'twist-0') to maps of card text classes to string contents, e.g.
        //  {
        //      'character-0': {
        //          'front-title': 'My name is', 
        //          'front-subtitle': 'WHAT?', 
        //          'back-text': 'Catch you on the flip side.'
        //      }, 
        //      'move-2': {
        //          'front-title': 'Fireball', 
        //          'front-text': 'It is a fireball.', 
        //          'front-extra': '+1 fire'
        //      }
        //  }
        // callback: will be passed the response object
        update(type, name, items, callback) {
            if (!ENTITY_TYPES.includes(type)) {
                this.error(callback, `Unsupported query type: ${type}`);
                return;
            }
            let id = `${type}-${clean(name)}`;
            let cards = this.data[id];
            if (cards == undefined) {
                this.error(callback, `Entity does not exist: ${type} ${name}`);
                return;
            }
            for (let card of cards) {
                if (card.type in items) {
                    let item = items[card.type];
                    for (let key of HEADERS) {
                        if (key in item) {
                            if (item[key] != '') {
                                card[key] = item[key];
                            } else {
                                delete card[key];
                            }
                        }
                    }
                }
            }
            this.save();
            this.success(callback, [id]);
        }

    }


    localDatabase = new LocalDatabaseManager();

 
});
