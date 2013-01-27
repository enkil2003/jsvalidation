/**
 * @copyright Ricardo Buquet
 * @author Ricardo Buquet - buquet.ricardo@gmail.com
 * @website http://www.clases-de-php.com.ar
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var JsValidation = JsValidation || {};
JsValidation.Form = JsValidation.Form || {};

JsValidation.Form.validate = function(form, options)
{
    var _defaultDecorators = {
        "errorDecorator": {
            "separator": "\n",
            "placement": "APPEND"
        },
        "formErrorsHelper": {
            "elementStart": "<ul><li>",
            "elementSeparator": "</li><li>",
            "elementEnd": "</li></ul>"
        },
        "options": {
            "class": "errors"
        }
    };
    
    var getDefaultDecorators = function()
    {
        return settings.getDefaultDecorators;
    }
    
    /**
     * Form id.
     * @var String.
     */
    var formId = (form.attr('id')) ? form.attr('id') : 'form';
    
    /**
     * Hookeable function called before validate an element
     * @var Function.
     */
    var _beforeValidate = function(element, errorMessages) {};
    
    /**
     * Hookeable function called after an element is mark as invalid.
     * @var Function.
     */
    var _afterInvalidElement = function(element, errorMessages) {};
    
    /**
     * Default behavior to mark an element as invalid.
     * @var Function.
     */
    var _invalid = function(element, errorMessages) {
        elementName = element.attr('id');
        var decorators = getDefaultDecorators(),
            length,
            iteration = 0,
            options
        ;
        
        if (JsValidation.Forms[formId].elements[elementName].decorators) {
            decorators = JsValidation.Forms[formId].elements[elementName].decorators;
        }
        
        errorMessagesContainer = decorators.formErrorsHelper.elementStart;
        length = errorMessages.length;
        for (var i = 0; i < length; i++) {
            errorMessagesContainer += errorMessages[i];
            iteration++;
            
            if(iteration !== length) {
                errorMessagesContainer += decorators.formErrorsHelper.elementSeparator;
            }
        }
        errorMessagesContainer += decorators.formErrorsHelper.elementEnd;
        element.parent().find('.errors').remove();
        switch(decorators.errorDecorator.placement) {
            case 'APPEND':
                element.parent().append(errorMessagesContainer);
                break;
            default:
                break;
        }
        element.parent().find('ul').attr(decorators.options).addClass('errors');
        if (settings._afterInvalidElement) {
             settings._afterInvalidElement(element, errorMessages);
        }
    };
    
    /**
     * Hookeable function called after an element is mark as valid.
     * @var Function.
     */
    var _afterValidElement = function(element) {};
    
    var _valid = function(element) {
        element.parent().find('.errors').remove();
        if (settings._afterValidElement) {
            settings._afterValidElement(element);
       }
    }
    
    var _afterFormInvalid = function() {};
    
    /**
     * Hookeable function called after submitting the form.
     * @var Function.
     */
    var _beforeSubmit = function() {};
    
    // the action begins...
    
    var settings = $.extend(
        {
            beforeValidate: _beforeValidate,
            invalid: _invalid, 
            valid: _valid,
            beforeSubmit: _beforeSubmit,
            afterFormInvalid: _afterFormInvalid,
            getDefaultDecorators: _defaultDecorators
        },
        options);
    
    settings.beforeValidate();
    var formValidates = true;
    for(var elementId in JsValidation.Forms[formId].elements) {
        var element = $("#"+elementId, form),
            formElements = JsValidation.Forms[formId].elements,
            i
        ;
        // filters
        for(var filterIndex in formElements[elementId].filters) {
            var filterName = formElements[elementId].filters[filterIndex];
            if (!JsValidation.Form.Filter[filterName]) {
                console.log("Warning: No Js Filter equivalent was found for - " + filterName +" - , skipping filter");
                continue;
            }
            element.val(JsValidation.Form.Filter[filterName](element.val()));
        }
        // validators
        var errorMessages = [];
        for(var validatorName in formElements[elementId].validators) {
            var validatorParameters = formElements[elementId].validators[validatorName];
            
            if (validatorName === 'NotRequired' && formElements[elementId].validators.NotRequired === true && element.val() === '') {
                break; // break current validation
            }
            if (!JsValidation.Form.Validator[validatorName]) {
                console.log("Warning: No Js Validator equivalent was found for - " + validatorName +" - , skipping validation rule");
                continue;
            }
            // validate
            var result = JsValidation.Form.Validator[validatorName](element.val(), validatorParameters);
            if (true !== result.isValid) {
                errorMessages.push(result.errorMessage);
                formValidates = false;
                // break chain
                if (validatorName == 'NotEmpty' && validatorParameters.breakChainOnFailure) {
                    break;
                }
                if (validatorParameters.breakChainOnFailure) {
                    break;
                }
            }
        }
        if (errorMessages.length === 0) {
            settings.valid($(element));
        } else {
            settings.invalid($(element), errorMessages);
        }
    }
    if (formValidates) {
        if (settings.beforeSubmit) {
            settings.beforeSubmit(this);
        }
    } else if (settings.afterFormInvalid) {
        settings.afterFormInvalid(form, settings); 
    }
    return formValidates;
};

JsValidation.Form.Filter = {
    StringTrim: function(value) {
        return value.replace(/^\s+|\s+$/g, '');
    },
    Int: function(value) {
        return value.replace(/[^0-9-]/g, '');
    },
    Float: function(value) {
        return value.replace(/[^0-9-\.]/g, '');
    },
    StripTags: function(value) {
        return value.replace(/(<([^>]+)>)/ig,"");
    }
};

JsValidation.Form.Validator = {
    
    // Helper functions
    
    /**
     * Retrieves the error messages from the validator params
     * @return string formatted error message
     */
    _prepareErrorMessages : function(errorMessage, value, params) {
        var messageVariables = this._prepareMessageVariables(params);
        if (null === errorMessage) {
            errorMessage = 'invalid field';
            console.log("Warning: No message was received, so 'invalid field' was placed insted");
        }
        for (var i in messageVariables) {
            if (errorMessage.replace) {
                errorMessage = errorMessage.replace('%'+i+'%', messageVariables[i]);
            }
        }
        errorMessage = errorMessage.replace('%value%', value);
        return errorMessage;
    },
    
    /**
     * Replaces place holders for real values
     *   ie: '%min% is less than N caracters long
     *   will be converted to '3' is less 6 caracters long
     * @param params object Object with message variables properties.
     *   ie: max: 50, min: 20
     * @return array Error messages variables
     */
    _prepareMessageVariables: function(params) {
        var messageVariables = [];
        for(var i in params.messageVariables) {
            messageVariables[params.messageVariables[i]] = params[params.messageVariables[i]];
        }
        return messageVariables;
    },
    
    // Concrete Validators
    NotEmpty: function(value, params) {
        var _return = {isValid: true};
        
        if (value === '' || value === null) {
            _return.isValid = false;
            if (params.message) {
                _return.errorMessage = params.message;
            } else {
                _return.errorMessage = params.messageTemplates.isEmpty;
            }
        }
        return _return;
    },
    
    EmailAddress: function(value, params) {
        var _return = {isValid: true};
        
        var emailRegex = /^([\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+\.)*[\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+@((((([a-z0-9]{1}[a-z0-9\-]{0,62}[a-z0-9]{1})|[a-z])\.)+[a-z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$/i;
        if (emailRegex.test(value)) {
            return _return;
        }
        _return.isValid = false;
        if (params.message) {
            _return.errorMessage = params.message;
        } else {
            _return.errorMessage = params.messageTemplates.emailAddressInvalid;
        }
        return _return;
    },
    
    StringLength: function(value, params) {
        var _return = {isValid: true};
        var errorMessage = null;
        
        
        if (value.length < params.min) {
            _return.isValid = false;
            if (params.messageTemplates && params.messageTemplates.stringLengthTooShort) {
                errorMessage = params.messageTemplates.stringLengthTooShort;
            }
        }
        
        if (value.length > params.max) {
            _return.isValid = false;
            if (params.messageTemplates && params.messageTemplates.stringLengthTooLong) {
                errorMessage = params.messageTemplates.stringLengthTooLong;
            }
        }
        
        if (false === _return.isValid && params.message) {
            errorMessage = params.message;
        }
        
        if (_return.isValid === false) {
            _return.errorMessage = this._prepareErrorMessages(
                errorMessage,
                value,
                params);
        }
        return _return;
    },
    
    Identical: function(value, params) {
        var _return = {isValid: true};
        var tokenValue = $('#' + params.token).val();
        if (tokenValue === '') {
            _return.isValid = false;
            if (params.messageTemplates && params.messageTemplates.missingToken) {
                errorMessage = params.messageTemplates.missingToken;
            }
        }
        if (value !== tokenValue) {
            _return.isValid = false;
            if (params.messageTemplates && params.messageTemplates.notSame) {
                errorMessage = params.messageTemplates.notSame;
            }
        }
        
        if (false === _return.isValid && params.message) {
            errorMessage = params.message;
        }
        
        if (_return.isValid === false) {
            _return.errorMessage = this._prepareErrorMessages(
                errorMessage,
                value,
                params);
        }
        return _return;
    },
    
    Extension: function(value, params) {
        var _return = {isValid: true};
        if ($.inArray(value.split('.').pop(), params.extension) === -1) {
            _return.isValid = false;
        }
        if (!_return.isValid) {
            _return.errorMessage = this._prepareErrorMessages(
                params.messageTemplates.fileExtensionFalse,
                value,
                params);
        }
        return _return;
    },
    
    Dependency: function(value, params) {
        var _return = {isValid: true};
        var tokenValue = $('#' + params.token).val();
        
        if (
            (params.addValidatorsIfTokenValueProvided && tokenValue) ||
            (!params.addValidatorsIfTokenValueProvided && !tokenValue)
        ) {
            for (validator in params.dependantRules) {
                var rules = params.dependantRules[validator];
                var returnMessage = JsValidation.Form.Validator[validator](value, rules);
                if (!returnMessage.isValid) {
                    return returnMessage;
                }
            }
        }
        return _return;
    },
    
    Between: function(value, params) {
        var _return = {isValid: true};
        value = parseInt(value);
        if (params.min > value || params.max < value) {
            _return.isValid = false;
            _return.errorMessage = this._prepareErrorMessages(
                params.message,
                value,
                params
            );
        }
        return _return;
    },
    
    LowerThanField: function(value, params) {
        var _return = {isValid: true};
        value = parseFloat(value);
        var max = parseFloat($(params.fieldSelector).val())
        if (max > value) {
            _return.isValid = false;
            _return.errorMessage = this._prepareErrorMessages(
                params.messageTemplates.higherThan,
                value,
                params
            );
        }
        return _return;
    }
};