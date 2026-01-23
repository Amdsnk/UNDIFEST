import { createContext, useContext, useState, ReactNode } from 'react';

interface VideoContextType {
  selectedVideo: string | null;
  setSelectedVideo: (video: string | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  closeVideo: () => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: ReactNode }) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const closeVideo = () => {
    setSelectedVideo(null);
    setIsPlaying(false);
  };

  return (
    <VideoContext.Provider
      value={{
        selectedVideo,
        setSelectedVideo,
        isPlaying,
        setIsPlaying,
        closeVideo,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
}

export function useVideo() {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
}

