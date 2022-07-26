jQuery(document).ready(function ($) {


    // https://stackoverflow.com/questions/622122/how-can-i-change-the-css-class-rules-using-jquery
    var DEFAULT_COLOR = 'ff0000'; // Red.
    var currentColor = DEFAULT_COLOR;


    var updateCardColor = function(card, fireEvents=true) {
        var newColor = card.find('.color .content').text().match(/^[a-f\d]{6}$/i);
        if (newColor != null) {
            newColor = newColor.toString().toLowerCase();
            if (newColor != currentColor) {
                currentColor = newColor.toString();
                updateColor('#' + newColor);

                if (fireEvents) {
                    // Update any other visible cards for this character.
                    let entityType = card.attr('data-entityType');
                    let entityName = card.attr('data-entityName');
                    let cards = $('.card-holder .card[data-entityType="{0}"][data-entityName="{1}"]'.format(entityType, entityName));
                    cards.each(function() {
                        if (this != card[0]) {
                            let content = $(this).find('.color .content');
                            content.text(newColor);
                        }
                    });

                    // Update all stored cards for this character.
                    let store = contentManager.stores[entityType][entityName];
                    store.forEach((data) => {
                        cardPopulater._attemptChange(newColor, data, 'front-extra', 'color');
                        cardPopulater._attemptChange(newColor, data, 'back-extra', 'color');
                    });
                }
            }
        }
    }
    
    var updateColor = function(color) {
        var ss = document.styleSheets;
        for (var i=0; i < ss.length; i++) {
            try {
                var rules = ss[i].cssRules || ss[i].rules;
                for (var j=0; j < rules.length; j++) {
                    var rule = rules[j];
                    if (rule.selectorText.includes('.card.player') && 
                            !(rule.selectorText.includes('.low-ink'))) {
                        if (rule.selectorText.includes('.color-first-letter:not(.editing)') || 
                                rule.selectorText.includes('.card.player.back .chapter .content')) {
                            rules[j].style['color'] = color;
                        } else if (rule.selectorText.includes('.card.player .plate.bottom .shape')) {
                            rules[j].style['border-right-color'] = color;
                        } else if (rule.selectorText.includes('.card.player .plate.bottom .polygon')) {
                            rules[j].style['background-color'] = color;
                        } else if (rule.selectorText.includes('.back-divider .line') || 
                                rule.selectorText.includes('.back-divider .tag')) {
                            rules[j].style['background'] = color;
                        }
                    }
                }
            } catch (error) {}
        }
    };


    cardRefresher.register(function(card) {
        card.find('.color .content').on('change input keyup', function(e) {
            updateCardColor(card);
        });

        updateCardColor(card, false);
    });

 
});
