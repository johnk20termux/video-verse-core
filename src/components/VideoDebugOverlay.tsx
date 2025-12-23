import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Bug, Wifi, Users, Download, Upload, HardDrive, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DebugLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

interface VideoDebugOverlayProps {
  isVisible: boolean;
  onToggle: () => void;
  peers: number;
  downloadSpeed: number;
  uploadSpeed: number;
  progress: number;
  downloaded: number;
  isLoading: boolean;
  error: string | null;
  magnetLink: string;
  logs: DebugLog[];
}

const VideoDebugOverlay = ({
  isVisible,
  onToggle,
  peers,
  downloadSpeed,
  uploadSpeed,
  progress,
  downloaded,
  isLoading,
  error,
  magnetLink,
  logs
}: VideoDebugOverlayProps) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current && isVisible) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isVisible]);

  const formatSpeed = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB/s` : `${mb.toFixed(2)} MB/s`;
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / 1024 / 1024 / 1024;
    const mb = bytes / 1024 / 1024;
    return gb >= 1 ? `${gb.toFixed(2)} GB` : `${mb.toFixed(0)} MB`;
  };

  const getHealthStatus = () => {
    if (error) return { status: 'error', label: 'Error', color: 'text-red-400' };
    if (isLoading && peers === 0) return { status: 'warning', label: 'Searching peers...', color: 'text-yellow-400' };
    if (isLoading && peers > 0) return { status: 'connecting', label: 'Buffering...', color: 'text-blue-400' };
    if (peers === 0 && downloadSpeed === 0) return { status: 'stalled', label: 'Stalled', color: 'text-orange-400' };
    if (peers > 0 && downloadSpeed > 0) return { status: 'healthy', label: 'Streaming', color: 'text-green-400' };
    return { status: 'idle', label: 'Ready', color: 'text-white' };
  };

  const health = getHealthStatus();

  const getLogIcon = (level: DebugLog['level']) => {
    switch (level) {
      case 'error': return <XCircle className="w-3 h-3 text-red-400" />;
      case 'warn': return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
      case 'success': return <CheckCircle2 className="w-3 h-3 text-green-400" />;
      default: return <Bug className="w-3 h-3 text-blue-400" />;
    }
  };

  const extractInfoHash = (magnet: string) => {
    const match = magnet.match(/xt=urn:btih:([^&]+)/i);
    return match ? match[1].slice(0, 12) + '...' : 'N/A';
  };

  return (
    <div className="absolute top-2 right-2 z-50">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-all",
          "bg-black/70 hover:bg-black/90 backdrop-blur-sm border border-white/10",
          isVisible ? "text-primary" : "text-white/60 hover:text-white"
        )}
      >
        <Bug className="w-3 h-3" />
        Debug
        {isVisible ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="mt-2 w-80 bg-black/90 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden font-mono text-xs">
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-white/80 font-semibold">Stream Diagnostics</span>
            <span className={cn("flex items-center gap-1", health.color)}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {health.label}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-1 p-2">
            {/* Peers */}
            <div className="bg-white/5 rounded p-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-white/50 text-[10px]">PEERS</p>
                <p className={cn("text-white font-bold", peers > 0 ? "text-green-400" : "text-red-400")}>
                  {peers}
                </p>
              </div>
            </div>

            {/* Download Speed */}
            <div className="bg-white/5 rounded p-2 flex items-center gap-2">
              <Download className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-white/50 text-[10px]">DOWN</p>
                <p className="text-white font-bold">{formatSpeed(downloadSpeed)}</p>
              </div>
            </div>

            {/* Upload Speed */}
            <div className="bg-white/5 rounded p-2 flex items-center gap-2">
              <Upload className="w-4 h-4 text-orange-400" />
              <div>
                <p className="text-white/50 text-[10px]">UP</p>
                <p className="text-white font-bold">{formatSpeed(uploadSpeed)}</p>
              </div>
            </div>

            {/* Downloaded */}
            <div className="bg-white/5 rounded p-2 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-white/50 text-[10px]">BUFFERED</p>
                <p className="text-white font-bold">{formatBytes(downloaded)}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-2 pb-2">
            <div className="bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-white/50 text-[10px] mt-1 text-center">{progress.toFixed(2)}% complete</p>
          </div>

          {/* Torrent Info */}
          <div className="px-2 pb-2">
            <div className="bg-white/5 rounded p-2">
              <p className="text-white/50 text-[10px] mb-1">INFO HASH</p>
              <p className="text-white/80 font-mono text-[10px] break-all">{extractInfoHash(magnetLink)}</p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="px-2 pb-2">
              <div className="bg-red-500/20 border border-red-500/30 rounded p-2">
                <div className="flex items-center gap-1 text-red-400 mb-1">
                  <XCircle className="w-3 h-3" />
                  <span className="font-semibold text-[10px]">ERROR</span>
                </div>
                <p className="text-red-300 text-[10px] break-all">{error}</p>
              </div>
            </div>
          )}

          {/* Event Log */}
          <div className="border-t border-white/10">
            <div className="px-3 py-1 text-white/50 text-[10px] flex items-center justify-between">
              <span>EVENT LOG</span>
              <span>{logs.length} events</span>
            </div>
            <div className="max-h-32 overflow-y-auto px-2 pb-2">
              {logs.length === 0 ? (
                <p className="text-white/30 text-[10px] text-center py-2">No events yet</p>
              ) : (
                logs.slice(-20).map((log, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-1.5 py-0.5 text-[10px] border-b border-white/5 last:border-0"
                  >
                    {getLogIcon(log.level)}
                    <span className="text-white/40">
                      {log.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={cn(
                      "flex-1",
                      log.level === 'error' && 'text-red-300',
                      log.level === 'warn' && 'text-yellow-300',
                      log.level === 'success' && 'text-green-300',
                      log.level === 'info' && 'text-white/70'
                    )}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoDebugOverlay;
