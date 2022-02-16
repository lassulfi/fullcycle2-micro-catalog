import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
  Authorizer,
} from '@loopback/authorization';
import {Provider} from '@loopback/context';

export class SubscriberAuthorizationProvider implements Provider<Authorizer> {
  constructor() {}

  value() {
    return this.authorize.bind(this);
  }

  async authorize(
    authorizationCtx: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ) {
    const allowedRoles = metadata.allowedRoles; // roles definidas no controller subscriber
    const userRoles = authorizationCtx.principals[0].roles; //roles do usuario
    return allowedRoles?.find(r => userRoles.includes(r))
      ? AuthorizationDecision.ALLOW
      : AuthorizationDecision.DENY;
  }
}
