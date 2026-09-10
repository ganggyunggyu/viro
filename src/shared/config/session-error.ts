export class AuthenticationRequiredError extends Error {
  constructor() {
    super('로그인이 필요합니다. 다시 로그인해주세요.');
    this.name = 'AuthenticationRequiredError';
  }
}
