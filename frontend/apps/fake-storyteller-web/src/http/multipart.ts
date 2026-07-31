/**
 * Minimal `multipart/form-data` parser.
 *
 * The upload endpoints only need field values and file bytes, so this walks the
 * boundary markers directly rather than pulling in a streaming parser. Bodies
 * are already buffered in memory — this is a fake backend, uploads are small,
 * and nothing here is load bearing for production.
 */

const CRLF = "\r\n";
const HEADER_TERMINATOR = Buffer.from(CRLF + CRLF);

export interface UploadedFile {
  fieldName: string;
  fileName: string;
  contentType: string;
  bytes: Buffer;
}

export class MultipartForm {
  private readonly fields: Map<string, string>;
  private readonly files: Map<string, UploadedFile>;

  constructor(fields: Map<string, string>, files: Map<string, UploadedFile>) {
    this.fields = fields;
    this.files = files;
  }

  /** Text value of a form field, or undefined when absent. */
  field(name: string): string | undefined {
    return this.fields.get(name);
  }

  /** All text fields, for endpoints that forward an open-ended blob of settings. */
  allFields(): Record<string, string> {
    return Object.fromEntries(this.fields);
  }

  /** The file uploaded under `name`, or undefined. */
  file(name: string): UploadedFile | undefined {
    return this.files.get(name);
  }

  /**
   * The first uploaded file under any field name. Upload endpoints disagree on
   * whether the part is called `file`, `video`, `image`, or the asset kind, so
   * handlers that only care that *a* file arrived use this.
   */
  anyFile(): UploadedFile | undefined {
    for (const file of this.files.values()) {
      return file;
    }
    return undefined;
  }
}

/** Parse a buffered request body. Returns an empty form if `contentType` is not multipart. */
export function parseMultipart(body: Buffer, contentType: string | undefined): MultipartForm {
  const fields = new Map<string, string>();
  const files = new Map<string, UploadedFile>();

  const boundary = readBoundary(contentType);
  if (boundary === undefined || body.length === 0) {
    return new MultipartForm(fields, files);
  }

  for (const part of splitParts(body, boundary)) {
    const headerEnd = part.indexOf(HEADER_TERMINATOR);
    if (headerEnd < 0) {
      continue;
    }

    const headerText = part.subarray(0, headerEnd).toString("utf8");
    const content = part.subarray(headerEnd + HEADER_TERMINATOR.length);

    const fieldName = readHeaderParameter(headerText, "name");
    if (fieldName === undefined) {
      continue;
    }

    const fileName = readHeaderParameter(headerText, "filename");
    if (fileName === undefined) {
      fields.set(fieldName, content.toString("utf8"));
      continue;
    }

    files.set(fieldName, {
      fieldName,
      fileName,
      contentType: readContentType(headerText) ?? "application/octet-stream",
      bytes: content,
    });
  }

  return new MultipartForm(fields, files);
}

function splitParts(body: Buffer, boundary: string): Buffer[] {
  const delimiter = Buffer.from(`--${boundary}`);
  const parts: Buffer[] = [];

  let cursor = body.indexOf(delimiter);
  while (cursor >= 0) {
    const partStart = cursor + delimiter.length;

    // The delimiter after the final part is `--boundary--`.
    if (body.subarray(partStart, partStart + 2).toString("latin1") === "--") {
      break;
    }

    const next = body.indexOf(delimiter, partStart);
    const partEnd = next < 0 ? body.length : next;
    const part = body.subarray(partStart, partEnd);

    // Each part is preceded by a CRLF and followed by the CRLF before the next
    // delimiter; trim both so file bytes come out byte-exact.
    parts.push(trimSurroundingCrlf(part));

    if (next < 0) {
      break;
    }
    cursor = next;
  }

  return parts;
}

function trimSurroundingCrlf(part: Buffer): Buffer {
  let start = 0;
  let end = part.length;
  if (part.subarray(0, 2).toString("latin1") === CRLF) {
    start = 2;
  }
  if (part.subarray(end - 2, end).toString("latin1") === CRLF) {
    end -= 2;
  }
  return part.subarray(start, end);
}

function readBoundary(contentType: string | undefined): string | undefined {
  if (contentType === undefined || !contentType.toLowerCase().includes("multipart/form-data")) {
    return undefined;
  }
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  const boundary = match?.[1] ?? match?.[2];
  return boundary?.trim();
}

function readHeaderParameter(headerText: string, parameter: string): string | undefined {
  const pattern = new RegExp(`${parameter}=(?:"([^"]*)"|([^;\\r\\n]+))`, "i");
  const match = pattern.exec(headerText);
  const value = match?.[1] ?? match?.[2];
  return value?.trim();
}

function readContentType(headerText: string): string | undefined {
  const match = /content-type:\s*([^;\r\n]+)/i.exec(headerText);
  return match?.[1]?.trim();
}
