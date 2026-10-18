import {legacyPage} from '../../lib/pages.js';export const runtime='nodejs';export async function GET(_req,ctx){const p=await ctx.params;return legacyPage(p.slug||[]);}
