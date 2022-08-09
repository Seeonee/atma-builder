jQuery(document).ready(function ($) {


    // https://github.com/dwyl/learn-to-send-email-via-google-script-html-no-server
    // https://mashe.hawksey.info/2011/10/google-spreadsheets-as-a-database-insert-with-apps-script-form-postget-submit-method/
    // https://api.jquery.com/jQuery.post/
    // https://stackoverflow.com/questions/11539411/how-to-debug-google-apps-script-aka-where-does-logger-log-log-to
    // https://developers.google.com/apps-script/reference/spreadsheet/sheet


    // Manages the stored Google Sheet.
    class DatabaseManager {
        constructor() {
            this.url = window.localStorage.getItem('db');
        }

        set(url) {
            window.localStorage.setItem('db', url);
            this.url = url;
        }

        get() {
            return this.url;
        }

        clear() {
            window.localStorage.removeItem('db');
            this.url = undefined;
        }

        post(data, callback=console.log) {
            var url = this.get();
            if (!url) {
                callback('failure', 'Link a database first');
                return;
            }
            $.post(url, {'contents': JSON.stringify(data)}, function(response) {
                var status = response.result; // 'success' or 'error'
                var more = status === 'success' ? response.data : response.error;
                try {
                    more = JSON.parse(more);
                } catch (error) {}
                // console.log(more);
                callback(status, more);
            });
        }

        // List available sets/characters.
        // callback: will be passed the response object
        list(callback) {
            this.post({
                'action': 'list'
            }, callback);
        }

        // Create a new set/character.
        // type: 'set' or 'char'
        // name: the name of the entity to look up
        // counts: map of card types to integer quantities, e.g. {'twist': 12}
        // callback: will be passed the response object
        create(type, name, counts, callback) {
            this.post({
                'action': 'create', 
                'type': type, 
                'name': name, 
                'counts': counts
            }, callback);
        }

        // Query the data for a specific set/character.
        // type: 'set' or 'char'
        // name: the name of the entity to look up
        // callback: will be passed the response object
        query(type, name, callback) {
            this.post({
                'action': 'query', 
                'type': type, 
                'name': name
            }, callback);
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
            this.post({
                'action': 'update', 
                'type': type, 
                'name': name, 
                'items': items
            }, callback);
        }

    }


    dbManager = new DatabaseManager();

 
});
