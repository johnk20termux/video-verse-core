import { supabase } from "@/integrations/supabase/client";

export interface StreamSource {
  title: string;
  quality?: string;
  infoHash?: string;
  magnetUri?: string;
  url?: string;
  addonName: string;
}

interface AddonStreamResponse {
  streams?: Array<{
    title?: string;
    name?: string;
    quality?: string;
    infoHash?: string;
    magnetUri?: string;
    url?: string;
  }>;
}

/**
 * Fetch streams from a single addon
 */
const fetchAddonStreams = async (
  addonUrl: string,
  addonName: string,
  type: "movie" | "series",
  imdbId: string
): Promise<StreamSource[]> => {
  try {
    // Normalize addon URL (strip manifest paths and trailing slash)
    const baseUrl = addonUrl
      .trim()
      .replace(/\/manifest(\.json)?$/i, "")
      .replace(/\/$/, "");
    
    // Try Stremio-style addon protocol
    const streamUrl = `${baseUrl}/stream/${type}/${encodeURIComponent(imdbId)}.json`;
    
    const response = await fetch(streamUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`Addon ${addonName} returned ${response.status}`);
      return [];
    }

    const data: AddonStreamResponse = await response.json();
    
    if (!data.streams || !Array.isArray(data.streams)) {
      return [];
    }

    return data.streams
      .filter(stream => stream.infoHash || stream.magnetUri || (stream.url?.startsWith("magnet:")))
      .map(stream => ({
        title: stream.title || stream.name || "Unknown Source",
        quality: stream.quality,
        infoHash: stream.infoHash,
        magnetUri: stream.magnetUri || (stream.url && stream.url.startsWith("magnet:") ? stream.url : undefined),
        url: stream.url,
        addonName,
      }));
  } catch (error) {
    console.error(`Error fetching from addon ${addonName}:`, error);
    return [];
  }
};

/**
 * Fetch streams from all enabled user addons
 */
export const fetchStreamsFromAddons = async (
  type: "movie" | "series",
  imdbId: string
): Promise<StreamSource[]> => {
  try {
    // Get user's enabled addons
    const { data: addons, error } = await supabase
      .from("addons")
      .select("*")
      .eq("enabled", true);

    if (error) {
      console.error("Error fetching addons:", error);
      return [];
    }

    if (!addons || addons.length === 0) {
      return [];
    }

    // Fetch streams from all addons in parallel
    const streamPromises = addons.map(addon =>
      fetchAddonStreams(addon.url, addon.name, type, imdbId)
    );

    const streamArrays = await Promise.all(streamPromises);
    
    // Flatten and return all streams
    return streamArrays.flat();
  } catch (error) {
    console.error("Error fetching streams from addons:", error);
    return [];
  }
};

/**
 * Generate a magnet link from infoHash
 */
export const generateMagnetFromHash = (hash: string, name: string): string => {
  const trackers = [
    "udp://open.demonii.com:1337/announce",
    "udp://tracker.openbittorrent.com:80",
    "udp://tracker.coppersurfer.tk:6969",
    "udp://glotorrents.pw:6969/announce",
    "udp://tracker.opentrackr.org:1337/announce",
    "udp://torrent.gresille.org:80/announce",
    "udp://p4p.arenabg.com:1337",
    "udp://tracker.leechers-paradise.org:6969",
  ];

  const trackersParam = trackers.map(t => `&tr=${encodeURIComponent(t)}`).join('');
  return `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(name)}${trackersParam}`;
};
