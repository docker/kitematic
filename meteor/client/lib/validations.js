var Rules = {
  minLength: function (inputValue, ruleValue) {
    return inputValue.length >= ruleValue;
  },
  uniqueAppName: function (inputValue, ruleValue) {
    if (ruleValue) {
      var existingApps = Apps.find({name: inputValue}).fetch();
      return existingApps.length === 0;
    }
  },
  validImageId: function (inputValue, ruleValue) {
    if (ruleValue) {
      var existingImage = Images.findOne(inputValue);
      if (existingImage) {
        return true;
      } else {
        return false;
      }
    }
  }
};

var Transforms = {
  clean: function (string) {
    return _(string).clean();
  },
  capitalize: function (string) {
    return _(string).capitalize();
  },
  slugify: function (string) {
    return _(string).slugify();
  },
  toLowerCase: function (string) {
    return string.toLowerCase();
  }
};

var Formats = {
  letters: /^[a-zA-Z\ \']+$/,
  alphanumeric: /^[a-zA-Z0-9\ \']+$/,
  email: /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  phone: /^\b\d{3}[\-.]?\d{3}[\-.]?\d{4}\b$/
};

var runTransforms = function (input, transforms) {
  var result = input;
  _.each(transforms, function (transform) {
    result = Transforms[transform](result);
  });
  return result;
};

var cleanForm = function (formInput, formSchema) {
  var cleanedForm = {};
  for (var name in formInput) {
    if (formSchema[name]) {
      if (formSchema[name].transforms) {
        cleanedForm[name] = runTransforms(formInput[name], formSchema[name].transforms);
      } else {
        cleanedForm[name] = formInput[name];
      }
    }
  }
  return cleanedForm;
};

var buildMessage = function (errorName, schema) {
  if (errorName === 'required') {
    if (!schema.messages || !schema.messages.required) {
      var prefix = 'a';
      if (_.contains(['a', 'e', 'i', 'o', 'u'], schema.label[0].toLowerCase())) {
        prefix = 'an';
      }
      return 'Please provide ' + prefix + ' ' + schema.label + '.';
    }
  }
  if (errorName === 'format') {
    if (!schema.messages || !schema.messages.format) {
      return 'Please provide a valid ' + schema.label + '.';
    }
  }
  return schema.messages[errorName].replace('{{label}}', schema.label);
};

var validFormat = function (input, schema) {
  return Formats[schema.format].test(input);
};

var runRules = function (inputValue, schema, errorObj, cleanedFormInput) {
  var rules = schema.rules;
  if (rules) {
    for (var name in rules) {
      if (rules.hasOwnProperty(name)) {
        var ruleValue = rules[name];
        if (!Rules[name](inputValue, ruleValue, cleanedFormInput)) {
          errorObj[name] = buildMessage(name, schema);
        }
      }
    }
  }
};

formValidate = function (formInput, formSchema) {
  var errorData = {};
  var cleanedFormInput = cleanForm(formInput, formSchema);
  for (var name in cleanedFormInput) {
    if (cleanedFormInput.hasOwnProperty(name)) {
      var errorObj = {};
      var input = cleanedFormInput[name];
      var schema = formSchema[name];
      if (schema.required) {
        if (!input) {
          errorObj.required = buildMessage('required', schema);
        }
      }
      if (input) {
        if (schema.format) {
          if (!validFormat(input, schema)) {
            errorObj.format = buildMessage('format', schema);
          }
        }
        if (schema.rules) {
          runRules(input, schema, errorObj, cleanedFormInput);
        }
      }
      if (Object.keys(errorObj).length > 0) {
        errorData[name] = errorObj;
      }
    }
  }
  if (Object.keys(errorData).length > 0) {
    return {
      errors: errorData,
      cleaned: cleanedFormInput
    };
  } else {
    return {
      cleaned: cleanedFormInput
    };
  }
};
