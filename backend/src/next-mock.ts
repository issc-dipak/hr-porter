export class NextResponse extends Response {
  static json(body: any, init?: ResponseInit) {
    return Response.json(body, init);
  }
}

export type NextRequest = Request;
