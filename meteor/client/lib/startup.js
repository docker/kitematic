Meteor.startup(function () {
  console.log('Kitematic started.');
  if (!fs.existsSync(KITE_PATH)) {
    console.log('Created Kitematic directory.');
    fs.mkdirSync(KITE_PATH, function (err) {
      if (err) { throw err; }
    });
  }
  if (!fs.existsSync(KITE_TAR_PATH)) {
    console.log('Created Kitematic .tar directory.');
    fs.mkdirSync(KITE_TAR_PATH, function (err) {
      if (err) { throw err; }
    });
  }
  if (!fs.existsSync(KITE_IMAGES_PATH)) {
    console.log('Created Kitematic .images directory.');
    fs.mkdirSync(KITE_IMAGES_PATH, function (err) {
      if (err) { throw err; }
    });
  }
});
