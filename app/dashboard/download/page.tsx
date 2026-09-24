import DownloadsGrid from "@/components/dashboard/DownloadsGrid";

// Alias of /dashboard/downloads — kept as its own route because the
// sidebar's "Account" section links here, but both render the same grid
// so the content never has to be maintained in two places.
export default function DownloadPage() {
  return <DownloadsGrid />;
}
