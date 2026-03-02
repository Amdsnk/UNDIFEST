import { createContext, useContext, useState, ReactNode } from 'react';

interface VideoData {
  url: string;
  title: string;
}

interface VideoContextType {
  selectedVideo: VideoData | null;
  setSelectedVideo: (video: VideoData | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  closeVideo: () => void;
  closeVideoAndGoHome: () => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: ReactNode }) {
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const closeVideo = () => {
    setSelectedVideo(null);
    setIsPlaying(false);
  };

  const closeVideoAndGoHome = () => {
    setSelectedVideo(null);
    setIsPlaying(false);
    // Navigate to home and scroll to video section
    window.location.href = '/#video-section';
  };

  return (
    <VideoContext.Provider
      value={{
        selectedVideo,
        setSelectedVideo,
        isPlaying,
        setIsPlaying,
        closeVideo,
        closeVideoAndGoHome,
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

