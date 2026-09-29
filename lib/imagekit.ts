import ImageKit from "@imagekit/nodejs";

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

if (!publicKey) {
  throw new Error(
    "IMAGEKIT_PUBLIC_KEY is not defined in environment variables"
  );
}

if (!privateKey) {
  throw new Error(
    "IMAGEKIT_PRIVATE_KEY is not defined in environment variables"
  );
}

if (!urlEndpoint) {
  throw new Error(
    "IMAGEKIT_URL_ENDPOINT is not defined in environment variables"
  );
}

export const imagekit = new ImageKit({
  privateKey,
});