jQuery(document).ready(function ($) {


    var CHARS_PER_GROUP = 12;
    var SETS_PER_GROUP = 4;

    var TYPES = [
        'backdrop', 
        'story', 
        'scene', 
        'extra', 
        'star', 
        'prop', 
        'twist', 
        'character', 
        'move', 
        'super', 
        'reference', 
        'xcard', 
    ];
    var SAMPLE_URL = 'https://script.google.com/macros/s/xxxxx-xxx-xxxxxx/exec';
    var COUNTS = {
        'set': {
            backdrop: 1, 
            story: 5, 
            scene: 9, 
            extra: 9, 
            star: 3, 
            prop: 12, 
            twist: 12
        }, 
        'char': {
            character: 1, 
            move: 4, 
            super: 3
        }
    };
    var ENTITY_FOR_TYPE = {
        backdrop: 'set', 
        story: 'set', 
        scene: 'set', 
        extra: 'set', 
        star: 'set', 
        prop: 'set', 
        twist: 'set', 

        character: 'char', 
        move: 'char', 
        super: 'char', 

        reference: 'ref', 
        xcard: 'ref'
    };
    GENERIC_BACKS = ['backdrop', 'story', 'scene', 'prop', 'twist'];


    var nice = function(s) {
        return s ? s.replace(/[_*^]/g, '') : s;
    }


    // Forcefully hide the menu.
    var hideMenu = function() {
        let menu = $('.menu-main');
        if (!menu.hasClass('lock')) {
            menu.removeClass('open');
        }
    }

    // Handle expanders when an item's name is clicked.
    var itemClick = function(e) {
        var target = $(e.target);
        e.stopPropagation();
        var item = $(e.target).closest('.item');
        if (item.hasClass('active')) {
            item.removeClass('active');
            item.parents('.item').first().removeClass('parent-of-active').addClass('active');
        } else if (item.hasClass('parent-of-active')) {
            item.removeClass('parent-of-active');
            item.find('.parent-of-active').removeClass('parent-of-active');
            item.find('.active').removeClass('active');
            item.parents('.item').first().removeClass('parent-of-active').addClass('active');
        } else {
            $('.menu-main .item').removeClass('active');
            $('.menu-main .item').removeClass('parent-of-active');                
            item.addClass('active');
            item.parents('.item').addClass('parent-of-active');
        }
    }


    // Make a new menu item.
    var createItem = function(name, classes, parent) {
        var item = $('<div class="item {0}">'.format(classes));
        var nameDiv = $('<div class="name">{0}</div>'.format(name));
        nameDiv.appendTo(item);
        nameDiv.on('click', itemClick);
        var contents = $('<div class="contents">');
        contents.appendTo(item);
        if (parent) {
            item.appendTo(parent);
        }
        return contents;
    }

    // Make a new form for saving/clearing a single string value.
    var createForm = function(label, name, placeholder, initial, submitCallback, clearCallback) {
        var form = $('<form action="?">' + 
            '{0}: <input type="text" name="{1}" placeholder="{2}" spellcheck="false"><br>'.format(label, name, placeholder) + 
            '<button type="submit" value="Save">Save</button>' + 
            '<button type="reset" value="Clear">Clear</button>' + 
            '<span class="status">' + 
            '</form>');
        var status = form.find('.status');
        var showStatus = function(s) {
            status.text(s);
            status.clearQueue();
            status.stop().animate({opacity: '1'}, 350).delay(2750).animate({opacity: '0'}, 350);
        };

        var input = form.find('input');
        input.val(initial);

        form.on('submit', function(e) {
            e.preventDefault();
            if (submitCallback) {
                submitCallback(input.val(), showStatus);
            }
        });
        form.on('reset', function(e) {
            showStatus('Cleared');
            input.val('');
            if (clearCallback) {
                clearCallback(showStatus);
            }
        });
        return form;
    }


    var setLoadedSingle = function(cardType, side) {
        setLoadedCard(undefined, undefined, cardType, undefined, side);
    }

    setLoadedCard = function(entityType, entityName, cardType, cardNum, side) {
        $('.menu-main .creations .row .img').removeClass('loaded');
        $('.menu-main .singles .row .img').removeClass('loaded');
        if (entityType && entityName && cardType && cardNum && side) {
            $('.menu-main .creations .{0}s #{1} .{2} #{3}-{4}'.format(
                entityType, clean(entityName), side, cardType, cardNum)).addClass('loaded');
        } else if (cardType) {
            $('.menu-main .singles .{0} .img.{1}'.format(
                side, cardType)).addClass('loaded');
        }
    }

    updateAllItemGroups = function() {
        updateItemGroups('char', CHARS_PER_GROUP);
        // updateItemGroups('set', SETS_PER_GROUP);
    }

    let updateItemGroups = function(type, n) {
        let option = window.localStorage.getItem('group-chars');
        if (option == 'true' || option == 'on') {
            let parent = $('.menu-main .creations .{0}s>.contents'.format(type));
            let items = parent.find('.{0}'.format(type)).get();
            let [groups, leftovers] = [Math.floor(items.length / n), items.length % n];
            let group, i, j, k;
            k = groups + (leftovers > 0 ? 1 : 0);
            if (leftovers > 0) {
                group = createItem('Group {0}'.format(k), 'collection', parent);
                for (i = 0; i < leftovers; i++) {
                    $(items[leftovers - 1 - i]).appendTo(group);
                }
                k -= 1;
            }
            for (j = 0; j < groups; j++) {
                group = createItem('Group {0}'.format(k), 'collection', parent);
                for (i = 0; i < n; i++) {
                    $(items[leftovers + (j * n) + (n - 1 - i)]).appendTo(group);
                }
                k -= 1;
            }
        }
    }


    addCreationToMenu = function(type, name, data) {
        var parent = $('.menu-main .creations .{0}s>.contents'.format(type));
        var child = createItem(name, '{0}'.format(type), parent);
        child.parent().attr('id', clean(name));
        $('<span class="description">No data loaded yet.</span>').appendTo(child);
        if (data) {
            populateCreation(type, name, data);
        } else {
            child.parent().find('.name').first().one('click', (e) => {
                contentManager.query(type, name, (status, data) => {
                    if (status == 'success') {
                        populateCreation(type, name, data);
                    } else {
                        child.find('.description').text('Error loading data: ' + data);
                    }
                });
            });
        }
    }

    clearLoadedCard = function() {
        $('.card-holder').empty();
        var url = window.location.protocol + '//' + window.location.host + 
            window.location.pathname + '?';
        window.history.pushState({path: url}, '', url);
    }

    populateCreation = function(type, name, data) {
        var parent = $('.menu-main .creations .{0}#{1} .contents'.format(type, clean(name)));
        parent.empty();

        let exporter = $('<div class="export">Export</div>').appendTo(parent);
        let button = $('<span class="go">All cards</div>').appendTo(exporter);
        button.on('click', e => exportEntity(type, name));
        let button2 = $('<span class="go">Current card</div>').appendTo(exporter);
        button2.on('click', e => exportCurrent(type, name));
        let button3 = $('<span class="go">JSON</div>').appendTo(exporter);
        button3.on('click', e => exportEntityJSON(type, name));

        var cards = {};
        var counts = {};
        data.forEach((card) => {
            let cardType = card.type.split('-')[0];
            if (!(cardType in cards)) {
                cards[cardType] = [];
                counts[cardType] = 0;
            }
            cards[cardType].push({
                id: card.type, 
                front: nice(card['front-title']) || (card.type + ' (front)'), 
                back: nice(card['back-title']) || ((nice(card['front-title']) || card.type) + ' (back)')
            });
            counts[cardType] += 1;
        });

        var frontDiv, backDiv, current;
        for (var cardType in cards) {
            if (!frontDiv || ((counts[cardType] + current) > 12)) {
                frontDiv = $('<div class="row front">');
                backDiv = $('<div class="row back">');
                frontDiv.appendTo(parent);
                backDiv.appendTo(parent);
                current = 0;
            }
            if (current > 0) {
                $('<span class="gap">').appendTo(frontDiv);
                $('<span class="gap">').appendTo(backDiv);
            }
            cards[cardType].forEach(({id, front, back}) => {
                makeFrontIcon(frontDiv, type, name, id, front, 'front');
                makeBackIcon(backDiv, type, name, id, back, 'back');
                current += 1;
            });
        }

        var params = new URLSearchParams(window.location.search);
        var entityType = params.get('e');
        var entityName = params.get('name');
        var cardType = params.get('type');
        var cardNum = params.get('c');
        var side = params.get('side');
        setLoadedCard(entityType, entityName, cardType, cardNum, side);
        // if (entityType && entityName && cardType && cardNum && side) {
        //     $('.menu-main .creations .{0}s #{1} .{2} #{3}-{4}'.format(
        //         entityType, clean(entityName), side, cardType, cardNum)).addClass('loaded');
        // }
    }

    var makeFrontIcon = function(div, type, name, id, text, side) {
        let cardType = id.split('-')[0];
        if (cardType == 'backdrop') {
            text = name.toUpperCase();
        }
        makeIcon(type, name, id, text, side).appendTo(div);
    }

    var makeBackIcon = function(div, type, name, id, text, side) {
        let p = div.children().slice(-1);
        let cardType = id.split('-')[0];

        if (GENERIC_BACKS.includes(cardType)) {
            if (p[0] && p.children().first().hasClass(cardType)) {
                let img = p.find('.img');
                let i = parseInt(img.attr('style').match(/\d+/)) + 1;
                img.attr('style', '--width: ' + i);
                p.find('.tooltip .text').text(cardType.toUpperCase() + ' (back)');
            } else {
                let icon = makeIcon(type, name, id, text, side).appendTo(div);
                icon.find('.img').attr('style', '--width: 1');
                icon.find('.tooltip .text').text(cardType.toUpperCase() + ' (back)');
            }
        } else {
            makeIcon(type, name, id, text, side).appendTo(div);
        }
    }

    var makeIcon = function(type, name, id, text, side) {
        var [cardType, cardNum] = id.split('-');
        var icon = $('<span class="outer"><span class="img {0}" id="{1}">'.format(cardType, id));
        icon.find('.img').attr('style', '--width: 1');
        createTooltip(text).appendTo(icon);
        icon.on('click', (e) => loadCard(type, name, cardType, cardNum, side, id));
        return icon;
    }

    var loadCard = function(type, name, cardType, cardNum, side, id) {
        setLoadedCard(type, name, cardType, cardNum, side);
        // $('.menu-main .creations .row .img').removeClass('loaded');
        // icon.find('.img').addClass('loaded');

        var params = new URLSearchParams(window.location.search);
        params.set('e', type);
        params.set('name', name);
        params.set('type', cardType);
        params.set('side', side);
        params.set('c', cardNum);
        var url = window.location.protocol + '//' + window.location.host + 
            window.location.pathname + '?' + params.toString();
        window.history.pushState({path: url}, '', url);

        hideMenu();
        var data = contentManager.query(type, name, (status, data) => {
            if (status == 'success') {
                cardMaker._make(cardType, side == 'back', type, name, id, data);
            } else {
                console.log(data);
            }
        });
    }
    var cycleThroughCards = function(forward=true) { // Forward = moving to the right.
        let loaded = $('.loaded');
        if (loaded.length == 0) {
            return;
        }
        let move = forward ? 'next' : 'prev';
        let jump = forward ? 'first' : 'last';
        let p = loaded.parent();
        let row = p.parent();
        let cards = row.find('.outer');
        if (cards.length == 1) {
            return;
        }

        do {
            p = p[move]();
            if (p.length == 0) {
                p = cards[jump]();
            }
        } while (p.is('.gap'));
        let id = p.find('.img').attr('id');
        let [type, num] = id.split('-');
        cycleToIcon(id, {type: type, num: num});
    }
    var cycleThroughRows = function(forward=true) { // Forward = moving down the page.
        let loaded = $('.loaded');
        if (loaded.length == 0) {
            return;
        }
        let p = loaded;
        let row = p.closest('.row');
        while (true) {
            let next_row = forward ? row.next() : row.prev();
            if (next_row.length == 0) {
                // Loop to top.
                row = row.parent().find('.row').first();
            } else if (!next_row.is('.row')) {
                // Loop to bottom.
                row = row.parent().find('.row').last();
            } else {
                row = next_row;
            }
            if (!isRowGeneric(row)) {
                // We've found our candidate..
                break;
            }
        }
        let i = Math.min(getIconIndex(p), row.find('.img').length);
        p = row.find('.img').eq(i - 1);
        let [type, num] = p.attr('id').split('-');
        let side = row.is('.front') ? 'front' : 'back';
        cycleToIcon(p.attr('id'), {type: type, num: parseInt(num), side: side});
    }
    var isRowGeneric = function(row) {
        let side = row.is('.front') ? 'front' : 'back';
        let p = row.find('.img').first();
        return side == 'back' && GENERIC_BACKS.includes(p.attr('id').split('-')[0]);
    }
    var getIconIndex = function(p) {
        return p.closest('.row').find('.img').index(p) + 1;
    }
    var cycleToIcon = function(id, data) {
        var params = new URLSearchParams(window.location.search);
        var type = params.get('e');
        var name = params.get('name');
        var cardType = data.type || params.get('type');
        var cardNum = data.num || params.get('c');
        var side = data.side || params.get('side');
        loadCard(type, name, cardType, cardNum, side, id);
    }




    var createExternals = function(menu) {
        var item = createItem('Externals', 'externals', menu);
        $('<span class="description">Set up external database and image resources.</span>').appendTo(item);
        
        var url = createItem('Google Sheet', 'db', item);
        $('<span class="description">Link to the script URL of a Google Sheet. ' + 
            'Once entered, refresh the page to see changes take effect. ' + 
            'For more info, see Help > Google Sheet.</span>').appendTo(url);
        createForm('URL', 'url', SAMPLE_URL, dbManager.get() || '', 
            function(value, showStatus) {
                var url = value.trim();
                if (url.match('^https://script.google.com/macros/s/[a-zA-Z0-9_-]+/exec$')) {
                    showStatus('Saved');
                    dbManager.set(url);
                    contentManager.clear();
                    contentManager.db = dbManager; // Switch to remote database.
                    clearLoadedCard(); // Clear currently loaded card.
                    loadCreations(true); // Reinitialize content.
                } else {
                    showStatus('Bad URL');
                }
            }, 
            function() {
                dbManager.clear();
                contentManager.clear();
                contentManager.db = localDatabase; // Switch to local database.
                clearLoadedCard(); // Clear currently loaded card.
                loadCreations(true); // Reinitialize content.
            }).appendTo(url);

        var image = createItem('Art Root', 'art-root', item);
        $('<span class="description">Link to a root site directory containing ' + 
            'card art image resources. Once entered, refresh the page to see changes ' + 
            'take effect. For more info, see Help > Art Root.</span>').appendTo(image);
        createForm('Root', 'root', 'https://site.web/art-root', artManager.get() || '', 
            function(value, showStatus) {
                var url = value.trim();
                if (url.match('^https://.+')) {
                    artManager.set(url);
                    showStatus('Saved');
                } else {
                    showStatus('Bad URL');
                }
            }, 
            function() {
                artManager.clear();
            }).appendTo(image);
    }


    var createCreations = function(menu) {
        var item = createItem('Creations', 'creations', menu);
        $('<span class="description">Manage sets and characters.</span>').appendTo(item);

        var add = createItem('New', 'new-creation', item);
        $('<span class="description">Create a new set or character with a default spread of cards.</span>').appendTo(add);
        createForm('Name', 'creation-name', 'set: <name> / char: <name>', '', 
            function(value, showStatus) {
                try {
                    var pieces = value.trim().split(':');
                    var type = pieces[0].trim().toLowerCase();
                    if (type == 'character') {
                        type = 'char';
                    }
                    if (['set', 'char'].includes(type)) {
                        var name = pieces[1].trim();
                        showStatus('Request submitted');
                        contentManager.create(type, name, COUNTS[type], (status, data) => {
                            showStatus(status == 'success' ? 
                                name + ' created; refresh to see it' : 
                                'Creation failed: ' + data);
                        });
                    } else {
                        showStatus('Invalid type');
                    }
                } catch (error) {
                    showStatus('Bad value');
                }
            }, undefined).appendTo(add);

        var deletion = createItem('Delete', 'delete-creation', item);
        $('<span class="description">Delete an existing set or character by name.</span>').appendTo(deletion);
        createForm('Name', 'creation-name', 'set: <name> / char: <name>', '', 
            function(value, showStatus) {
                try {
                    var pieces = value.trim().split(':');
                    var type = pieces[0].trim().toLowerCase();
                    if (type == 'character') {
                        type = 'char';
                    }
                    if (['set', 'char'].includes(type)) {
                        var name = pieces[1].trim();
                        showStatus('Request submitted');
                        contentManager.delete(type, name, (status, data) => {
                            showStatus(status == 'success' ? 
                                name + ' deleted; refresh the page' : 
                                'Deletion failed: ' + data);
                        });
                    } else {
                        showStatus('Invalid type');
                    }
                } catch (error) {
                    showStatus('Bad value');
                }
            }, undefined).appendTo(deletion);

        var export_all = createItem('Export', 'export-all', item);
        $('<span class="description">Export multiple items at a time.</span>').appendTo(export_all);
        let exporter = $('<div class="export">Export</div>').appendTo(export_all);
        let button = $('<span class="go">Click here</div>').appendTo(exporter);
        button.on('click', exportMultiple);

        var sets = createItem('Sets', 'sets', item);
        $('<span class="description">Sets you\'ve worked on.</span>').appendTo(sets);

        var chars = createItem('Characters', 'chars', item);
        $('<span class="description">Characters you\'ve worked on.</span>').appendTo(chars);
    }


    var createTooltip = function(text) {
        let tooltip = $('<span class="tooltip">');
        $('<span class="text">{0}</span>'.format(text)).appendTo(tooltip);
        return tooltip;
    }

    var createSingles = function(menu) {
        let params = new URLSearchParams(window.location.search);
        let cardType, cardSide;
        if (!params.get('e')) {
            cardType = params.get('type');
            cardSide = params.get('side');
        }

        var item = createItem('Standalone cards', 'singles', menu);

        $('<span class="description">Work on single cards, outside of a set.</span>').appendTo(item);

        let exporter = $('<div class="export">Export</div>').appendTo(item);
        let button = $('<span class="go">Click here</div>').appendTo(exporter);
        button.on('click', e => {
            let entityName = $('.card .title .content').text().toLowerCase();
            entityName = prompt('Set or character name', entityName);
            if (entityName) {
                let params = new URLSearchParams(window.location.search);
                let cardType = params.get('type');
                let entityType = ENTITY_FOR_TYPE[cardType];
                exportStandalone(entityType, entityName.toLowerCase());
            }
        });

        var divs;
        var FRESH_ROWS = ['backdrop', 'character', 'reference'];
        TYPES.forEach(function(type) {
            if (!divs || FRESH_ROWS.includes(type)) {
                divs = {
                    front: $('<div class="row front">').appendTo(item), 
                    back: $('<div class="row back">').appendTo(item), 
                };
            }
            ['front', 'back'].forEach(function(side) {
                let name = '{0} ({1})'.format(type, side);
                var icon = $('<span class="outer"><span class="img {0}">'.format(type));
                if (type == cardType && side == cardSide) {
                    icon.find('.img').addClass('loaded');
                    item.prev().trigger('click');
                }
                createTooltip(name).appendTo(icon);
                icon.appendTo(divs[side]);
                icon.on('click', function() {
                    setLoadedSingle(type, side);

                    let params = new URLSearchParams(window.location.search);
                    params.set('type', type);
                    params.set('side', side);
                    params.delete('e');
                    params.delete('name');
                    params.delete('c');
                    var url = window.location.protocol + '//' + window.location.host + 
                        window.location.pathname + '?' + params.toString();
                    window.history.pushState({path: url}, '', url);

                    hideMenu();
                    cardMaker._make(type, side == 'back');
                });
            });
        });
    }


    var optionHandler = function(control, enabled) {
        var holder = $('.card-holder');
        enabled ? holder.addClass(control) : holder.removeClass(control);
    }

    var spellcheckHandler = function(control, enabled) {
        $('.card [contenteditable]').attr('spellcheck', enabled);
    }

    var controlHandler = function(control, enabled) {
        let overlay = $('.control-overlay');
        enabled ? overlay.show() : overlay.hide();
    }

    var groupCharsHandler = function(control, enabled) {
        if (enabled) {
            updateAllItemGroups();
        } else {
            ['char', 'set'].forEach(type => {
                let parent = $('.menu-main .creations .{0}s>.contents'.format(type));
                parent.find('.{0}'.format(type)).appendTo(parent);
                parent.find('.collection').remove();
            });
        }
    }

    var ON_BY_DEFAULT = []; // ['shrink', 'no-frame', 'mask-square'];
    var createOptions = function(menu) {
        var item = createItem('Settings', 'settings', menu);
        $('<span class="description">Additional options.</span>').appendTo(item);

        var list = [
            ['shrink', 'Shrink card display size', optionHandler], 
            ['low-ink', 'Low-ink mode', optionHandler], 
            ['crafter', 'GameCrafter card size', optionHandler], 
            ['skip-linewrap-fix', 'Disable linewrap fix', optionHandler], 
            [], 
            ['no-frame', 'Frameless mode', optionHandler], 
            ['mask-rounded', 'Cropped (rounded)', optionHandler], 
            ['mask-square', 'Cropped (square)', optionHandler], 
            [], 
            ['shortcuts', 'Editor shortcuts', controlHandler], 
            ['spellcheck', 'Enable spellcheck', spellcheckHandler], 
            ['comments-always', 'Comments always visible', optionHandler], 
            [], 
            ['highlight-bold', 'Highlight bold', optionHandler], 
            ['highlight-italic', 'Highlight italic', optionHandler], 
            ['highlight-underline', 'Highlight small caps', optionHandler], 
            ['highlight-newlines', 'Highlight linebreaks', optionHandler], 
            [], 
            ['group-chars', 'Group characters', groupCharsHandler]
        ];
        list.forEach(([control, description, handler]) => {
            if (!control) {
                $('<br>').appendTo(item);
                return;
            }
            let row = $('<div class="radio">');
            row.appendTo(item);
            $('<span class="label">{0}:</span>'.format(description)).appendTo(row);
            
            let inputOn = $('<input class="{0} on" type="radio" name={1}><label for="{2}">On</label>'.format(control, control, control));
            inputOn.appendTo(row);
            let inputOff = $('<input class="{0} off" type="radio" name={1}><label for="{2}">Off</label>'.format(control, control, control));
            inputOff.appendTo(row);
            
            let enabled = window.localStorage.getItem(control);
            enabled = enabled == 'true';
            // enabled = enabled == undefined ? ON_BY_DEFAULT.includes(control) : enabled == 'true';
            (enabled ? inputOn : inputOff).prop('checked', true);
            // window.localStorage.setItem(control, enabled ? 'true' : 'false');
            if (enabled) {
                handler(control, true);
                $('.card-holder').addClass(control);
            }
            row.find('input[name="{0}"'.format(control)).change((e) => {
                let enabled = $(e.target).hasClass('on');
                window.localStorage.setItem(control, enabled ? 'true' : 'false');
                handler(control, enabled);
            });
        });
    }


    var createControls = function(parent) {
        var list = {
            'ctrl+shift+S': 'Save local changes to the database.', 
            'ctrl+B': 'Bold the highlighted text.', 
            'ctrl+I': 'Italicize the highlighted text.', 
            'ctrl+U': 'Transform the highlighted text into small caps.', 
            '}': 'Indent the current paragraph, adding a token cost of 0. Repeat to undo.', 
            '{': 'Indent the current paragraph, adding a token cost of 1. Repeat to undo.', 
            '{{': 'Indent the current paragraph, adding a token cost of 2. Repeat to undo.', 
            '|': 'Indent the current paragraph, adding a bullet point. Repeat to undo.', 
            // '[': 'Insert a GM token symbol into the text.', 
            'shift+Tab': 'Remove any indentation from the current paragraph.', 
            // 'shift+Enter': 'Add an extra-tall line break.', 
            'ctrl+Enter': 'Finish editing a text field (also achieved by shifting focus or deselecting).', 
            'ctrl+shift+R': 'Apply text cleanup (also achieved by shifting focus or deselecting).', 
            'up/down arrows': 'Increment/decrement values for stats and costs.', 
            'ctrl+arrows': 'Cycle through cards within the current creation.', 
        };
        for (var control in list) {
            var details = list[control];
            $('<div><strong>{0}</strong> {1}</div>'.format(control, details)).appendTo(parent);
        }
    }


    var createHelp = function(menu) {
        var item = createItem('Help', 'help', menu);
        $('<span class="description">Additional information.</span>').appendTo(item);

        var controls = createItem('Controls', 'controls', item);
        var description = $('<span class="description">');
        description.appendTo(controls);
        createControls(description);

        let overlay = $('<div class="control-overlay">').appendTo($('body'));
        $('<h1>Controls</h1>').appendTo(overlay);
        createControls(overlay);
        if (window.localStorage.getItem('shortcuts') != 'true') {
            overlay.hide(); // TODO: persist settings
        }

        var hidden = createItem('Hidden Fields', 'hidden-fields', item);
        description = $('<span class="description">Some cards have hidden fields you can edit.</span>');
        description.appendTo(hidden);
        list = {
            'art-url': 'Card art', 
            'change-comment': 'Comment', 
            'character-color': 'Character color', 
            'change-health': 'Character health', 
        };
        for (var img in list) {
            let label = list[img];
            let gif = createItem(label, clean(label), hidden);
            $('<img src="images/menu/help/{0}.gif">'.format(img)).appendTo(gif);
        }

        var saving = createItem('Saving Data', 'saving-data', item);
        $('<p>By default, your creations are saved in browser local storage. You can ' + 
            'save via the ◔ button in the menu tray, or the <b>ctrl+S</b> shortcut key.</p>').appendTo(saving);
        $('<p>If you want to collaborate on your data with other users or ' + 
            'from other devices, you can set up a Google Sheet instead of using ' + 
            'browser local storage.</p>').appendTo(saving);
        $('<p>Specify the sheet URL in Externals > Google Sheet; doing so will ' + 
            'disable local data. Clear the URL if you want to switch back to using ' + 
            'local data.</p>').appendTo(saving);
        $('<p>Click <a href="copy-db.html" target="_blank">here</a>' + 
            ' for help setting up the Google Sheet.</p>').appendTo(saving);

        var root = createItem('Art Root', 'art-root', item);
        $('<p>An art root is a web URL under which card art is stored in a predefined layout. ' + 
            'Once you specify an art root URL, all cards will display a default art URL ' + 
            'derived from it. Place art at these individual URLs to automatically load ' + 
            'it into cards.</p>').appendTo(root);
        $('<p>Art should be organized as <em>type > name > cardtype-cardnum(b?).png</em>.').appendTo(root);
        $('<p>If you export cards, the images will automatically be generated in the correct ' + 
            'structure and with the correct names to be placed into an art root.').appendTo(root);
        $('<p>The art root feature is useful if you have access to image hosting where you can ' + 
            'specify the folder structure and URLs of images you upload. Some public hosting ' + 
            'solutions, like <em>imgur</em>, don\'t support this; you\'ll need to specify the ' + 
            'URL of each card\'s image by hand instead.</p>').appendTo(root);
        $('<p><img src="images/menu/help/art-root-layout.png"></p>').appendTo(root);
        $('<p><img src="images/menu/help/set-art-root.gif"></p>').appendTo(root);
        $('<p><img src="images/menu/help/check-art-root.gif"></p>').appendTo(root);

        var exporting = createItem('Exporting', 'exporting', item);
        $('<p>You an export any set or character you\'ve created using the ' + 
            '"Export" button on its Creations page. Exporting creates a Windows <em>.bat</em> ' + 
            'file for download. This <em>.bat</em> file runs Google Chrome in headless mode to ' + 
            'load each card from your creation, take a screenshot, and save it to a ' + 
            'directory.</p>').appendTo(exporting);
        $('<p>Once you download the <em>.bat</em> file, double-click it to export your card images. ' + 
            'This process may take a few minutes for large sets. If you only want to export ' + 
            'specific cards, you can first edit the <em>.bat</em> file to remove cards you don\'t ' + 
            'want.</p>').appendTo(exporting);
        $('<p>If a card image isn\'t exporting properly, you can copy the export URL for ' + 
            'that card out of the <em>.bat</em> file and into your browser directly to see how it ' + 
            'loads.</p>').appendTo(exporting);
        $('<p>Finally, note that Windows always seems to prompt you before running the <em>.bat</em> ' + 
            'files. They aren\'t dangerous, but if you want to see for yourself, open them in a text ' + 
            'editor. You can always decode the base64 URL string to see the arguments it\'s sending. ' + 
            'Spoilers: it\'s just the contents of your custom cards!</p>').appendTo(exporting);

        var report = createItem('Report a problem', 'report', item);
        $('<span class="description">Clicking "Send" will navigate away from this page.</span>').appendTo(report);
        let form = $('<form method="POST" action="https://formspree.io/meromorphgames+cardbuilder@gmail.com">').appendTo(report);
        $('<div class="hpot"><label>Leave this field empty: <input name="_gotcha"></label></div>').appendTo(form);
        $('<textarea name="replyto" placeholder="Your email (optional)"></textarea>').appendTo(form);
        $('<textarea name="comments"></textarea>').appendTo(form);
        $('<div><button type="submit" value="Send">Send</button></div>').appendTo(form);
    }


    var setMenuLock = function() {
        let menu = $('.menu-main');
        let lock = !menu.hasClass('lock');
        lock ? menu.addClass('lock') : menu.removeClass('lock');
        window.localStorage.setItem('menu-hover', lock ? 'on' : 'off');
        updateMenuLockText();
    }

    var updateMenuLockText = function() {
        let menu = $('.menu-main');
        let lock = !menu.hasClass('lock');
        let toggle = menu.find('.switch.lock');
        toggle.prop('title', lock ? 'Always show menu' : 'Hide menu when a card is selected');
        toggle.text(lock ? '⬨' : '⬧'); // ⬟⬠ ⬢⬡ ⬧⬨
    }

    var setMenuDock = function() {
        let menu = $('.menu-main');
        let right = !menu.hasClass('right');
        right ? menu.addClass('right') : menu.removeClass('right');
        window.localStorage.setItem('menu-right', right ? 'on' : 'off');
        updateMenuDockText();
    }

    var updateMenuDockText = function() {
        let menu = $('.menu-main');
        let right = !menu.hasClass('right');
        let toggle = menu.find('.switch.dock');
        toggle.prop('title', 'Dock menu to {0} of screen'.format(right ? 'right' : 'top'));
        toggle.text(right ? '⬗' : '⬘'); // ◨⬒ ⬗⬘
    }

    var menuSave = function() {
        contentManager._save();
    }

    var menuJump = function() {
        let params = new URLSearchParams(window.location.search);
        let entityType = params.get('e');
        let entityName = params.get('name');

        if (entityType && entityName) {        
            let allCreations = $('.menu-main .item.creations');
            let creationsOfType = allCreations.find('.item.{0}s'.format(entityType));
            let creation = creationsOfType.find('.item#{0}'.format(clean(entityName)));
            creation.find('.name').first().trigger('click');
        } else {
            $('.menu-main .item.singles .name').first().trigger('click');
        }
    }

    var menuSettings = function() {
        $('.menu-main .item.settings .name').first().trigger('click');
    }

    var createLockBar = function(menu) {
        let bar = $('<span class="lockbar">');
        bar.appendTo(menu);

        $('<span class="label">menu</span>').appendTo(bar);
        $('<span class="gap">').appendTo(bar);
        bar = $('<span class="switches">').appendTo(bar);

        $('<span class="switch lock" title="?">?</span>').appendTo(bar).on('click', setMenuLock);
        if (window.localStorage.getItem('menu-hover') != 'off') {
            $('.menu-main').addClass('lock open');
        }
        updateMenuLockText();
        $('<span class="switch dock" title="?">?</span>').appendTo(bar).on('click', setMenuDock);
        if (window.localStorage.getItem('menu-right') != 'off') {
            menu.addClass('right');
        }
        updateMenuDockText();

        $('<span class="gap">').appendTo(bar);
        $('<span class="switch save" title="Save">◔</span>').appendTo(bar).on('click', menuSave);
        $('<span class="switch jump" title="Jump to current card">⇲</span>').appendTo(bar).on('click', menuJump);
        $('<span class="switch settings" title="Jump to settings">≡</span>').appendTo(bar).on('click', menuSettings);
    }


    var createMainMenu = function() {
        // Fill in the menu itself.
        var outer = $('.menu-main');
        outer.appendTo($('body'));
        var menu = $('<div class="item root active">');
        menu.appendTo(outer);
        var contents = $('<div class="contents">');
        contents.appendTo(menu);

        createExternals(contents);
        createCreations(contents);
        createSingles(contents);
        createOptions(contents);
        createHelp(contents);

        createLockBar(outer);

        $('.lockbar .label').click(function(e) {
            // This gets confusing.
            // If the menu object has the hover class, it means we're hovering over it and it's visible.
            // If the localStorage has menu-hover=on, that means the menu is not currently in "open" mode, so it's not visible.
            let hover = outer.hasClass('open');
            hover ? outer.removeClass('open') : outer.addClass('open');
            window.localStorage.setItem('menu-hover', hover ? 'on' : 'off');
        });
    };

    createMainMenu();

    $('body').on('keydown', e => {
        if (!$(e.target).is('[contenteditable]') && e.ctrlKey) {
            if (e.which == 39 || e.which == 37) { // Right and left.
                cycleThroughCards(e.which == 39); // True if right.
            } else if (e.which == 40 || e.which == 38) { // Down and up.
                cycleThroughRows(e.which == 40); // True if down.
            }
        }
    });
    
 
});
