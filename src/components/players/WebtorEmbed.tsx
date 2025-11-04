import { useEffect, useRef, useState } from "react";

interface WebtorEmbedProps {
  magnet: string;
  title: string;
  subtitles?: { label?: string; lang: string; url: string }[];
  imdbId?: string;
}

const ensureWebtorScript = () => {
  if (document.getElementById("webtor-embed-sdk")) return;
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@webtor/embed-sdk-js/dist/index.min.js";
  s.async = true;
  s.defer = true;
  s.id = "webtor-embed-sdk";
  s.charset = "utf-8";
  document.head.appendChild(s);
};

const WebtorEmbed = ({ magnet, title, subtitles, imdbId }: WebtorEmbedProps) => {
  const idRef = useRef(`webtor-player-${Math.random().toString(36).slice(2)}`);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureWebtorScript();

    const subTracks = (subtitles || []).map((s) => ({
      srclang: s.lang,
      label: s.label || s.lang.toUpperCase(),
      src: s.url,
    }));

    const tryInit = () => {
      (window as any).webtor = (window as any).webtor || [];
      (window as any).webtor.push({
        id: idRef.current,
        magnet,
        title,
        subtitles: subTracks,
        lang: "en",
        imdbId,
        on: (e: any) => {
          const name = e?.name || e;
          if (name === (window as any).webtor?.TORRENT_FETCHED || name === "READY") {
            setReady(true);
          }
          if (name === (window as any).webtor?.TORRENT_ERROR) {
            console.error("Webtor torrent error");
          }
        },
      });
    };

    // If SDK already loaded, queue will be processed automatically
    // Give the script a tick if it just got injected
    const t = setTimeout(tryInit, 50);
    return () => clearTimeout(t);
  }, [magnet, title, imdbId, JSON.stringify(subtitles)]);

  return (
    <div className="w-full h-full relative">
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-black/90 text-white text-sm">Preparing stream…</div>
      )}
      <div id={idRef.current} className="w-full h-full" />
    </div>
  );
};

export default WebtorEmbed;
