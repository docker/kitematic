jest.autoMockOff();

describe('HubUtil Integration Tests', () => {
  describe('token refresh', () => {
    it('re-auths if the token has expired', () => {
      expect(true).toBe(true);
    });
  });

  describe('signup', () => {
    it('returns a 204 and sets localstorage data', () => {
    });
  });

  describe('login', () => {
    it('Returns a 401 with account not active string if not active', () => {

    });
    it('Returns a 401 if the password is wrong', () => {

    });
  });
});
