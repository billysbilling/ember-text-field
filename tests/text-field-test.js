var eventDispatcher,
    container,
    f;

QUnit.module('Billy.TextFieldComponent', {
    setup: function() {
        eventDispatcher = Ember.EventDispatcher.create();
        eventDispatcher.setup(null, '#ember-testing');
        container = new Ember.Container();
        container.register('template:components/text-field', Ember.TEMPLATES['components/text-field'], {instantiate: false});
        container.register('component:text_field', Billy.TextFieldComponent);
    },

    teardown: function() {
        Em.run(function() {
            eventDispatcher.destroy();
            container.destroy();
            if (f) {
                f.destroy();
            }
        });
        eventDispatcher = container = f = null;
    }
});

function create(props) {
    f = container.lookup('component:text_field');
    f.setProperties(props);
}

function append(props) {
    Ember.run(function() {
        if (!f) {
            create(props);
        }
        f.appendTo('#ember-testing');
    });
}

function measureTextWidth(value) {
    var el = $('<div></div>');
    var css = f.$('input').css(['padding-left', 'padding-right', 'border-left-style', 'border-left-width', 'border-right-style', 'border-right-width', 'font-size', 'font-family', 'font-weight']);
    css.visibility = 'hidden';
    css.backgroundColor = '#ff9999';
    css.position = 'absolute';
    css.top = '40px';
    css.left = '0px';
    css.whiteSpace = 'pre';
    el.css(css);
    el.html(value);
    el.appendTo('#ember-testing');
    var w = el.outerWidth();
    el.remove();
    return w;
}

test('Initial value should be set in DOM', function() {
    create();
    Em.run(function() {
        f.set('value', 'Johnny');
    });
    append();
    equal(f.$('input').val(), 'Johnny');
});

test('Changing value should be reflected in DOM', function() {
    append();
    Ember.run(function() {
        f.set('value', 'Johnny');
    });
    equal(f.$('input').val(), 'Johnny');
});

test('User input updates value', function() {
    append();
    Ember.run(function() {
        var input = f.$('input');
        input.focus();
        sendKeys(input, 'Johnny');
    });
    equal(f.get('value'), 'Johnny');
});

test('Grow: When empty has minimum width', function() {
    append({
        grow: true
    });
    equal(f.$().width(), measureTextWidth(' '));
});

test('Grow: When empty width matches placeholder', function() {
    append({
        grow: true,
        placeholder: 'Description'
    });
    equal(f.$().width(), measureTextWidth('Description'));
});

test('Grow: Grows', function() {
    append({
        grow: true,
        value: 'a'
    });
    fillIn(f.$('input'), 'ab');
    equal(f.$().width(), measureTextWidth('ab'));
    fillIn(f.$('input'), 'abc');
    equal(f.$().width(), measureTextWidth('abc'));
    fillIn(f.$('input'), 'abc and hey and yes hey whats up yeah yeehaaa');
    equal(f.$().width(), measureTextWidth('abc and hey and yes hey whats up yeah yeehaaa'));
});