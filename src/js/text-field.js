var i18nContext = require('i18n-context'),
    ieDetect = require('ie-detect');

module.exports = Em.Component.extend(require('ember-field-mixin'), {
    template: require('../templates/text-field'),

    classNameBindings: [':text-field', 'small', 'search', 'block', 'value:has-value', 'hasFocus:focus', 'grow', 'reset:has-reset', 'alignClass', 'picker1Icon:pickerfield', 'picker2Icon:dual-pickerfield', 'disabled', 'readonly', 'required', 'flexClass'],

    attributeBindings: ['style'],

    placeholder: i18nContext.tProperty('placeholder'),

    name: null,

    inputNamePrefix: '',

    inputName: function() {
        return this.get('inputNamePrefix') + this.get('name');
    }.property('name', 'inputNamePrefix'),

    disabled: false,

    readonly: false,

    inputReadonly: Em.computed.alias('readonly'),

    required: false,

    autocomplete: null,

    inputType: 'text',

    inputmode: null,

    width: null,

    flex: null,

    flexClass: function() {
        var flex = this.get('flex');
        return flex ? 'flex-'+flex : null;
    }.property('flex'),

    selectOnFocus: false,

    small: false,

    search: false,

    block: false,

    align: 'left',

    alignClass: function() {
        return this.get('align') == 'right' ? 'align-right' : null;
    }.property('align'),

    style: function() {
        var s = [],
            width = this.get('width');
        if (width) {
            s.push('width:'+width+'px;');
        }
        return s.join(' ');
    }.property('width'),

    didInsertElement: function() {
        this._super();
        var self = this,
            input = this.$('input');
        this.adjustPadding();
        input.keydown(function(e) {
            Em.run(function() {
                self.didPressKeyDown(e);
            });
        });
        input.focus(function() {
            Em.run(function() {
                self.didFocus();
            });
        });
        input.blur(function() {
            Em.run(function() {
                self.didBlur();
            });
        });
        //IE10 has a position bug for placeholders and values
        if (ieDetect.isIe && ieDetect.version === 10) {
            var el = input.get(0),
                resetVal = function(targetEl) {
                    var value = el.value;
                    targetEl.value = '';
                    targetEl.value = value;
                };
            if (this.get('placeholder')) {
                el.placeholder = '';
                el.placeholder = this.get('placeholder');
            }
            input.on('blur', function(e) {
                resetVal(e.target);
            });
            resetVal(el);
        }
    },

    eventManager: {
        click: function(e, view) {
            e.stopPropagation();
            if (e.within('.prefix') || e.within('.suffix')) {
                view.focus();
            }
        }
    },

    willDestroy: function() {
        this._super();
        clearTimeout(this._bufferTimeout);
    },

    didPressKeyDown: function(e) {
        switch (e.keyCode) {
            case 27:
                this.didPressEscape();
                break;
        }
    },
    didPressEscape: function() {
        if (this.get('reset')) {
            this.set('inputValue', '');
        }
    },

    hasFocus: false,
    focus: function() {
        this.$('input').focus();
    },
    didFocus: function() {
        this.set('hasFocus', true);
        if (this.get('selectOnFocus')) {
            this.$('input').one('mouseup', function() { return false; });
            this.$('input').select();
        }
    },
    didBlur: function() {
        this.set('hasFocus', false);
        this.checkError();
        if (!this.get('error')) {
            this.reformatInputValue()
        }
    },

    _value: '',
    value: function(key, value) {
        if (arguments.length >= 2) {
            value = this.manipulateValue(value);
            this.set('_value', value);
            var inputValue = this.formatInputValue(value);
            this.set('_inputValue', inputValue);
        } else {
            value = this.get('_value');
        }
        return value;
    }.property('_value'),
    manipulateValue: function(value) {
        return value;
    },

    allowUnformatInputValue: true,
    _inputValue: '',
    inputValue: function(key, inputValue) {
        if (arguments.length >= 2) {
            this.set('_inputValue', inputValue);
            if (this.get('allowUnformatInputValue')) {
                var value = this.unformatInputValue(inputValue);
                this.set('_value', value);
            } else {
                if (Em.isEmpty(inputValue)) {
                    this.set('_value', null);
                }
            }
        } else {
            inputValue = this.get('_inputValue');
        }
        return inputValue;
    }.property('_inputValue'),
    inputValueDidChange: function() {
        this.resetError();
        this.updateMirror();
        this.fireBuffer();
    }.observes('inputValue'),

    formatInputValue: function(value) {
        return value;
    },
    unformatInputValue: function(inputValue) {
        return inputValue;
    },
    validateInputValue: function(inputValue) {
    },
    reformatInputValue: function() {
        this.set('_inputValue', this.formatInputValue(this.get('value')));
    }.on('didInsertElement'),
    checkError: function() {
        try {
            this.validateInputValue(this.get('inputValue'));
        } catch (e) {
            this.set('error', e.message);
        }
    },
    resetError: function() {
        this.set('error', null);
    },

    bufferDelay: 200,
    _bufferedValue: null,
    bufferedValue: function(key, bufferedValue) {
        if (arguments.length >= 2) {
            this.set('value', bufferedValue);
            this.set('_bufferedValue', bufferedValue);
            return bufferedValue;
        } else {
            return this.get('_bufferedValue');
        }
    }.property('_bufferedValue'),
    fireBuffer: function() {
        var self = this;
        clearTimeout(this._bufferTimeout);
        this._bufferTimeout = Em.run.later(function() {
            self.set('_bufferedValue', self.get('inputValue'));
        }, this.get('bufferDelay'));
    },

    grow: false,
    mirrorValue: null,
    updateMirror: function() {
        if (this.get('grow')) {
            this.set('mirrorValue', this.get('inputValue') || this.get('placeholder') || ' ');
        }
    }.on('didInsertElement'),

    icon: function() {
        return this.get('search') ? 'icons/magnifier' : null;
    }.property('search'),

    iconIsSvg: function() {
        var icon = this.get('icon');
        return (icon && !icon.match(/\.(png|jpg)$/));
    }.property('icon'),

    prefix: i18nContext.tProperty('prefix'),
    suffix: i18nContext.tProperty('suffix'),

    pickerPosition: 'post',
    picker1Icon: null,
    picker2Icon: null,
    hasPickerPre: function() {
        return (this.get('picker1Icon') && this.get('pickerPosition') == 'pre');
    }.property('picker1Icon', 'pickerPosition'),
    hasPickerPost: function() {
        return (this.get('picker1Icon') && this.get('pickerPosition') == 'post');
    }.property('picker1Icon', 'pickerPosition'),

    hasPreCt: function() {
        return (this.get('prefix') || this.get('hasPickerPre') || this.get('icon'));
    }.property('prefix', 'hasPickerPre', 'icon'),
    hasPostCt: function() {
        return (this.get('suffix') || this.get('reset') || this.get('hasPickerPost'));
    }.property('suffix', 'reset', 'hasPickerPost'),

    actions: {
        didClickPreOrPostCt: function() {
            this.focus();
        },

        didClickPicker1: function() {
            if (!this.get('disabled') && !this.get('readonly')) {
                this.didClickPicker1();
            }
        },

        didClickPicker2: function() {
            if (!this.get('disabled') && !this.get('readonly')) {
                this.didClickPicker2();
            }
        },

        didClickReset: function() {
            this.set('value', '');
            this.focus();
        }
    },

    didClickPicker1: Em.K,

    didClickPicker2: Em.K,

    getDefaultPadding: function() {
        if (!this.defaultPadding) {
            this.defaultPadding = this.$('input').css('paddingLeft');
        }
        return this.defaultPadding
    },
    adjustPadding: function() {
        if (this.get('state') != 'inDOM') {
            return;
        }
        var input = this.$('input'),
            mirror = this.$('.mirror'),
            preCt = this.$('.pre-ct'),
            postCt = this.$('.post-ct'),
            defaultPadding = this.getDefaultPadding(),
            left = preCt.length ? preCt.width() : defaultPadding,
            right = postCt.length ? postCt.width() : defaultPadding;
        var css = {
            paddingLeft: left,
            paddingRight: right
        };
        input.css(css);
        if (mirror.length) {
            mirror.css(css);
        }
    },
    paddingDependenciesDidChange: function() {
        Em.run.schedule('afterRender', this, this.adjustPadding);
    }.observes('prefix', 'suffix', 'reset', 'picker1Icon', 'icon'),

    innerTextFieldClass: require('./inner-text-field')
});