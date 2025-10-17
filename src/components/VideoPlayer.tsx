import { useEffect, useRef, useState } from "react";
import { Loader2, Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface VideoPlayerProps {
  magnetLink: string;
  title: string;
  subtitles?: { label?: string; lang: string; url: string }[];
  fileIndex?: number;
}

const VideoPlayer = ({ magnetLink, title, subtitles, fileIndex }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const clientRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [peers, setPeers] = useState(0);
  const [downloaded, setDownloaded] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [processedSubtitles, setProcessedSubtitles] = useState<{ label?: string; lang: string; url: string }[]>([]);
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState<number>(-1);
  const [loadingHint, setLoadingHint] = useState<string | null>(null);
  const [useWebtor, setUseWebtor] = useState(false);

  const convertSrtToVtt = (srt: string) => {
    return srt
      .replace(/\r/g, "")
      .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  };

  useEffect(() => {
    let revoke: string[] = [];
    const process = async () => {
      if (!subtitles || subtitles.length === 0) {
        setProcessedSubtitles([]);
        setActiveSubtitleIndex(-1);
        return;
      }
      const results = await Promise.all(
        subtitles.map(async (s) => {
          try {
            if (s.url.toLowerCase().endsWith(".srt")) {
              const res = await fetch(s.url);
              const text = await res.text();
              const vtt = `WEBVTT\n\n${convertSrtToVtt(text)}`;
              const blob = new Blob([vtt], { type: "text/vtt" });
              const url = URL.createObjectURL(blob);
              revoke.push(url);
              return { label: s.label, lang: s.lang, url };
            }
            return s;
          } catch {
            return s;
          }
        })
      );
      setProcessedSubtitles(results);
      setActiveSubtitleIndex(-1);
    };
    process();
    return () => revoke.forEach((u) => URL.revokeObjectURL(u));
  }, [subtitles]);

  useEffect(() => {
    if (isLoading) {
      const t = setTimeout(() => {
        setLoadingHint("No WebRTC peers yet. If it takes too long, try a different source or lower quality.");
      }, 8000);
      return () => clearTimeout(t);
    } else {
      setLoadingHint(null);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!magnetLink || !window.WebTorrent) {
      setError("WebTorrent not available");
      return;
    }

    const client = new window.WebTorrent();
    clientRef.current = client;

    setIsLoading(true);
    setError(null);

    console.log("Adding torrent:", magnetLink);

    client.add(magnetLink, { announce: [
      'wss://tracker.openwebtorrent.com',
      'wss://tracker.btorrent.xyz',
      'wss://tracker.fastcast.nz',
      'wss://tracker.webtorrent.dev'
    ] }, (torrent: any) => {
      console.log("Torrent added:", torrent.name);
      
      // Try file by index (from addon) first
      let file: any | undefined;
      if (typeof fileIndex === 'number' && torrent.files[fileIndex]) {
        file = torrent.files[fileIndex];
      }

      // If not provided or not browser-playable, prefer browser-playable files only (MP4/WebM) and pick the largest
      const playable = torrent.files
        .filter((f: any) => /\.(mp4|webm)$/i.test(f.name))
        .sort((a: any, b: any) => (b.length || 0) - (a.length || 0));

      if (!file || !/\.(mp4|webm)$/i.test(file.name)) {
        file = playable[0];
      }

      if (!file) {
        setError("No browser-playable video found in this source (need MP4/WebM)");
        setIsLoading(false);
        setUseWebtor(true);
        toast.error("Source not compatible with browser. Switching to fallback player...");
        return;
      }

      console.log("Video file found:", file.name);

      // Ensure autoplay works on most browsers
      if (videoRef.current) {
        videoRef.current.muted = true;
      }

      file.renderTo(videoRef.current!, { autoplay: true }, (err: any) => {
        if (err) {
          console.error("Error appending video:", err);
          setError(err.message);
          toast.error("Failed to load video");
          return;
        }
        
        setIsLoading(false);
        toast.success(`${title} ready to stream`);
      });

      torrent.on('download', () => {
        setProgress((torrent.progress * 100));
        setDownloadSpeed(torrent.downloadSpeed);
        setUploadSpeed(torrent.uploadSpeed);
        setPeers(torrent.numPeers);
        setDownloaded(torrent.downloaded);
      });

      torrent.on('error', (err: any) => {
        console.error('Torrent error:', err);
        setError(err.message);
        toast.error("Streaming error");
      });
    });

    client.on('error', (err: any) => {
      console.error('WebTorrent client error:', err);
      setError(err.message);
      setIsLoading(false);
      toast.error("Failed to initialize streaming");
    });

    return () => {
      if (clientRef.current) {
        clientRef.current.destroy();
      }
    };
  }, [magnetLink, title]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatSpeed = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB/s` : `${mb.toFixed(2)} MB/s`;
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / 1024 / 1024 / 1024;
    const mb = bytes / 1024 / 1024;
    return gb >= 1 ? `${gb.toFixed(2)} GB` : `${mb.toFixed(0)} MB`;
  };

  const buildWebtorUrl = (magnet: string, title: string, subs?: { label?: string; lang: string; url: string }[]) => {
    const params = new URLSearchParams();
    params.set('magnet', magnet);
    params.set('title', title);
    params.set('poster-mode', 'false');
    params.set('imdb-id', '');
    
    // Add subtitle tracks if available
    if (subs && subs.length > 0) {
      subs.forEach((sub, idx) => {
        params.set(`subtitle-${idx}`, sub.url);
        params.set(`subtitle-${idx}-label`, sub.label || sub.lang.toUpperCase());
        params.set(`subtitle-${idx}-lang`, sub.lang);
      });
    }
    
    return `https://webtor.io/embed/${encodeURIComponent(magnet)}?${params.toString()}`;
  };

  if (useWebtor) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={buildWebtorUrl(magnetLink, title, processedSubtitles)}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-gradient-to-br from-background to-accent/10 rounded-lg flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-destructive mb-2">Failed to load stream</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      <video
        ref={videoRef}
        className="w-full h-full"
        crossOrigin="anonymous"
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          const mediaError = (e.currentTarget as HTMLVideoElement).error as any;
          const msg = mediaError?.message || "Failed to load because no supported source was found";
          setError(msg);
          setIsLoading(false);
          setUseWebtor(true);
          toast.error("Browser can't play this source. Switching to fallback player...");
        }}
        controls={false}
      >
        {processedSubtitles.map((s, idx) => (
          <track
            key={idx}
            kind="subtitles"
            srcLang={s.lang}
            label={s.label || s.lang.toUpperCase()}
            src={s.url}
          />
        ))}
      </video>
      
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-white mb-2">Connecting to peers...</p>
          {progress > 0 && (
            <div className="w-64 space-y-2">
              <div className="bg-white/20 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-white/80 text-sm text-center space-y-1">
                <p>{progress.toFixed(1)}% buffered • {formatBytes(downloaded)}</p>
                <div className="flex justify-center gap-4">
                  {downloadSpeed > 0 && <p>↓ {formatSpeed(downloadSpeed)}</p>}
                  {uploadSpeed > 0 && <p>↑ {formatSpeed(uploadSpeed)}</p>}
                </div>
                {peers > 0 && <p>👥 {peers} peer{peers !== 1 ? 's' : ''} connected</p>}
              </div>
            </div>
          )}
          {loadingHint && (
            <p className="text-white/70 text-xs mt-2 text-center max-w-xs">{loadingHint}</p>
          )}
        </div>
      )}

      {!isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-white hover:text-primary"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-white hover:text-primary"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (!videoRef.current) return;
                const tracks = videoRef.current.textTracks;
                for (let i = 0; i < tracks.length; i++) tracks[i].mode = 'disabled';
                if (processedSubtitles.length === 0) return;
                const next = activeSubtitleIndex + 1;
                if (next >= processedSubtitles.length) {
                  setActiveSubtitleIndex(-1);
                  return;
                }
                tracks[next].mode = 'showing';
                setActiveSubtitleIndex(next);
              }}
              className="text-white hover:text-primary"
            >
              <span className="text-xs font-semibold">CC</span>
            </Button>

            {(downloadSpeed > 0 || uploadSpeed > 0) && (
              <div className="text-white/80 text-xs ml-2 flex gap-2">
                {downloadSpeed > 0 && <span>↓ {formatSpeed(downloadSpeed)}</span>}
                {uploadSpeed > 0 && <span>↑ {formatSpeed(uploadSpeed)}</span>}
                <span>👥 {peers}</span>
              </div>
            )}

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:text-primary"
            >
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
