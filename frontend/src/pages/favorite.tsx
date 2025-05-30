import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/ui/icon";
import { DataTable } from "@/components/details/data-table";
import { usePlayer } from "@/contexts/playerContext";
import { useFavorite } from "@/hooks";
import { useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/authContext";
import { useFavoriteContext } from "@/contexts/favoriteContext";

export default function FavoritePage() {
  const { getFavoriteSongsByUser, loading, error } = useFavorite();
  const { favoriteSongs } = useFavoriteContext();
  const {
    play,
    currentSong,
    isPlaying,
    isLoading,
    togglePlay,
    clearSongQueue,
    addSongToQueue,
  } = usePlayer();

  const { user } = useAuth();

  useEffect(() => {
    const fetchFavorites = async () => {
      if (user?.id) {
        await getFavoriteSongsByUser(user.id);
      }
    };

    fetchFavorites();
  }, [user]);

  const handlePlay = useCallback(() => {
    if (!favoriteSongs || favoriteSongs.length === 0) {
      console.warn("No songs available to play");
      return;
    }
    clearSongQueue();
    // Check if we're already playing from this album
    const isPlayingThisAlbum = favoriteSongs.some(
      (track) => track.id === currentSong?.id,
    );

    console.log("Is playing this album:", isPlayingThisAlbum);

    if (isPlayingThisAlbum) {
      togglePlay();
    } else {
      // Make sure the first track has an audio_file property
      const firstTrack = favoriteSongs[0];
      if (!firstTrack.audio_file) {
        console.warn("First track has no audio file:", firstTrack);
        return;
      }

      // Play the first track
      play(firstTrack);

      // Add remaining songs to queue
      if (favoriteSongs.length > 1) {
        favoriteSongs
          .slice(1)
          .filter((track) => track.audio_file) // Only add tracks with audio files
          .forEach((track) => {
            addSongToQueue(track);
          });
      }
    }
  }, [favoriteSongs, currentSong, isPlaying, play, addSongToQueue, togglePlay]);

  if (loading) {
    return (
      <div className="container space-y-8">
        {/* Skeleton for Header */}
        <div className="bg-muted flex aspect-[4] max-h-80 w-full items-end gap-4 px-[max(2%,16px)] pt-12 pb-[max(2%,16px)]">
          <Skeleton className="aspect-square w-1/5 max-w-64 min-w-32 rounded-md" />
          <div className="w-full space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>

        {/* Skeleton for Actions */}
        <div className="flex items-center gap-4 px-[max(2%,16px)]">
          <Skeleton className="h-12 w-24 rounded-full" />
        </div>

        {/* Skeleton for Table */}
        <div className="px-[max(2%,16px)]">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !favoriteSongs) {
    return (
      <div className="container px-[max(2%,16px)] py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Icon size="xl" className="text-muted-foreground mb-4">
            error_outline
          </Icon>
          <h1 className="text-2xl font-semibold">Error loading album</h1>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }

  const isAlbumPlaying =
    isPlaying && favoriteSongs.some((track) => track.id === currentSong?.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 px-[max(2%,16px)] pt-10">
        <Button
          size="lg"
          className="flex items-center gap-2 rounded-full"
          onClick={handlePlay}
          disabled={isLoading}
        >
          <Icon size="md">
            {isLoading ? "sync" : isAlbumPlaying ? "pause" : "play_arrow"}
          </Icon>
          {isLoading ? "Loading..." : isAlbumPlaying ? "Pause" : "Play"}
        </Button>
      </div>

      <div className="px-[max(2%,16px)] pb-16">
        <DataTable data={favoriteSongs} />
      </div>
    </div>
  );
}
