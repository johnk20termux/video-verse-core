// YTS API service for fetching torrent magnet links
const YTS_API_BASE = "https://yts.mx/api/v2";

export interface YTSTorrent {
  quality: string;
  type: string;
  size: string;
  hash: string;
  url: string;
}

export interface YTSMovie {
  id: number;
  imdb_code: string;
  title: string;
  year: number;
  torrents: YTSTorrent[];
}

export const searchYTSByIMDB = async (imdbId: string): Promise<YTSMovie | null> => {
  try {
    const response = await fetch(
      `${YTS_API_BASE}/list_movies.json?query_term=${imdbId}`
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch torrents");
    }

    const data = await response.json();
    
    if (data.status === "ok" && data.data.movies && data.data.movies.length > 0) {
      return data.data.movies[0];
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching YTS torrents:", error);
    return null;
  }
};

export const generateMagnetLink = (hash: string, name: string): string => {
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
