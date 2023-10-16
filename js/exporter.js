jQuery(document).ready(function ($) {


    var MODES = [
        'shrink', 
        'crafter', 
        'low-ink', 
        'no-frame', 
        'skip-linewrap-fix', 
        'mask-rounded', 
        'mask-square'
    ];
    var BORING = [
        'backdrop', 
        'story', 
        'scene', 
        'prop', 
        'twist'
    ]


    // Download a string as a named file.
    // https://youtu.be/Ihf0GE9eeHQ?t=133
    var download = function(filename, text) {
        var a = $('<a>');
        a.hide();
        a.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        a.attr('download', filename);
        a.appendTo($('body'));
        a[0].click();
        a.remove();
    }


    // Get a card from the content manager.
    var findCard = function(entityType, entityName, cardType, cardNum, side) {
        let id = '{0}-{1}'.format(cardType, cardNum);
        let found = undefined;
        contentManager.stores[entityType][entityName].forEach((card) => {
            if (card.type == id) {
                found = card;
            }
        });
        return found;
    }

    // Get the standalone card being toyed with.
    var findStandalone = function(entityType, entityName, cardType, cardNum, side) {
        return contentManager.standalone[0];
    }

    // Turn a card into a URL parameter.
    var snapCard = function(entityType, entityName, cardType, cardNum, side, finder=findCard) {
        let id = '{0}-{1}'.format(cardType, cardNum);
        let found = finder(entityType, entityName, cardType, cardNum, side);
        // Quick and dirty deep copy.
        found = JSON.parse(JSON.stringify(found));

        // Capture which side of the card we're snapping.
        found['_side'] = side;

        // Art root (via local storage) won't be accessible to headless Chrome, 
        // so we have to plug those in now.
        let root = artManager.get();
        if (root) {
            let key = '{0}-image'.format(side);
            if (!found[key]) {
                let art = root + '{0}/{1}/{2}{3}.png'.format(
                    clean(entityType), clean(entityName), id, (side == 'back' ? 'b' : ''));
                found[key] = art;
            }
        }
        let stores = {};
        stores[entityType] = {};
        stores[entityType][entityName] = [found];

        return btoa(encodeURIComponent(JSON.stringify(stores))).replace('+', '%2B');
    }

    // Return true *unless* this is a generic card back; then we only need the first one.
    var shouldSnap = function(cardType, cardNum, side) {
        return !(side == 'back' && cardNum > 1 && BORING.includes(cardType));
    }

    // Turn a set into a sequence of card names and URL parameters.
    var snapEntity = function(entityType, entityName) {
        let snaps = {};
        let cards = contentManager.stores[entityType][entityName];
        cards.forEach((card) => {
            let [cardType, cardNum] = card.type.split('-');
            ['front', 'back'].forEach((side) => {
                if (shouldSnap(cardType, cardNum, side)) {
                    let encoded = snapCard(entityType, entityName, cardType, cardNum, side);
                    snaps[card.type + (side == 'back' ? 'b' : '')] = encoded;
                }
            });
        });

        return snaps;
    }

    var snapStandalone = function(entityType, entityName) {
        let card = contentManager.standalone[0];
        let [cardType, cardNum] = card.type.split('-');
        let params = new URLSearchParams(window.location.search);
        let side = params.get('side');
        let encoded = snapCard(entityType, entityName, cardType, cardNum, side, findStandalone);
        let snaps = {};
        snaps[card.type + (side == 'back' ? 'b' : '')] = encoded;
        return snaps;
    }

    var snapCurrent = function(entityType, entityName) {
        let params = new URLSearchParams(window.location.search);
        let ct = params.get('type');
        let cn = params.get('c');
        let s = params.get('side');

        let snaps = {};
        let cards = contentManager.stores[entityType][entityName];
        cards.forEach((card) => {
            let [cardType, cardNum] = card.type.split('-');
            ['front', 'back'].forEach((side) => {
                if (cardType == ct && cardNum == cn && side == s) {
                    let encoded = snapCard(entityType, entityName, cardType, cardNum, side);
                    snaps[card.type + (side == 'back' ? 'b' : '')] = encoded;
                }
            });
        });

        return snaps;
    }

    // Turn a character or set into JSON that can be loaded in the VTT.
    var vttEntity = function(entityType, entityName) {
        let cards = contentManager.stores[entityType][entityName];
        let json;
        switch (entityType) {
            case 'char':
                json = vttChar(entityName, cards);
                break;
            case 'set':
                json = vttSet(entityName, cards);
                break;
            case 'campaign':
                json = vttCampaign(entityName, cards);
                break;
        }
        return json;
    }

    var STATS = ['tough', 'calm', 'hasty', 'bright', 'sly'];
    var SUPERS = [5, 6, 7];
    var vttChar = function(entityName, cards) {
        let json = {};
        let details = cards[0]['front-extra'];

        let stats = STATS.map(stat => (details[stat] || '0').toString()).join(' ');
        let hearts = (details.hp || '***').split(' ').map(s => s.length.toString()).join(' ');
        let upgrades = SUPERS.map(i => cards[i]['front-extra'].upgrade || 'tough');

        json = {
            character: {
                '1': {
                    hearts: {front: hearts}, 
                    stats: stats
                }
            }, 
            super: {
                '1': {upgrade: upgrades[0]},
                '2': {upgrade: upgrades[1]},
                '3': {upgrade: upgrades[2]}
            }
        };
        return json;
    }

    var EXTRAS = [15, 16, 17, 18, 19, 20, 21, 22, 23];
    var STARS = [24, 25, 26];
    var vttSet = function(entityName, cards) {
        let json = {extra: {}, star: {}};

        EXTRAS.map(i => vttExtra(cards[i])).forEach((e, i) => {json.extra[(i+1).toString()] = e});
        STARS.map(i => vttExtra(cards[i])).forEach((e, i) => {json.star[(i+1).toString()] = e});

        return json;
    }

    var vttExtra = function(card) {
        let front = card['front-extra'];
        let back = card['back-extra'];

        let hpFront = (front.hp || '*').split(' ').map(s => s.length.toString()).join(' ');
        let hpBack = (back.hp || '*').split(' ').map(s => s.length.toString()).join(' ');
        let cost = front.cost || '1';

        return {
            hearts: {
                front: hpFront, 
                back: hpBack
            }, 
            cost: cost
        };
    }

    var vttCampaign = function(entityName, cards) {
        let json = {};
        return json
    }

    // Get the raw text to download.
    getExportText = function(entityType, entityName, snapper=snapEntity) {
        let url = window.location.protocol + '//' + window.location.host + 
            window.location.pathname + '?';
        let modes = '';
        MODES.forEach(mode => {
            if (window.localStorage.getItem(mode) == 'true') {
                modes += '{0}=on&'.format(mode);
            }
        });
        modes += 'export=';

        // Adjust image dimensions.
        let crafter = modes.search('crafter') >= 0;
        let shrink = !crafter && modes.search('shrink') >= 0;
        let mask = modes.search('mask') >= 0;
        let [w, h] = [898, 1488];
        let border = 36;
        if (shrink) {
            w /= 2;
            h /= 2;
            border /= 2;
        } else if (crafter) {
            [w, h] = [900, 1500];
        }
        if (mask) {
            w -= 2 * border;
            h -= 2 * border;
        }
        let dimensions = '{0},{1}'.format(w, h);

        let commands = [];
        // commands.push(String.raw`SET chrome="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"`);
        commands.push(String.raw`SET chrome="C:\Program Files\Google\Chrome\Application\chrome.exe"`);
        commands.push(String.raw`SET dir=%CD%\{0}\{1}`.format(entityType, clean(entityName)));
        commands.push('if not exist "%dir%" mkdir "%dir%"');
        commands.push('');

        let snaps = snapper(entityType, entityName);
        for (let name in snaps) {
            let encoded = snaps[name];
            // Raw strings to avoid double backslashing everything.
            commands.push('SET card={0}'.format(name));
            commands.push('SET data="{0}{1}{2}"'.format(url, modes, encoded));
            commands.push('%chrome% --headless --disable-gpu --window-size={0} '.format(dimensions) + 
                String.raw`--default-background-color=00000000 --screenshot="%dir%\%card%.png" %data%`);
            commands.push('');
        }

        return commands.join('\r\n');
    }

    // Takes an entity and downloads it as a .bat file that can export its list of cards.
    exportEntity = function(entityType, entityName, snapper=snapEntity) {
        let text = getExportText(entityType, entityName, snapper);
        download('cards-{0}-{1}.bat'.format(entityType, clean(entityName)), text);
    }

    // Takes an entity and downloads it as a .bat file that can export its list of cards.
    exportEntities = function(ids, snapper=snapEntity) {
        let text = ids.map(id => {
            let [entityType, entityName] = id.split(':');
            return getExportText(entityType, entityName, snapper);
        }).reduce((a, b) => `${a}\r\n\r\n${b}`);
        download('cards-all.bat', text);
        exportEntitiesJSON(ids);
    }

    exportStandalone = function(entityType, entityName) {
        exportEntity(entityType, entityName, snapStandalone)
    }
    exportCurrent = function(entityType, entityName) {
        exportEntity(entityType, entityName, snapCurrent)
    }

    // Takes an entity and downloads it as a .json file that can be loaded into the VTT.
    exportEntityJSON = function(entityType, entityName) {
        let json = {};
        json[entityType] = {};
        json[entityType][entityName] = vttEntity(entityType, entityName);
        let text = JSON.stringify(json, undefined, 3).replaceAll(': ', ':');
        download('data-{0}-{1}.json'.format(entityType, clean(entityName)), text);
    }

    exportEntitiesJSON = function(ids) {
        let json = {set: {}, char: {}, campaign: {}};
        ids.filter(i => i.startsWith('set:'))
           .map(i => i.substr(4))
           .forEach(i => {json.set[i] = vttEntity('set', i);});
        ids.filter(i => i.startsWith('char:'))
           .map(i => i.substr(5))
           .forEach(i => {json.char[i] = vttEntity('char', i);});
        let text = JSON.stringify(json, undefined, 3).replaceAll(': ', ':');
        download('data.json', text);
    }



    // Restore a card from a URL parameter.
    var unsnapCard = function(s) {
        contentManager.stores = JSON.parse(decodeURIComponent(atob(s.replace('%2B', '+'))));
        contentManager.lookedUp = true;
    }

    // Called when the page loader finds an export parameter.
    loadFromSnap = function(s) {
        $('.card-holder').addClass('exporting');
        let mask = window.localStorage.getItem('mask-rounded') == 'true' || 
            window.localStorage.getItem('mask-square') == 'true';
        if (mask) {
            let shrink = window.localStorage.getItem('shrink') == 'true';
            $('body').addClass(shrink ? 'body-masked-shrink' : 'body-masked');
        }
        if (window.localStorage.getItem('crafter') == 'true') {
            $('.outer-holder').addClass('crafter');
        }


        unsnapCard(s);
        let stores = contentManager.stores;
        let entityType = Object.keys(stores)[0];
        let entityName = Object.keys(stores[entityType])[0];
        let cards = stores[entityType][entityName];
        let card = cards[0];
        let [cardType, cardNume] = card.type.split('-');
        let side = card['_side'];

        cardMaker._make(cardType, side == 'back', entityType, entityName, card.type, cards);
    }



    let query = async function(id) {
        let [type, name] = id.split(':');
        let complete = false;
        let f = () => complete = true;
        let cb = (status, entity) => f();
        contentManager.query(type, name, cb);
        if (complete) {
            // Query completed.
            return new Promise(resolve => resolve());
        } else {
            // Query submitted but not resolved.
            return new Promise(resolve => f = resolve);
        }
    }

    exportMultiple = function() {
        // Throw up a dialog populated with all sets and chars.
        let ids = [];
        Object.keys(contentManager.stores).forEach(k => {
            Object.keys(contentManager.stores[k]).forEach(k2 => ids.push(`${k}:${k2}`));
        });

        let e = $('.export-picker');
        if (!e[0]) {
            e = $('<div class="export-picker show">').appendTo($('body'));
            let inner = $('<div class="inner">').appendTo(e);
            let row = $('<div class="row">').appendTo(inner);
            let cb = $('<input type="checkbox" id="select-all">').appendTo(row);
            $('<label for="select-all">Select All</label>').appendTo(row);

            ids.forEach(id => {
                makeExportableRow(id).appendTo(inner);
            });

            row = $('<div class="button-row">').appendTo(inner);
            let go = $('<div class="button export">').appendTo(row);
            let cancel = $('<div class="button cancel">').appendTo(row);

            // Actions.
            cb.on('click', () => {
                let checked = cb.is(':checked');
                e.find('.exportable').each((i, v) => {
                    startOrCancelLoad($(v).prop('checked', checked).attr('data-export-id'));
                });
            });
            go.on('click', () => beginExport(e));
            cancel.on('click', () => closeExporter(e));
        } else if (!e.hasClass('show')) {
            e.addClass('show');
        }
    }
    let makeExportableRow = function(id) {
        let [type, name] = id.split(':');
        let row = $(`<div class="row" for="select-${clean(type)}-${clean(name)}">`);
        let cb = $(`<input type="checkbox" class="exportable" id="select-${clean(type)}-${clean(name)}" data-export-id="${id}">`).appendTo(row);
        $(`<label for="select-${clean(type)}-${clean(name)}">${name}</label>`).appendTo(row);
        cb.on('change', () => startOrCancelLoad(id));
        return row;
    }
    let beginExport = function(e) {
        e.addClass('loading');
        e.find('input[type="checkbox"]').attr('disabled', true);
        if (q.length == 0) {
            doneLoading(e);
        }
    }
    let doneLoading = function(e) {
        if (!e.is('.loading')) {
            return;
        }
        closeExporter(e);
        let ids = e.find('.exportable:checked').get().map(v => $(v).attr('data-export-id'));
        exportEntities(ids);
    }
    let closeExporter = function(e) {
        e.removeClass('loading show');
        e.find('input[type="checkbox"]').removeAttr('disabled');
    }

    let q = [];
    let startOrCancelLoad = async function(id) {
        let [type, name] = id.split(':');
        let e = $('.export-picker');
        let row = e.find(`.row[for="select-${clean(type)}-${clean(name)}"]`);
        let checked = row.find('.exportable').is(':checked');
        if (checked) {
            if (row.is('.loaded')) {
                return;
            }
            q.push(id);
            if (q.length == 1) {
                while (q.length) {
                    await query(q[0]);
                    [type, name] = q.shift().split(':');
                    e.find(`.row[for="select-${clean(type)}-${clean(name)}"]`).addClass('loaded');
                }
                doneLoading(e);
            }
        } else {
            let i = q.indexOf(id);
            if (i > 0) {
                q.splice(i, 1);
            }
        }
    }


});
