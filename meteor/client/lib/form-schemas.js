FormSchema = {

  formCreateApp: {
    name: {
      label: 'container name',
      required: true,
      transforms: ['clean', 'slugify'],
      messages: {
        'uniqueAppName': "This container name is already being used."
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
