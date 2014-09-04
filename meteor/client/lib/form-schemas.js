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
