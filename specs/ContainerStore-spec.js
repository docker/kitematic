var ContainerStore = require('../build/ContainerStore');
var TestUtils = require('react/addons').TestUtils;

describe('ContainerStore', function() {
  it('returns an empty array initially', function() {
    expect(ContainerStore.containers()).toEqual({});
  });
});
