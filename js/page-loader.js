jQuery(document).ready(function ($) {


    var MODES = [
        'shrink', 
        'crafter', 
        'low-ink', 
        'no-frame', 
        'skip-linewrap-fix', 
        'mask-rounded', 
        'mask-square', 
        'spellcheck', 
        'menu-hover', 
        'menu-right'
    ];


    var checkForParameters = function() {
        var params = new URLSearchParams(window.location.search);
        MODES.forEach(function(mode) {
            let p = params.get(mode);
            if (p) {
                p == 'on' ? window.localStorage.setItem(mode, true) : window.localStorage.removeItem(mode);
                params.delete(mode);
            }
        });
        if (params.has('export') || params.has('no-menu')) {
            $('.menu-main').addClass('never');
        }
        let url = window.location.protocol + '//' + window.location.host + 
            window.location.pathname + '?' + params.toString();
        window.history.pushState({path: url}, '', url);
    }


    var updateCreationsMenu = function(entityType, entityName) {
        let root = $('.menu-main .item.root');
        let allCreations = root.find('.item.creations');
        let creationsOfType = allCreations.find('.item.{0}s'.format(entityType));
        let creation = creationsOfType.find('.item#{0}'.format(clean(entityName)));
        if (!creation.hasClass('active')) {
            creation.find('.name').first().trigger('click');
        }
        var params = new URLSearchParams(window.location.search);
        var entityType = params.get('e');
        var entityName = params.get('name');
        var cardType = params.get('type');
        var cardNum = params.get('c');
        var side = params.get('side');
        setLoadedCard(entityType, entityName, cardType, cardNum, side);
    }

    var loadCreations = function(initialize=false) {
        var params = new URLSearchParams(window.location.search);
        if (params.has('export')) {
            loadFromSnap(params.get('export'));
            return;
        }

        var entityType = params.get('e');
        var entityName = params.get('name');
        var cardType = params.get('type');
        var cardNum = params.get('c');
        var side = params.get('side');

        if (cardType && !(entityType && entityName && cardNum)) {
            cardMaker._make(cardType, side == 'back');
        }

        if (initialize) {
            contentManager.list('set', (status, data) => {
                if (status == 'success') {
                    let keys = Object.keys(data).reverse();
                    keys.forEach((key) => { addCreationToMenu('set', data[key]) });
                }
                contentManager.list('char', (status, data) => {
                    if (status == 'success') {
                        let keys = Object.keys(data).reverse();
                        keys.forEach((key) => { addCreationToMenu('char', data[key]) });
                        updateAllItemGroups();
                    }
                    if (entityType && entityName && cardType && cardNum) {
                        contentManager.query(entityType, entityName, (status, data) => {
                            if (status == 'success') {
                                updateCreationsMenu(entityType, entityName);
                                cardMaker._make(cardType, side == 'back', 
                                    entityType, entityName, '{0}-{1}'.format(cardType, cardNum), 
                                    data);
                            }
                        });
                    }
                });
            });
        } else {
            if (entityType && entityName && cardType && cardNum) {
                contentManager.query(entityType, entityName, (status, data) => {
                    if (status == 'success') {
                        updateCreationsMenu(entityType, entityName);
                        cardMaker._make(cardType, side == 'back', 
                            entityType, entityName, '{0}-{1}'.format(cardType, cardNum), 
                            data);
                    }
                });
            }
        }
    }


    checkForParameters();
    loadCreations(true);

    $(window).on('popstate', (e) => {
        loadCreations();
    });
    
 
});
