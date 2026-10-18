import {handleApi} from '../../../lib/server.js';export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(req,ctx){return handleApi(req,(await ctx.params).action,'GET')}
export async function POST(req,ctx){return handleApi(req,(await ctx.params).action,'POST')}
