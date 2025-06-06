import { apiClient, ApiResponse } from "./apiClient";
import { Song, SongRecommendation, ListeningHistory } from "../types";

interface CreateSongRequest {
  title: string;
  artist: number;
  featuring_artists?: number[];
  album?: number;
  genres?: number[];
  composers?: number[];
  audio_file: string | File | null;
  video_file?: string | File | null;
  duration: string;
  lyrics?: string;
  release_date?: string;
  price?: string;
  is_downloadable: boolean;
  is_premium: boolean;
  slug?: string;
}

interface UpdateSongRequest {
  title?: string;
  lyrics?: string;
  price?: string;
  is_downloadable?: boolean;
  is_premium?: boolean;
  audio_file?: string | File | null;
  video_file?: string | File | null;
  featuring_artists?: number[];
  genres?: number[];
}

interface ListeningHistoryRequest {
  user: number;
  song: number;
  listened_duration?: number;
  play_position?: number;
  completed: boolean;
}

class SongService {
  /**
   * Get all songs
   */
  async getSongs(): Promise<ApiResponse<Song[]>> {
    return apiClient.get<Song[]>("/songs/");
  }

  /**
   * Create a new song
   */
  async createSong(songData: CreateSongRequest): Promise<ApiResponse<Song>> {
    const formData = new FormData();

    Object.entries(songData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (
          (key === "genres" || key === "featuring_artists") &&
          Array.isArray(value)
        ) {
          formData.append(key, JSON.stringify(value));
        } else if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return apiClient.postForm<Song>("/songs/", formData);
  }

  /**
   * Get song by ID
   */
  async getSongById(songId: number): Promise<ApiResponse<Song>> {
    return apiClient.get<Song>(`/songs/${songId}/`);
  }

  /**
   * Update song
   */
  async updateSong(
    songId: number,
    songData: UpdateSongRequest,
  ): Promise<ApiResponse<Song>> {
    const hasFiles = songData.audio_file || songData.video_file;

    if (hasFiles) {
      const formData = new FormData();

      Object.entries(songData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (
            (key === "genres" || key === "featuring_artists") &&
            Array.isArray(value)
          ) {
            formData.append(key, JSON.stringify(value));
          } else if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      return apiClient.putForm<Song>(`/songs/${songId}/`, formData);
    }

    return apiClient.put<Song>(`/songs/${songId}/`, songData);
  }

  /**
   * Delete song
   */
  async deleteSong(songId: number): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`/songs/${songId}/`);
  }

  /**
   * Get top songs
   */
  async getTopSongs(): Promise<ApiResponse<Song[]>> {
    return apiClient.get<Song[]>("/songs/top");
  }

  /**
   * Increment play count
   */
  async incrementPlayCount(
    songId: number,
  ): Promise<ApiResponse<{ play_count: number }>> {
    return apiClient.post<{ play_count: number }>(`/songs/${songId}/play/`);
  }

  /**
   * Get song recommendations
   */
  async getSongRecommendations(): Promise<ApiResponse<SongRecommendation[]>> {
    return apiClient.get<SongRecommendation[]>("/recommendations/");
  }

  /**
   * Get listening history
   */
  async getListeningHistory(): Promise<ApiResponse<ListeningHistory[]>> {
    return apiClient.get<ListeningHistory[]>("/listening-history/");
  }

  /**
   * Create listening history entry
   */
  async createListeningHistory(
    data: ListeningHistoryRequest,
  ): Promise<ApiResponse<ListeningHistory>> {
    return apiClient.post<ListeningHistory>("/listening-history/", data);
  }

  /**
   * Admin method to create a song
   */
  async createSongAdmin(
    songData: CreateSongRequest,
  ): Promise<ApiResponse<Song>> {
    const formData = new FormData();

    Object.entries(songData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          const realKey =
            key === "genres"
              ? "genre_ids"
              : key === "featuring_artists"
                ? "featuring_artist_ids"
                : key === "composers"
                  ? "composer_ids"
                  : key;

          value.forEach((id) => formData.append(realKey, id.toString()));
        } else if (key === "artist") {
          formData.append("artist_id", value.toString());
        } else if (key === "album") {
          formData.append("album_id", value.toString());
        } else if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return apiClient.postForm<Song>("/songs/", formData);
  }

  /**
   * Admin method to update a song
   */
  async updateSongAdmin(
    songId: number,
    songData: UpdateSongRequest,
  ): Promise<ApiResponse<Song>> {
    const formData = new FormData();

    Object.entries(songData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          const realKey =
            key === "genres"
              ? "genre_ids"
              : key === "featuring_artists"
                ? "featuring_artist_ids"
                : key === "composers"
                  ? "composer_ids"
                  : key;

          value.forEach((id) => formData.append(realKey, id.toString()));
        } else if (key === "artist") {
          formData.append("artist_id", value.toString());
        } else if (key === "album") {
          formData.append("album_id", value.toString());
        } else if (key === "audio_file" && value instanceof File) {
          formData.append("audio_file", value);
        } else if (key === "video_file" && value instanceof File) {
          formData.append("video_file", value);
        } else if (key !== "audio_file" && key !== "video_file") {
          formData.append(key, value.toString());
        }
      }
    });
    console.log("neww:", formData);
    return apiClient.putForm<Song>(`/songs/${songId}/`, formData);
  }
}

export const songService = new SongService();
export default songService;
