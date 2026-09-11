// TODO(bt,2025-05-15): Remove this code

/**
 * Return the CDN origin (scheme + host + optional port, but no path)
 * See: https://web.dev/articles/url-parts
 * 
 * TODO(bt,2025-02-10): Make this easier to configure in development
 */
class CdnHostHelper {
  private static instance: CdnHostHelper;
  private readonly origin: string;

  public static getInstance(): CdnHostHelper {
    if (CdnHostHelper.instance !== undefined) {
      return CdnHostHelper.instance;
    }

    const origin = 'https://cdn-2.fakeyou.com';
    const instance = new CdnHostHelper(origin);

    CdnHostHelper.instance = instance;
    return instance;
  }

  public getOrigin(): string {
    return this.origin;
  }

  private constructor(origin: string) {
    this.origin = origin;
  }
}

// TODO(bt,2025-02-10): Consolidate all of this logic.
export function GetCdnOrigin() : string {
  return CdnHostHelper.getInstance().getOrigin();
}
