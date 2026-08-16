import { NextRequest } from 'next/server';
import { POST as handlerPost, GET as handlerGet } from '../route';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handlerPost(req);
}

export async function GET() {
  return handlerGet();
}
