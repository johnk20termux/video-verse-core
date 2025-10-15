import { useEffect, useRef, useState } from "react";
import { Loader2, Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface VideoPlayerProps {
  magnetLink: string;
  title: string;
}

const VideoPlayer = ({ magnetLink, title }: VideoPlayerProps) => {
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

    client.add(magnetLink, (torrent: any) => {
      console.log("Torrent added:", torrent.name);
      
      const file = torrent.files.find((file: any) => 
        file.name.endsWith('.mp4') || 
        file.name.endsWith('.mkv') || 
        file.name.endsWith('.avi') ||
        file.name.endsWith('.webm')
      );

      if (!file) {
        setError("No video file found in torrent");
        setIsLoading(false);
        toast.error("No playable video file found");
        return;
      }

      console.log("Video file found:", file.name);

      file.appendTo(videoRef.current!, (err: any) => {
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
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        controls={false}
      />
      
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
