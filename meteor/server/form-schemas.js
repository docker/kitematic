FormSchema = {

  formCreateApp: {
    name: {
      label: 'app name',
      required: true,
      transforms: ['clean', 'slugify'],
      messages: {
        'uniqueAppName': "This app name is already being used."
      },
      rules: {
        uniqueAppName: true
      }
    },
    imageId: {
      label: 'image ID',
      required: true,
      transforms: ['clean'],
      messages: {
        'required': "Please pick an image.",
        'validImageId': "This image ID is invalid."
      },
      rules: {
        validImageId: true
      }
    }
  }

};

// Auto-subscribe forms
_.each(_.keys(FormSchema), function (schemaName) {
  console.log('Subscribed form schema: ' + schemaName);
  var method = {};
  method[schemaName] = function (formInput) {
    var result = formValidate(formInput, FormSchema[schemaName]);
    if (result.errors) {
      throw new Meteor.Error(400, 'Validation Failed.', result.errors);
    } else {
      return result.cleaned;
    }
  };
  Meteor.methods(method);
});
