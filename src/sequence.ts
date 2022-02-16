import {
  AuthenticateFn,
  AuthenticationBindings,
  AUTHENTICATION_STRATEGY_NOT_FOUND,
  USER_PROFILE_NOT_FOUND,
} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  FindRoute,
  InvokeMethod,
  ParseParams,
  Reject,
  RequestContext,
  Send,
  SequenceActions,
  SequenceHandler,
} from '@loopback/rest';

// Tempo de video 17:10
export class MySequence implements SequenceHandler {
  constructor(
    @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(SequenceActions.PARSE_PARAMS) protected parseParams: ParseParams,
    @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(SequenceActions.SEND) public send: Send,
    @inject(SequenceActions.REJECT) public reject: Reject,
    @inject(AuthenticationBindings.AUTH_ACTION)
    private authenticateRequest: AuthenticateFn,
  ) {}

  async handle(context: RequestContext): Promise<void> {
    try {
      const {request, response} = context;
      const route = this.findRoute(request);
      await this.authenticateRequest(request);
      const args = await this.parseParams(request, route);
      const result = await this.invoke(route, args);
      this.send(response, result);
    } catch (error) {
      if (
        this.isErrorCodeAuthenticationStrategyNotFoundOrUserProfileNotFound(
          (error as any).code,
        )
      ) {
        Object.assign(error, {statusCode: 401});
      }
      this.reject(context, error as any);
    }
  }

  private isErrorCodeAuthenticationStrategyNotFoundOrUserProfileNotFound(
    code: string,
  ) {
    return (
      code === AUTHENTICATION_STRATEGY_NOT_FOUND ||
      code === USER_PROFILE_NOT_FOUND
    );
  }
}
