jQuery(document).ready(function ($) {


    var STATS = [
        'tough', 
        'calm', 
        'hasty', 
        'bright', 
        'sly'
    ];
    var STAT_INDICES = {
        'tough': 0, 
        'calm': 1, 
        'hasty': 2, 
        'bright': 3, 
        'sly': 4, 
        'health': 5 
    };
    var TWIST_INDICES = {
        'backfire': 0, 
        'deplete': 1, 
        'foreshadow': 2, 
        'offer': 3, 
        'promote': 4, 
        'reveal': 5, 
        'challenge': 6, 
        'challenge-strength': 7, 
        'challenge-flaw': 8 
    };
    // var NAME_KEY = {
    //     'character-front': 'subtitle', 
    //     'character-back': 'subtitle', 
    //     'move-front': 'subtitle', 
    //     'move-back': 'subtitle', 
    //     'super-front': 'subtitle', 
    //     'super-back': 'subtitle', 
    // };


    // Fills in a card's data.
    class CardPopulater {
        // Public method for populating any card.
        // card: The div where values will be filled in.
        // data: The data loaded for this card.
        _populate(card, data) {
            var id = card.attr('id');
            var [cardType, cardNum] = id.split('-');
            var entityType = card.attr('data-entityType');
            var entityName = card.attr('data-entityName');
            var side = card.hasClass('front') ? 'Front' : 'Back';
            data.forEach((item) => {
                if (item.type == id) {
                    this[cardType + side](card, entityName, item);
                }
            });
        }

        // Public method for determining a card's name.
        _name(card, data) {
            let id = card.attr('id');
            var [cardType, cardNum] = id.split('-');
            let side = card.hasClass('front') ? 'front' : 'back';
            let name;
            data.forEach((item) => {
                if (item.type == id) {
                    name = item['{0}-title'.format(side)];
                }
            });
            if (!name) {
                let entityName = card.attr('data-entityName');
                name = '{0} / {1} ({2})'.format(entityName, id, side);
            }
            return name;
        }

        // Helper methods.

        _listenForContentChanges(content, data, ...dataKeys) {
            content.on('updated', (e) => {
                let value = getTextFieldContentsFancy(content);
                let emptyValue = content.data('empty-value') || '';
                if (value.toLowerCase() == emptyValue.toLowerCase() || value == '?') {
                    value = '';
                }
                this._attemptChange(value, data, ...dataKeys);
            });
        }

        _listenForStatChanges(content, data, ...dataKeys) {
            content.on('updated', (e) => {
                let value = content.text();
                if (content.hasClass('negative')) {
                    value = '-' + value;
                }
                if (value.match(/^-?\d+$/)) {
                    this._attemptChange(value, data, ...dataKeys);
                }
            });
        }

        _attemptChange(value, data, ...dataKeys) {
            let holder = data;
            // Walk all but the last key.
            dataKeys.slice(0, -1).forEach((key) => {
                if (!(key in holder)) {
                    holder[key] = {};
                }
                holder = holder[key];
            });
            // Now use the last key.
            let key = dataKeys.slice(-1)[0];
            let old = holder[key] || '';
            if (value != old) {
                holder[key] = value;
                data['_changed'] = true;

                // Derive the new page title.
                let card = jQuery('.card');
                let side = card.hasClass('front') ? 'front' : 'back';
                let name = card.attr('data-entityName');
                let type = data['type']
                let title = data['{0}-title'.format(side)] || '{0} / {1} ({2})'.format(name, type, side);

                contentManager._changed(title);

                // Also update the menu.
                let grouping = card.hasClass('player') ? 'chars' : 'sets';
                if (card.hasClass('journey')) {
                    grouping = 'campaigns';
                }
                if (name) {
                    name = clean(name);
                    let q = '.menu-main .creations .{0} #{1} .{2} #{3}'.format(grouping, name, side, type);
                    let outer = jQuery(q).parent();
                    title = data['{0}-title'.format(side)];
                    if (!title && side == 'back' && data['front-title']) {
                            title = '{0} (back)'.format(data['front-title']);
                    }
                    if (!title) {
                        title = '{0} ({1})'.format(type, side);
                    }
                    outer.find('.tooltip .text').text(title);
                }
            }
        }

        _walk(data, ...dataKeys) {
            let value = data;
            dataKeys.forEach((key) => {
                value = (value != undefined && key in value) ? value[key] : undefined;
            });
            return value;
        }

        _solidifyContent(card, textField, value) {
            var content = card.find('{0} .content'.format(textField));
            if (value) {
                insertFancyTextIntoContent(value, content); // copy-paste-fixer.js
                content.removeAttr('contenteditable');
            }
        }

        _fillContent(card, data, textField, ...dataKeys) {
            let value = this._walk(data, ...dataKeys);
            var content = card.find('{0} .content'.format(textField)).first();
            if (value) {
                insertFancyTextIntoContent(value, content); // copy-paste-fixer.js
            }
            if (content.attr('contenteditable')) {
                this._listenForContentChanges(content, data, ...dataKeys);
            }
        }

        _fillArt(card, data, ...dataKeys) {
            let value = this._walk(data, ...dataKeys);
            var img = card.find('.art img');
            var content = card.find('.art-url .content');
            if (value) {
                img.attr('src', value);
                content.text(value);
            }
            this._listenForContentChanges(content, data, ...dataKeys);
        }

        _fillStat(card, data, ...dataKeys) {
            let stat = dataKeys.slice(-1)[0];
            let value = this._walk(data, ...dataKeys);
            var content = card.find('.stat.{0} .modifier'.format(stat));
            if (value) {
                if (value < 0) {
                    value = Math.abs(value);
                    content.addClass('negative');
                }
                content.text(value);
            }
            this._listenForStatChanges(content, data, ...dataKeys);
        }

        _fillUpgrader(card, data, ...dataKeys) {
            let value = this._walk(data, ...dataKeys);
            if (value) {
                card.find('.upgrader').prop('selectedIndex', STAT_INDICES[value]);
            }
            this._listenForContentChanges(card.find('.stat .label'), data, ...dataKeys);
        }

        _fillTwister(card, data, ...dataKeys) {
            let value = this._walk(data, ...dataKeys);
            if (value) {
                card.find('.twister').prop('selectedIndex', TWIST_INDICES[value]);
            }
            this._listenForContentChanges(card.find('.twister .eventer'), data, ...dataKeys);
        }

        // Main populaters.

        backdropFront(card, entityName, data) {
            this._solidifyContent(card, '.title', entityName);
            this._fillContent(card, data, '.subtitle', 'front-subtitle');
            this._solidifyContent(card, '.expansion', entityName);
            this._fillContent(card, data, '.main', 'front-text');

            this._fillArt(card, data, 'front-image');
            this._fillContent(card, data, '.comment', 'front-comment');
        }

        backdropBack(card, entityName, data) {}
        
        storyFront(card, entityName, data) {
            this._fillContent(card, data, '.title', 'front-title');
            this._solidifyContent(card, '.expansion', entityName);
            this._fillContent(card, data, '.main', 'front-text');
            this._fillContent(card, data, '.goal.main', 'front-extra', 'goal');

            this._fillArt(card, data, 'front-image');
            this._fillContent(card, data, '.comment', 'front-comment');
        }

        storyBack(card, entityName, data) {}
        
        sceneFront(card, entityName, data) {
            this._fillContent(card, data, '.title', 'front-title');
            this._solidifyContent(card, '.expansion', entityName);
            this._fillContent(card, data, '.main', 'front-text');
            this._fillContent(card, data, '.goal.main.first', 'front-extra', 'goal-1');
            this._fillContent(card, data, '.goal.main.second', 'front-extra', 'goal-2');

            this._fillArt(card, data, 'front-image');
            this._fillContent(card, data, '.comment', 'front-comment');
        }

        sceneBack(card, entityName, data) {}
        
        extraFront(card, entityName, data) {
            this._fillContent(card, data, '.title', 'front-title');
            this._fillContent(card, data, '.cost .value', 'front-extra', 'cost');
            this._solidifyContent(card, '.expansion', entityName);
            this._fillContent(card, data, '.main', 'front-text');
            this._fillContent(card, data, '.healthbar', 'front-extra', 'hp');

            this._fillArt(card, data, 'front-image');
            this._fillContent(card, data, '.comment', 'front-comment');
        }

        extraBack(card, entityName, data) {
            this._fillContent(card, data, '.title', 'back-title');
            this._fillContent(card, data, '.subtitle', 'back-subtitle');
            this._fillContent(card, data, '.cost .value', 'back-extra', 'cost');
            this._solidifyContent(card, '.expansion', entityName);
            this._fillContent(card, data, '.main', 'back-text');
            this._fillContent(card, data, '.healthbar', 'back-extra', 'hp');

            this._fillArt(card, data, 'back-image');
            this._fillContent(card, data, '.comment', 'back-comment');
        }
        
        starFront(card, entityName, data) {
            this.extraFront(card, entityName, data);
            this._fillContent(card, data, '.subtitle', 'front-subtitle');
        }

        starBack(card, entityName, data) {
            this.extraBack(card, entityName, data);
        }
        
        propFront(card, entityName, data) {
            this._fillContent(card, data, '.title', 'front-title');
            this._solidifyContent(card, '.expansion', entityName);
            this._fillContent(card, data, '.main', 'front-text');

            this._fillArt(card, data, 'front-image');
            this._fillContent(card, data, '.comment', 'front-comment');
        }

        propBack(card, entityName, data) {}
        
        twistFront(card, entityName, data) {
            this._fillContent(card, data, '.title', 'front-title');
            this._solidifyContent(card, '.expansion', entityName);
            this._fillContent(card, data, '.main', 'front-text');
            // this._fillTwister(card, data, 'front-extra', 'alternate');

            this._fillArt(card, data, 'front-image');
            this._fillContent(card, data, '.comment', 'front-comment');
        }

        twistBack(card, entityName, data) {}
        
        characterFront(card, entityName, data) {
            this._solidifyContent(card, '.title', entityName);
            this._fillContent(card, data, '.subtitle', 'front-subtitle');
            STATS.forEach((stat) => {
                this._fillStat(card, data, 'front-extra', stat);
            })
            this._fillContent(card, data, '.expansion', 'front-title');
            this._fillContent(card, data, '.main', 'front-text');
            this._fillContent(card, data, '.healthbar', 'front-extra', 'hp');
            this._fillContent(card, data, '.color', 'front-extra', 'color');

            this._fillArt(card, data, 'front-image');
            this._fillContent(card, data, '.comment', 'front-comment');
        }

        characterBack(card, entityName, data) {
            this.moveBack(card, entityName, data);

            this._fillArt(card, data, 'back-image');
            this._fillContent(card, data, '.comment', 'back-comment');
        }

        moveFront(card, entityName, data) {
            this._solidifyContent(card, '.title', entityName);
            this._fillContent(card, data, '.expansion', 'front-title');
            this._fillContent(card, data, '.main', 'front-text');
            this._fillContent(card, data, '.color', 'front-extra', 'color');

            this._fillArt(card, data, 'front-image');
            this._fillContent(card, data, '.comment', 'front-comment');
        }

        moveBack(card, entityName, data) {
            this._solidifyContent(card, '.title', entityName);
            this._fillContent(card, data, '.chapter', 'back-title');
            this._fillContent(card, data, '.main', 'back-text');
            this._fillContent(card, data, '.color', 'back-extra', 'color');

            this._fillContent(card, data, '.comment', 'back-comment');
        }

        superFront(card, entityName, data) {
            this.moveFront(card, entityName, data);
            this._fillUpgrader(card, data, 'front-extra', 'upgrade');
        }

        superBack(card, entityName, data) {
            this.moveBack(card, entityName, data);
        }

        referenceFront(card, entityName, data) {
            // Noop.
        }

        referenceBack(card, entityName, data) {
            // Noop.
        }

        xcardFront(card, entityName, data) {
            // Noop.
        }

        xcardBack(card, entityName, data) {
            // Noop.
        }

        journeyFront(card, entityName, data) {
            this._fillContent(card, data, '.title', 'front-title');
            this._solidifyContent(card, '.expansion', entityName);
            this._fillContent(card, data, '.main', 'front-text');
            this._fillContent(card, data, '.goal.first', 'front-extra', 'goal-1');
            this._fillContent(card, data, '.goal.second', 'front-extra', 'goal-2');
            this._fillContent(card, data, '.goal.third', 'front-extra', 'goal-3');

            this._fillArt(card, data, 'front-image');
            this._fillContent(card, data, '.comment', 'front-comment');
        }

        journeyBack(card, entityName, data) {
            this._solidifyContent(card, '.title', entityName);
            this._fillContent(card, data, '.chapter', 'back-title');
            this._fillContent(card, data, '.main', 'back-text');

            // this._fillArt(card, data, 'back-image');
            this._fillContent(card, data, '.comment', 'back-comment');
        }

        mapFront(card, entityName, data) {
            // Noop.
        }

        mapBack(card, entityName, data) {
            // Noop.
        }
    }

    cardPopulater = new CardPopulater();

 
});
