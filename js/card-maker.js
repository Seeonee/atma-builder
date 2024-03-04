jQuery(document).ready(function ($) {


    // List of twist types.
    var TWISTS = [
        'backfire', 
        'deplete', 
        'foreshadow', 
        'offer', 
        'promote', 
        'reveal', 
        'challenge', 
        'challenge-strength', 
        'challenge-flaw'
    ];
    // List of stats.
    var STATS = [
        'tough', 
        'calm', 
        'hasty', 
        'bright', 
        'sly'
    ];
    var UPGRADEABLE_STATS = STATS.concat(['health']);


    // Factory for the various card types.
    class CardMaker {
        // constructor() {}

        _make(type, back=false, entityType, entityName, id, data) {
            type = $.trim(type.toLowerCase());
            if (type == 'constructor' || type.startsWith('_')) {
                return;
            }
            try {
                var method = this[type];
            } catch (error) {
                return;
            }
            // Every card has the same outer shell.
            var card = $('<div class="card {0} {1}">'.format(type, back ? 'back' : 'front'));
            this._makeArt().appendTo(card);
            this._makeContent('comment hidden-field', 'indentable boldable italicizable underlinable multiline').appendTo(card);
            $('<span class="bg">').appendTo(card);

            // Personalize it!
            this[type + (back ? 'Back' : 'Front')](card);

            // Add a bleedframe.
            $('<img class="bleedframe" src="images/bits_bleedframe.png">').appendTo(card);

            // For now, add it to the main body element.
            var cardHolder = $('.card-holder');
            cardHolder.empty();
            card.appendTo(cardHolder);

            // Clean up art and IDs.
            if (entityType && entityName && id) {
                let root = artManager.get();
                if (root) {
                    let art = root + '{0}/{1}/{2}{3}.png'.format(clean(entityType), clean(entityName), id, back ? 'b' : '');
                    card.find('.art img').attr('src', art);
                    this._setContentText(card.find('.art-url'), art);
                } else {
                    this._setContentText(card.find('.art-url'), 'URL');
                }
                card.attr('id', id);
                card.attr('data-entityType', entityType);
                card.attr('data-entityName', entityName);
                cardPopulater._populate(card, data);
            } else {
                this._setContentText(card.find('.art-url'), 'URL');
                id = '{0}-0'.format(type);
                card.attr('id', id);
                let data = [{type: id}];
                contentManager.standalone = data;
                cardPopulater._populate(card, data);
            }
            cardRefresher.refresh(card);

            document.title = document.title.match(/^(.*?)(?::|$)/)[1];
            if (entityType) {
                document.title += ': ' + cardPopulater._name(card, data);
            } else {
                document.title += ': {0} ({1})'.format(type, back ? 'back' : 'front');
            }

            // let a = $('<div class="playtest">').appendTo(card);
            // let b = $('<div class="word">').appendTo(a);
            // b.text('playtest');
        }

        // Makers for individual (reusable) components.

        _makeArt() {
            var art = $('<span class="art">');
            var img = $('<img>');
            img.on('load', function(e) { $(this).show(); });
            img.on('error', function(e) { $(this).hide(); });
            img.appendTo(art);
            // $('<span class="eventer">').appendTo(art);
            this._makeContent('art-url hidden-field', '').appendTo(art);
            return art;
        }

        _makePlate(type) {
            var position = $('<span class="plate {0} position">'.format(type));
            $('<span class="polygon">').appendTo(position);
            return position;
        }

        _makeContent(type, subtype, editable=true) {
            var position = $('<span class="{0} position">'.format(type));
            var text = type.split(' ')[0];
            text = text.charAt(0).toUpperCase() + text.slice(1);
            var content = $('<span class="content {0}">{1}</span>'.format(subtype, text));
            content.data('empty-value', text);
            if (editable) {
                content.attr('contenteditable', 'true');
            }
            content.appendTo(position);
            return position;
        }

        _setContentText(content, text) {
            var child = content.children();
            child[0].textContent = text;
            child.data('empty-value', text);
            return content;
        }

        _addContentSpacer(content) {
            $('<div class="spacer">').prependTo(content.parent());
            return content;
        }

        _makeCost() {
            var position = $('<span class="cost tag position">');
            // $('<span class="triangle">').appendTo(position);
            // $('<span class="square">').appendTo(position);
            $('<span class="shadow"><span class="polygon"></span></span>').appendTo(position);

            this._makeContent('value', '').appendTo(position);
            this._setContentText(position.find('.value'), '0');
            this._makeContent('icon', '', false).appendTo(position);
            this._setContentText(position.find('.icon'), '{');

            return position;
        }

        _makeMidDivider() {
            var outer = $('<span class="mid-divider">');
            $.each(['left', 'right'], function(index, value) {
                var side = $('<span class="side {0}">'.format(value));
                side.appendTo(outer);
                var tag = $('<span class="tag">');
                tag.appendTo(side);
                $('<span class="shape">').appendTo(tag);
                $('<span class="bar">').appendTo(side);
            });
            return outer;
        }

        _makeHearts() {
            var position = $('<span class="healthbar position">');
            $('<span class="hearts">').appendTo(position);
            return position;
        }

        _makeStoryGoalpost() {
            var position = $('<span class="goalpost position">');
            var column = $('<span class="column">');
            column.appendTo(position);
            $('<span class="diamond">').appendTo(column);
            $('<span class="bar">').appendTo(column);
            return position;
        }

        _makeSceneGoalpost() {
            var position = $('<span class="goalpost position">');
            var column = $('<span class="column">');
            column.appendTo(position);
            $('<span class="bar">').appendTo(column);
            $('<span class="diamond">').appendTo(column);
            $('<span class="bar">').appendTo(column);
            $('<span class="or">or</span>').appendTo(position);
            return position;
        }

        _makeTwistGoalpost() {
            var position = $('<span class="goalpost position">');
            $('<span class="bar">').appendTo(position);
            return position;
        }

        _makeTwistPicker() {
            var select = $('<select class="twister">');
            $.each(TWISTS, function(i, v) {
                $('<option value="{0}">{0}</option>'.format(v, v)).appendTo(select);
            });
            $('<span class="eventer">{0}</span>'.format(TWISTS[0])).appendTo(select);
            return select;
        }

        _makeStat(stat) {
            var position = $('<span class="stat tag position {0}">'.format(stat));
            // $('<span class="triangle">').appendTo(position);
            // $('<span class="square">').appendTo(position);
            $('<span class="shadow"><span class="polygon"></span></span>').appendTo(position);

            $('<span class="img">').appendTo(position);
            $('<span class="modifier" contenteditable="true">0</span>').appendTo(position);
            $('<span class="label">{0}</span>'.format(stat)).appendTo(position);

            return position;
        }

        _makeUpgradeableStat() {
            var stat = this._makeStat('health');
            var modifier = stat.find('.modifier');
            modifier.text('1');
            modifier.attr('contenteditable', 'false');
            return stat;
        }

        _makeStatPicker() {
            var select = $('<select class="upgrader">');
            $.each(UPGRADEABLE_STATS, function(i, v) {
                $('<option value="{0}">{0}</option>'.format(v, v)).appendTo(select);
            });
            return select;
        }

        _makeSymbol() {
            var position = $('<span class="symbol position">');
            $('<span class="img">').appendTo(position);
            return position;
        }

        _makeBack(card, type, hasCost) {
            this._makePlate('top').appendTo(card);
            this._makeStripes().appendTo(card);
            if (hasCost) {
                this._makeCost().appendTo(card);
                card.find('.cost').find('.content').attr('contenteditable', false);
                card.find('.cost .value .content').text('1');
            }
            this._makeContent('back-text', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.back-text'), type);
            this._makePlate('bottom').appendTo(card);
            card.find('.comment').remove();
        }

        _makeStripes() {
            var position = $('<span class="stripes position">');
            $('<span class="upper shape">').appendTo(position);
            $('<span class="lower shape">').appendTo(position);
            return position;
        }

        _makeWidePlate() {
            var position = $('<span class="plate wide position">');
            $('<span class="polygon">').appendTo(position);
            // $('<span class="square">').appendTo(position);
            // $('<span class="triangle">').appendTo(position);
            return position;
        }

        _makeBackIcon() {
            var position = $('<span class="back-icon position">');
            $('<span class="img">').appendTo(position);
            return position;
        }

        _makeBackPortrait() {
            var position = $('<span class="back-portrait position">');
            $('<span class="mask">').appendTo(position);
            return position;
        }

        _makeBackDivider() {
            var position = $('<span class="back-divider position">');
            $('<span class="line">').appendTo(position);
            $('<span class="tag">').appendTo(position);
            return position;
        }

        _makeReferenceStat(stat, text) {
            var position = $('<span class="main position {0}">'.format(stat));
            $('<span class="img">').appendTo(position);
            var content = $('<span class="content underlinable boldable multiline">').appendTo(position);
            content.html('<u>{0}</u><br>{1}'.format(stat, text));
            return position;
        }

        _makeReferenceMove(stat, text) {
            var position = $('<span class="main position {0}">'.format(stat));

            var name = $('<span class="content move boldable uppercase">').appendTo(position);
            name.text(stat[0].toUpperCase() + stat.slice(1));

            STATS.forEach(function(v, i) {
                let a = '+{0}'.format(v);
                let b = '+<u class="{0}">{0}</u>'.format(v);
                text = text.replace(a, b)
            });
            text = text.replace('7+', '<b>7+</b>');
            var content = $('<span class="content underlinable boldable multiline">').appendTo(position);
            content.html(text);
            return position;
        }

        _makeSafetyBullet(tag, text) {
            var position = $('<div class="safety position {0}">'.format(tag));
            $('<span class="wide polygon">').appendTo(position);
            this._makeContent('safety-text', 'boldable', false).appendTo(position).find('.content').html(text);
            $('<span class="shadow"><span class="icon polygon"></span></span>').appendTo(position);
            $('<span class="img">').appendTo(position);
            return position;
        }

        _makeSafetyInsert() {
            var position = $('<div class="safety-insert position">');
            $('<span class="polygon">').appendTo(position);
            let container = $('<span class="text-container">').appendTo(position);
            this._makeContent('all', '', false).appendTo(container).find('.content').html('Tap this card<br>if anything makes<br>you uncomfortable.<br>Flip for more info.');
            return position;
        }

        _makeJourneyGoal(label) {
            var position = this._makeContent(`goal goal-${label}`, 'boldable italicizable underlinable multiline');
            // Option 2a.
            position.find('.content').addClass('numbered');
            // End option 2a.

            // Option 1.
            $('<span class="line">').appendTo(position);
            $(`<span class="tag"><span class="text">${label}</span></span>`).appendTo(position);
            // End option 1.

            // Option 1b.
            // position.addClass('variant1b');
            // End option 1b.

            // Option 1c.
            // position.addClass('variant1c');
            // $('<span class="trapezoid">').appendTo(position.find('.line'));
            // End option 1c.
            
            // Option 2.
            // $('<span class="sidebar"><span class="bar"></span><span class="diamond"><span class="inner"></span></span></span>').appendTo(position);
            // End option 2.

            return position;
        }

        // Option 1a.
        _makeJourneyBanner() {
            var position = $('<div class="banner position">');
            $('<span class="polygon"><span class="diamond-cutout"></span></span>').appendTo(position);
            this._makeContent('goal-label', '', false).appendTo(position);
            this._setContentText(position.find('.goal-label'), 'GOALS');
            return position;
        }
        // End option 1a.

        _makeMapRoute() {
            var position = $('<span class="map-route position">');
            $('<span class="line">').appendTo(position);
            return position;
        }

        _makeMapPin(label, text) {
            var position = $('<span class="main map-pin position {0}">'.format(label));
            $('<span class="img">').appendTo(position);
            var content = $('<span class="content boldable italicizable multiline">').appendTo(position);
            content.html('<u>{0}</u><br>{1}'.format(label, text));
            return position;
        }

        _makeMapStagePin(label, modifiers) {
            var position = $('<span class="main map-pin stage position stage-{0}">'.format(label));
            $('<span class="img"><span class="circle"></span><span class="triangle"></span><span class="rectangle"></span></span>').appendTo(position);
            $('<span class="content stage-name underlinable">').appendTo(position).html(`<u>stage <span class="digit">${label}</span></u>`);
            var content = $('<span class="grid content boldable italicizable">').appendTo(position);
            this._makeMapStageTextLabel('Goals:').appendTo(content);
            this._makeMapStageTextInfo(`story + <b>${modifiers[0]}</b> journey goal`).appendTo(content);
            this._makeMapStageTextLabel('Tokens:').appendTo(content);
            this._makeMapStageTextInfo(`<b>${modifiers[1]}</b> in scene 1`).appendTo(content);
            this._makeMapStageTextLabel('Players:').appendTo(content);
            this._makeMapStageTextInfo(`<b>${modifiers[2]}</b> in scene 3`).appendTo(content);
            return position;
        }
        _makeMapStageTextLabel(text) {
            return $(`<span class="label">${text}</span>`);
        }
        _makeMapStageTextInfo(text) {
            return $(`<span class="info">${text}</span>`);
        }

        _makeMapParagraph(label, text) {
            var position = $('<span class="main map-helper position {0}">'.format(label));
            $('<span class="img">').appendTo(position);
            var content = $('<span class="content boldable italicizable multiline">').appendTo(position);
            content.html('<u>{0}</u><br>{1}'.format(label, text));
            return position;
        }

        // Personalizers.

        backdropFront(card) {
            this._makePlate('top').appendTo(card);

            this._makeContent('title large', 'uppercase italicizable multiline color-first-letter').appendTo(card);
            this._makeContent('subtitle', 'uppercase').appendTo(card);
            
            this._makeMidDivider().appendTo(card);
            this._makeContent('expansion', 'uppercase').appendTo(card);

            this._makeContent('main', 'indentable boldable italicizable multiline').appendTo(card);
            this._addContentSpacer(card.find('.main .content'));

            this._makePlate('bottom').appendTo(card);
            this._makeContent('type', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.type'), 'BACKDROP');
            this._makeSymbol().appendTo(card);
        }

        backdropBack(card) {
            this._makeBack(card, 'BACKDROP');
        }

        storyFront(card) {
            this._makePlate('top').appendTo(card);

            this._makeContent('title large', 'uppercase italicizable multiline color-first-letter').appendTo(card);
            
            this._makeMidDivider().appendTo(card);
            this._makeContent('expansion', 'uppercase').appendTo(card);

            this._makeContent('main', 'indentable boldable italicizable multiline').appendTo(card);
            this._addContentSpacer(card.find('.main .content'));

            this._makeStoryGoalpost().appendTo(card);
            this._makeContent('goal-label', '', false).appendTo(card);
            this._setContentText(card.find('.goal-label'), 'GOAL');
            this._makeContent('goal main', 'boldable italicizable multiline').appendTo(card);
            this._addContentSpacer(card.find('.goal.main .content'));

            this._makePlate('bottom').appendTo(card);
            this._makeContent('type', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.type'), 'STORY');
            this._makeSymbol().appendTo(card);
        }

        storyBack(card) {
            this._makeBack(card, 'STORY');
        }

        sceneFront(card) {
            this._makePlate('top').appendTo(card);

            this._makeContent('title large', 'uppercase italicizable multiline color-first-letter').appendTo(card);
            
            this._makeMidDivider().appendTo(card);
            this._makeContent('expansion', 'uppercase').appendTo(card);

            this._makeContent('main', 'indentable boldable italicizable multiline').appendTo(card);
            this._addContentSpacer(card.find('.main .content'));

            this._makeSceneGoalpost().appendTo(card);
            this._makeContent('goal-label', '', false).appendTo(card);
            this._setContentText(card.find('.goal-label'), 'GOAL');
            this._makeContent('goal main first', 'boldable italicizable multiline').appendTo(card);
            this._addContentSpacer(card.find('.goal.main.first .content'));
            this._makeContent('goal main second', 'boldable italicizable multiline').appendTo(card);
            this._addContentSpacer(card.find('.goal.main.second .content'));

            this._makePlate('bottom').appendTo(card);
            this._makeContent('type', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.type'), 'SCENE');
            this._makeSymbol().appendTo(card);
        }

        sceneBack(card) {
            this._makeBack(card, 'SCENE');
        }

        extraFront(card) {
            this._makePlate('top').appendTo(card);

            this._makeContent('title large', 'uppercase italicizable multiline color-first-letter').appendTo(card);

            this._makeCost().appendTo(card);

            this._makeMidDivider().appendTo(card);
            this._makeContent('expansion', 'uppercase').appendTo(card);

            this._makeContent('main', 'indentable boldable italicizable multiline').appendTo(card);
            this._addContentSpacer(card.find('.main .content'));

            this._makeHearts().appendTo(card);
            this._makeContent('healthbar', '').appendTo(card);
            this._setContentText(card.children('.healthbar').eq(1), '♥');

            this._makePlate('bottom').appendTo(card);
            this._makeContent('type', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.type'), 'EXTRA');
            this._makeSymbol().appendTo(card);
        }

        extraBack(card) {
            this.starFront(card);
        }

        starFront(card) {
            card.addClass('extra');
            this.extraFront(card);
            card.find('.title .content').removeClass('multiline');
            this._makeContent('subtitle', 'uppercase').insertAfter(card.find('.title'));
            this._setContentText(card.find('.type'), 'STAR EXTRA');
        }

        starBack(card) {
            this.starFront(card);
        }

        propFront(card) {
            this._makePlate('top').appendTo(card);

            this._makeContent('title large', 'uppercase italicizable multiline color-first-letter').appendTo(card);
            
            this._makeMidDivider().appendTo(card);
            this._makeContent('expansion', 'uppercase').appendTo(card);

            this._makeContent('main', 'indentable boldable italicizable multiline').appendTo(card);
            this._addContentSpacer(card.find('.main .content'));

            this._makePlate('bottom').appendTo(card);
            this._makeContent('type', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.type'), 'PROP');
            this._makeSymbol().appendTo(card);
        }

        propBack(card) {
            this._makeBack(card, 'PROP', true);
        }

        twistFront(card) {
            this._makePlate('top').appendTo(card);

            this._makeContent('title large', 'uppercase italicizable multiline color-first-letter').appendTo(card);
            
            this._makeMidDivider().appendTo(card);
            this._makeContent('expansion', 'uppercase').appendTo(card);

            this._makeContent('main', 'indentable boldable italicizable multiline').appendTo(card);
            this._addContentSpacer(card.find('.main .content'));

            // this._makeTwistGoalpost().appendTo(card);
            // this._makeContent('label main', '', false).appendTo(card);
            // this._setContentText(card.find('.label'), 'Or create an alternate twist:');
            // this._makeContent('alternate main', 'boldable multiline', false).appendTo(card);
            // this._makeTwistPicker().appendTo(card.find('.alternate'));

            this._makePlate('bottom').appendTo(card);
            this._makeContent('type', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.type'), 'TWIST');
            this._makeSymbol().appendTo(card);
        }

        twistBack(card) {
            this._makeBack(card, 'TWIST', true);
        }

        /* Character cards are *really* different between front and back. */

        characterFront(card) {
            card.addClass('player');

            this._makePlate('top').appendTo(card);

            this._makeContent('title large', 'uppercase italicizable color-first-letter').appendTo(card);
            this._makeContent('subtitle', 'uppercase').appendTo(card);

            STATS.forEach(function(v, i) {
                this._makeStat(v).appendTo(card);
            }, this);

            this._makeMidDivider().appendTo(card);
            this._makeContent('expansion', 'uppercase').appendTo(card);
            this._setContentText(card.find('.expansion'), 'MOVE');

            this._makeContent('main', 'indentable boldable italicizable underlinable multiline').appendTo(card);
            this._addContentSpacer(card.find('.main .content'));

            this._makeHearts().appendTo(card);
            this._makeContent('healthbar', '').appendTo(card);
            this._setContentText(card.children('.healthbar').eq(1), '♥♥♥');

            this._makePlate('bottom').appendTo(card);
            this._makeContent('type', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.type'), 'CHARACTER');
            this._makeSymbol().appendTo(card);

            this._makeContent('color', '').appendTo(card);
            this._setContentText(card.find('.color'), 'ff0000');
        }

        characterBack(card) {
            card.addClass('player');

            this._makeWidePlate().appendTo(card);
            this._makeContent('title', 'uppercase color-first-letter').appendTo(card);

            this._makeContent('back-text', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.back-text'), 'CHARACTER');
            this._makeBackIcon().appendTo(card);
            this._makeBackPortrait().appendTo(card);

            this._makeContent('chapter', 'uppercase').appendTo(card);
            this._makeContent('main', 'boldable multiline').appendTo(card);
            this._addContentSpacer(card.find('.main .content'));

            this._makePlate('bottom').appendTo(card);

            this._makeContent('color', '').appendTo(card);
            this._setContentText(card.find('.color'), 'ff0000');
        }

        moveFront(card) {
            card.addClass('player');

            this._makePlate('top').appendTo(card);

            this._makeContent('title large', 'uppercase italicizable color-first-letter').appendTo(card);

            this._makeMidDivider().appendTo(card);
            this._makeContent('expansion', 'uppercase').appendTo(card);
            this._setContentText(card.find('.expansion'), 'MOVE');

            this._makeContent('main', 'indentable boldable italicizable underlinable multiline').appendTo(card);
            this._addContentSpacer(card.find('.main .content'));

            this._makePlate('bottom').appendTo(card);
            this._makeContent('type', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.type'), 'BASIC MOVE');
            this._makeSymbol().appendTo(card);

            this._makeContent('color', '').appendTo(card);
            this._setContentText(card.find('.color'), 'ff0000');
        }

        moveBack(card) {
            this.characterBack(card);
            this._makeBackDivider().insertAfter(card.find('.back-portrait'));
            card.find('.back-portrait').remove();
            this._setContentText(card.find('.back-text'), 'BASIC MOVE');
        }

        superFront(card) {
            card.addClass('move');
            this.moveFront(card);

            this._makeUpgradeableStat().insertAfter(card.find('.title'));
            this._makeStatPicker().appendTo(card.find('.stat'));

            this._setContentText(card.find('.type'), 'SUPER MOVE');
        }

        superBack(card) {
            this.moveBack(card);
            this._setContentText(card.find('.back-text'), 'SUPER MOVE');
        }

        referenceFront(card) {
            card.addClass('players');

            this._makePlate('top').appendTo(card);

            this._makeContent('title', 'uppercase').appendTo(card);
            this._setContentText(card.find('.title'), 'STAT REFERENCE');

            this._makeReferenceStat('tough', 'Physical and mental resolve. Used to power through or overwhelm what\'s in your way.').appendTo(card);
            this._makeReferenceStat('calm', 'Grace under pressure and peace of mind. Used to keep your wits about you.').appendTo(card);
            this._makeReferenceStat('hasty', 'Speed, reaction, and impulsiveness. Used to get there first, even when you shouldn\'t.').appendTo(card);
            this._makeReferenceStat('bright', 'Learning, reason, and deduction. Used to figure things out or make connections.').appendTo(card);
            this._makeReferenceStat('sly', 'Deviousness and unpredictability. Used to surprise others or thwart expectations.').appendTo(card);
            this._makeReferenceStat('health', 'Well-being. When your harm exeeds health, <b>collapse</b>; lower stats to <b>-1</b> until you find help.').appendTo(card);

            this._makePlate('bottom').appendTo(card);
            this._makeContent('type', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.type'), 'REFERENCE');
            this._makeSymbol().appendTo(card);
        }

        referenceBack(card) {
            card.addClass('players');

            this._makePlate('top').appendTo(card);

            this._makeContent('title', 'uppercase').appendTo(card);
            this._setContentText(card.find('.title'), 'DEFAULT MOVES');

            this._makeReferenceMove('rumble', 'When you <b>fight a nearby foe</b>, roll+tough or +hasty. On a 7+, harm or otherwise impact them.').appendTo(card);
            this._makeReferenceMove('barrage', 'When you <b>shoot a distant foe</b>, roll+calm or +sly. On a 7+, harm or otherwise displace them.').appendTo(card);
            this._makeReferenceMove('realize', 'When you <b>observe something</b>, roll+bright or +calm. On a 7+, the GM will tell a secret about it, and ask how you knew/noticed.').appendTo(card);
            this._makeReferenceMove('coerce', 'When you <b>persuade someone</b>, roll+sly or +tough. On a 7+, they do what you ask but might demand payment.').appendTo(card);
            this._makeReferenceMove('survive', 'When you <b>defy danger</b>, roll+hasty or +bright. On a 7+, avoid or mitigate the threat.').appendTo(card);

            this._makePlate('bottom').appendTo(card);
            this._makeContent('type', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.type'), 'REFERENCE');
            this._makeSymbol().appendTo(card);
        }

        xcardFront(card) {
            card.addClass('players');

            this._makePlate('top').appendTo(card);

            this._makeContent('title', 'uppercase').appendTo(card);
            this._setContentText(card.find('.title'), 'SAFETY TOOLS');

            this._makeContent('main', 'multiline', false).appendTo(card).find('.content').html('Games should be fun for everyone.<br><br>If content comes up that makes you uncomfortable, just <b>tap this card</b>. You don’t have to explain why.<br><br>We\'ll stop the game and talk -- in private if needed -- about how to safely restart play.');

            let bullets = $('<span class="safety-bullets"></span>').appendTo(card);
            this._makeSafetyBullet('edit', '<b>Edit</b> the scene as a group to adjust its contents.').appendTo(bullets);
            this._makeSafetyBullet('pause', '<b>Take time</b> to rest, chat, and recover.').appendTo(bullets);
            this._makeSafetyBullet('rewind', '<b>Rewind</b> to an earlier point and do things differently.').appendTo(bullets);
            this._makeSafetyBullet('fast-forward', '<b>Fast forward</b> past this moment in the story.').appendTo(bullets);

            this._makePlate('bottom').appendTo(card);
            this._makeContent('type', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.type'), 'SAFETY');
            this._makeSymbol().appendTo(card);
        }

        xcardBack(card) {
            // card.addClass('players');
            this._makeBack(card, 'xcard');
            // card.find('.back-text .content').text('CARD');
            card.find('.bottom.plate').remove();
            this._makeSafetyInsert().insertBefore(card.find('.bg'));
        }

        journeyFront(card) {
            this._makePlate('top').appendTo(card);

            this._makeContent('title large', 'uppercase italicizable multiline color-first-letter').appendTo(card);
            
            this._makeMidDivider().appendTo(card);
            this._makeContent('expansion', 'uppercase').appendTo(card);
            this._setContentText(card.find('.expansion'), 'SETUP & GOALS');

            this._makeContent('main', 'boldable italicizable underlinable multiline').appendTo(card);

            let position = card.find('.main');
            this._makeJourneyGoal(1).appendTo(position);
            this._makeJourneyGoal(2).appendTo(position);
            this._makeJourneyGoal(3).appendTo(position);
            this._addContentSpacer(card.find('.goal-3 .content'));
            position.find('.goal .content').html('<u>title</u><br>Some text including a <b>bold</b> thing.<br><i>Italic reminder words.</i>');

            // Option 1a.
            // this._makeJourneyBanner().appendTo(card.find('.goal-1 .line'));
            // card.find('.goal-1').addClass('variant1a');
            // End option 1a.

            // Option 1d.
            // this._makeJourneyBanner().appendTo(card.find('.goal-1 .line'));
            // card.find('.goal-1').addClass('variant1d');
            // End option 1d.

            // Option 2b.
            // card.find('.goal').addClass('variant2b');
            // End option 2b.

            // Option 2c.
            // this._makeContent('goal-label', '', false).appendTo(card.find('.goal-2'));
            // this._setContentText(card.find('.goal-label'), 'GOALS');
            // End option 2c.

            // Option 2d.
            // this._makeContent('goal-label', '', false).appendTo(card.find('.goal-1'));
            // this._setContentText(card.find('.goal-label'), 'GOALS');
            // card.find('.goal').addClass('variant2d');
            // End option 2d.

            // Option 2e.
            // card.find('.goal').addClass('variant2e');
            // End option 2e.

            this._makePlate('bottom').appendTo(card);
            this._makeContent('type', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.type'), 'JOURNEY');
            this._makeSymbol().appendTo(card);
        }

        journeyBack(card) {
            card.addClass('player'); // Needed for styling.

            this._makeWidePlate().appendTo(card);
            this._makeContent('title', 'uppercase color-first-letter').appendTo(card);

            this._makeContent('back-text', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.back-text'), 'JOURNEY');
            this._makeBackIcon().appendTo(card);
            // this._makeBackPortrait().appendTo(card);
            this._makeBackDivider().appendTo(card);

            this._makeContent('chapter', 'uppercase').appendTo(card);
            this._makeContent('main', 'boldable italicizable underlinable indentable multiline').appendTo(card);
            this._addContentSpacer(card.find('.main .content'));

            this._makePlate('bottom').appendTo(card);
        }

        mapFront(card) {
            card.addClass('players');

            this._makePlate('top').appendTo(card);

            this._makeContent('title', 'uppercase').appendTo(card);
            this._setContentText(card.find('.title'), 'CAMPAIGN MAP');

            this._makeMapRoute().appendTo(card);
            this._makeMapPin('setup', '<b>GM</b>: Choose a journey; read its light side, then flip it. Choose 3 stages.<br><br>' + 
                                      '<b>Players</b>: Choose characters. Begin with 1 extra super move (locked). New moves only unlock in scene 3.').appendTo(card);
            this._makeMapStagePin(1, ['1st', '+0', 'basic move']).appendTo(card);
            this._makeMapStagePin(2, ['2nd', '+2', 'super move']).appendTo(card);
            this._makeMapStagePin(3, ['3rd', '+4', 'super move']).appendTo(card);
            this._makeMapPin('conclusion', 'Narrate the journey\'s epilogue.').appendTo(card);

            this._makePlate('bottom').appendTo(card);
            this._makeContent('type', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.type'), 'CAMPAIGN');
            this._makeSymbol().appendTo(card);
        }

        mapBack(card) {
            card.addClass('players');

            this._makePlate('top').appendTo(card);

            this._makeContent('title', 'uppercase').appendTo(card);
            this._setContentText(card.find('.title'), 'CAMPAIGN PLAY');

            this._makeContent('main', 'boldable multiline').appendTo(card).find('.content').html('<b>Journeys</b> let you connect multiple games of Atma into a larger narrative. The GM and players collaborate to link story goals into journey goals, and to preserve and expand the campaign world as they play.');

            this._makeMapParagraph('goals', 'A game only ends once the journey, story, and scene 3 goals are complete.').appendTo(card);
            this._makeMapParagraph('progression', 'In game 2, players start with both of their basic moves unlocked; their super move still unlocks in scene 3. In game 3, players start with all moves unlocked.').appendTo(card);
            this._makeMapParagraph('tokens', 'The GM gets 2 extra tokens at the start of game 2, and 4 extra tokens at the start of game 3.<br><i>Keep finished stories between sessions.</i>').appendTo(card);
            this._makeMapParagraph('continuity', 'After a stage ends, the GM and players can each choose 1 GM card in play to carry forward into the next stage.').appendTo(card);

            this._makePlate('bottom').appendTo(card);
            this._makeContent('type', 'uppercase', false).appendTo(card);
            this._setContentText(card.find('.type'), 'CAMPAIGN');
            this._makeSymbol().appendTo(card);
        }
    }


    cardMaker = new CardMaker();

 
});
