var functionProxy = require('function-proxy'),
    i18nContext = require('i18n-context'),
    ieDetect = require('ie-detect');

module.exports = Em.Component.extend(require('ember-field-mixin'), {
    layout: require('../templates/text-field'),

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
        return this.get('align') === 'right' ? 'align-right' : null;
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
        //Prevent loss of focus on picker click
        this.$('.picker1, .picker2').on('mousedown', functionProxy(this._preventDefaultEvent, this));
    },

    willDestroyElement: function() {
        this._super();
        this.$('.picker1, .picker2').on('mousedown', functionProxy(this._preventDefaultEvent, this));
    },

    willDestroy: function() {
        this._super();
        Em.run.cancel(this._bufferTimeout);
    },

    eventManager: {
        click: function(e, view) {
            e.stopPropagation();
            if (e.within('.prefix') || e.within('.suffix')) {
                view.focus();
            }
        }
    },

    _preventDefaultEvent: function(e) {
        e.preventDefault();
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
            this.reformatInputValue();
        }
    },

    _value: '',
    value: function(key, value) {
        if (arguments.length >= 2) {
            value = this.manipulateValue(value);
            if (value !== this.get('_value')) {
                this.set('_value', value);
                var inputValue = this.formatInputValue(value);
                this.set('_inputValue', inputValue);
            }
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
        Em.run.cancel(this._bufferTimeout);
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

    setupPickerMouseEvents: function() {
        var self = this;
        var picker1Tooltip = self.get('picker1Tooltip')
        if (picker1Tooltip) {
            this.$('.picker1').mouseenter(function() {
                self.showTooltip(picker1Tooltip)
            })
            this.$('.picker1').mouseleave(self.container.lookup('util:tooltip').scheduleHide)
        }

        var picker2Tooltip = self.get('picker2Tooltip')
        if (picker2Tooltip) {
            this.$('.picker2').mouseenter(function() {
                self.showTooltip(picker2Tooltip)
            })
            this.$('.picker2').mouseleave(self.container.lookup('util:tooltip').scheduleHide)
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

    picker1Icon: null,
    picker2Icon: null,

    picker1Tooltip: i18nContext.tProperty('picker1Tooltip'),
    picker2Tooltip: i18nContext.tProperty('picker2Tooltip'),

    hasPreCt: function() {
        return (this.get('prefix') || this.get('icon'));
    }.property('prefix', 'icon'),
    hasPostCt: function() {
        return (this.get('suffix') || this.get('reset') || this.get('picker1Icon'));
    }.property('suffix', 'reset', 'picker1Icon'),

    actions: {
        didClickPreOrPostCt: function() {
            this.focus();
        },

        didClickPicker1: function() {
            if (!this.get('disabled') && !this.get('readonly')) {
                this.sendAction('picker1Clicked')
                this.container.lookup('util:tooltip').hide()
                this.didClickPicker1();
            }
        },

        didClickPicker2: function() {
            if (!this.get('disabled') && !this.get('readonly')) {
                this.sendAction('picker2Clicked')
                this.container.lookup('util:tooltip').hide()
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

    adjustPadding: function() {
        if (this.get('_state') !== 'inDOM') {
            return;
        }

        var left = 0
        if (this.get('hasPreCt')) {
            if (this.get('prefix')) {
                left += this.$('.prefix').width() + 3 + 6
            }
            if (this.get('icon')) {
                left += 31
            }
        } else {
            left = 7
        }

        var right = 0
        if (this.get('hasPostCt')) {
            if (this.get('suffix')) {
                right += this.$('.suffix').width() + 3 + 6
            }
            if (this.get('reset')) {
                right += 28
            }
            if (this.get('picker1Icon')) {
                right += 36
            }
        } else {
            right = 7
        }

        var input = this.$('input')
        var mirror = this.$('.mirror')
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

    showTooltip: function(message) {
        this.container.lookup('util:tooltip').scheduleShow(this, message, 'topRight')
    },

    innerTextFieldClass: require('./inner-text-field')
});
