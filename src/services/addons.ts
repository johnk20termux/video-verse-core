import { supabase } from "@/integrations/supabase/client";

export interface StreamSource {
  title: string;
  quality?: string;
  infoHash?: string;
  magnetUri?: string;
  url?: string;
  addonName: string;
  seeders?: number;
}

interface AddonStreamResponse {
  streams?: Array<{
    title?: string;
    name?: string;
    quality?: string;
    infoHash?: string;
    magnetUri?: string;
    url?: string;
    seeders?: number;
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

    const streams = data.streams
      .filter(stream => stream.infoHash || stream.magnetUri || (stream.url?.startsWith("magnet:")))
      .map(stream => ({
        title: stream.title || stream.name || "Unknown Source",
        quality: extractQuality(stream.title || stream.name || stream.quality),
        infoHash: stream.infoHash,
        magnetUri: stream.magnetUri || (stream.url && stream.url.startsWith("magnet:") ? stream.url : undefined),
        url: stream.url,
        addonName,
        seeders: stream.seeders || extractSeeders(stream.title || stream.name) || 0,
      }));
    
    return sortStreamsByQuality(streams);
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

export interface SubtitleSource {
  lang: string;
  url: string;
  label?: string;
  addonName: string;
}

interface AddonSubtitlesResponse {
  subtitles?: Array<{
    url: string;
    lang?: string;
    id?: string;
    name?: string;
  }>;
}

export const fetchSubtitlesFromAddons = async (
  type: "movie" | "series",
  imdbId: string
): Promise<SubtitleSource[]> => {
  try {
    const { data: addons, error } = await supabase
      .from("addons")
      .select("*")
      .eq("enabled", true);

    if (error || !addons || addons.length === 0) return [];

    const results = await Promise.all(
      addons.map(async (addon: any) => {
        try {
          const baseUrl = addon.url
            .trim()
            .replace(/\/manifest(\.json)?$/i, "")
            .replace(/\/$/, "");
          const url = `${baseUrl}/subtitles/${type}/${encodeURIComponent(imdbId)}.json`;
          const res = await fetch(url, { headers: { Accept: "application/json" } });
          if (!res.ok) return [];
          const data: AddonSubtitlesResponse = await res.json();
          if (!data.subtitles) return [];
          return data.subtitles.map((s) => ({
            lang: s.lang || s.id || "en",
            url: s.url,
            label: s.name || s.lang || s.id || addon.name,
            addonName: addon.name,
          }));
        } catch (e) {
          return [];
        }
      })
    );

    return results.flat();
  } catch (e) {
    return [];
  }
};

/**
 * Extract quality from title or quality string
 */
const extractQuality = (text?: string): string => {
  if (!text) return "Unknown";
  
  const upperText = text.toUpperCase();
  
  if (upperText.includes("2160P") || upperText.includes("4K") || upperText.includes("UHD")) return "4K";
  if (upperText.includes("1080P")) return "1080p";
  if (upperText.includes("720P")) return "720p";
  if (upperText.includes("480P")) return "480p";
  
  return text;
};

/**
 * Extract seeders count from title (format: 👤 123)
 */
const extractSeeders = (text?: string): number => {
  if (!text) return 0;
  
  const match = text.match(/👤\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

/**
 * Sort streams by quality (4K first) then by seeders
 */
const sortStreamsByQuality = (streams: StreamSource[]): StreamSource[] => {
  const qualityOrder: { [key: string]: number } = {
    "4K": 4,
    "1080p": 3,
    "720p": 2,
    "480p": 1,
  };
  
  return streams.sort((a, b) => {
    // First sort by quality
    const qualityA = qualityOrder[a.quality || ""] || 0;
    const qualityB = qualityOrder[b.quality || ""] || 0;
    
    if (qualityA !== qualityB) {
      return qualityB - qualityA; // Higher quality first
    }
    
    // Then by seeders
    return (b.seeders || 0) - (a.seeders || 0);
  });
};

/**
 * Generate a magnet link from infoHash
 */
export const generateMagnetFromHash = (hash: string, name: string): string => {
  const trackers = [
    "wss://tracker.openwebtorrent.com",
    "wss://tracker.btorrent.xyz",
    "wss://tracker.fastcast.nz",
    "wss://tracker.webtorrent.dev",
  ];

  const trackersParam = trackers.map((t) => `&tr=${encodeURIComponent(t)}`).join("");
  return `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(name)}${trackersParam}`;
};
