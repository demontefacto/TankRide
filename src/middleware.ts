import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Zakázané vzory cest a pokusů o sondu citlivých souborů
const BLOCKED_PATH_PATTERNS = [
  /\.(env|git|aws|ssh|sql|bak|backup|swp|dist|config|conf)$/i,
  /^\/(wp-|wordpress|phpmyadmin|pma|adminer|setup\.php|install\.php|xmlrpc\.php)/i,
  /\.(php|asp|aspx|jsp|cgi|pl)$/i,
  /\.\./, // Path traversal
  /\/(\.well-known|actuator|telescope|telescope-api)/i,
];

// Podezřelé vzory v query parametrech (SQL Injection, XSS sondy)
const BLOCKED_QUERY_PATTERNS = [
  /union\s+(all\s+)?select/i,
  /select\s+.*from/i,
  /insert\s+into/i,
  /<script\b[^>]*>/i,
  /etc\/passwd/i,
  /proc\/self\/environ/i,
];

// Pomocná funkce pro zjištění, zda je IP privátní / lokální
function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const clean = ip.trim();
  if (['127.0.0.1', '::1', 'localhost'].includes(clean)) return true;
  if (clean.startsWith('10.') || clean.startsWith('192.168.')) return true;
  if (clean.startsWith('172.')) {
    const parts = clean.split('.');
    if (parts.length >= 2) {
      const second = parseInt(parts[1], 10);
      if (second >= 16 && second <= 31) return true;
    }
  }
  return false;
}

// Asynchronní nahlášení incidentu do Sentinel Hubu
async function reportToSentinel(ip: string, reason: string, path: string, userAgent: string) {
  const sentinelUrl = process.env.SENTINEL_REPORT_URL || 'http://agudesign_sentinel:8000/api/v1/report';
  const sentinelToken = process.env.SENTINEL_API_TOKEN || 'agu_sentinel_secret_token_change_me';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(sentinelUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentinel-Token': sentinelToken,
      },
      body: JSON.stringify({
        ip,
        project: 'tankride',
        reason,
        path,
        user_agent: userAgent,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[TankRide Shield] Sentinel vrátil stav ${res.status} pro IP ${ip}`);
    }
  } catch (err: any) {
    // Graceful fallback: Pokud Sentinel zrovna neběží, Tankride nesmí spadnout
    console.warn(`[TankRide Shield] Nepodařilo se nahlásit incident Sentinelu (${err?.message || err})`);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Kontrola podezřelých vzorů v cestě
  let matchedReason = '';
  for (const pattern of BLOCKED_PATH_PATTERNS) {
    if (pattern.test(pathname)) {
      matchedReason = `Sonda na zakázanou cestu (${pathname})`;
      break;
    }
  }

  // 2. Kontrola parametrů v URL query
  if (!matchedReason && search) {
    for (const pattern of BLOCKED_QUERY_PATTERNS) {
      if (pattern.test(search)) {
        matchedReason = `Pokus o injection v query parametru`;
        break;
      }
    }
  }

  // Pokud byl zachycen útočník
  if (matchedReason) {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : (realIp || 'unknown');
    const userAgent = request.headers.get('user-agent') || '';

    console.warn(`🚨 [TankRide Shield] Blokován útočník: IP=${clientIp}, Důvod=${matchedReason}, Cesta=${pathname}`);

    // Nahlásit Sentinelu, pokud se nejedná o lokální IP
    if (!isPrivateIp(clientIp) && clientIp !== 'unknown') {
      // Fire-and-forget hlášení na pozadí
      reportToSentinel(clientIp, matchedReason, pathname, userAgent).catch(() => {});
    }

    return new NextResponse('403 Forbidden • AGU Design Perimeter Shield', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
