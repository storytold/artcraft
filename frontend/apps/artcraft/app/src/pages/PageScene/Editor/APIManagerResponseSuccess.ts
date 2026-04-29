/**
 * This is designed to surface user customer facing messages as errors.
 */
type Data = { [key: string]: any };
class APIManagerResponseSuccess {
  public user_message: string;
  public data: Data | null;
  constructor(user_message: string = "", data: Data | null = null) {
    this.data = data;
    this.user_message = user_message;
  }
}

export { APIManagerResponseSuccess };
