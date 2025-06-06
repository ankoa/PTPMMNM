from rest_framework import permissions
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from ..models import Song
from music.models.artist import Artist
from music.models.album import Album
from ..serializers.song_serializer import SongSerializer
from core.views import BaseListCreateView, BaseRetrieveUpdateDestroyView
from utils.custom_response import custom_response
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from music.models import Song
from music.serializers.song_serializer import SongSerializer
from utils.custom_response import custom_response
from rapidfuzz import fuzz
import logging
from django.db.models import Sum, Count, Avg, Max, Min


# -------------------- SONG API --------------------

class SongListCreateView(BaseListCreateView):
    queryset = Song.objects.all()
    serializer_class = SongSerializer
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Debugging: In ra dữ liệu sau khi serialize
        print("Serialized data:", serializer.data)
        
        return custom_response(ec=0, em="Fetched songs successfully", dt=serializer.data)

    def create(self, request, *args, **kwargs):
        print("\nnDATA------:", request.data)
        serializer = self.get_serializer(data=request.data)
        print("Received data:", request.data)  # In dữ liệu yêu cầu từ client

        serializer.is_valid(raise_exception=True)
        
        # Debugging: In ra dữ liệu đã validate
        print("Validated data:", serializer.validated_data)
        
        self.perform_create(serializer)
        
        # Debugging: In ra dữ liệu sau khi lưu
        print("Saved data:", serializer.instance)

        return custom_response(ec=0, em="Song created successfully", dt=serializer.data)



class SongDetailView(BaseRetrieveUpdateDestroyView):
    queryset = Song.objects.all()
    serializer_class = SongSerializer
    permission_classes = [permissions.AllowAny]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return custom_response(ec=0, em="Fetched song detail", dt=serializer.data)

    def update(self, request, *args, **kwargs):
        print("\nnDATA------:", request.data)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        # Debugging: In ra dữ liệu đã validate
        print("Validated data:", serializer.validated_data)
        self.perform_update(serializer)
        # Debugging: In ra dữ liệu sau khi lưu
        print("Saved data:", serializer.instance)
        return custom_response(ec=0, em="Song updated successfully", dt=serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return custom_response(ec=0, em="Song deleted successfully")


class IncreasePlayCountView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, song_id):
        song = get_object_or_404(Song, id=song_id)
        song.play_count += 1
        song.save()
        return custom_response(ec=0, em="Play count updated!", dt={"play_count": song.play_count})

class TopSongsView(APIView):
    """
    API endpoint lấy top 5 bài hát có lượt nghe nhiều nhất
    """
    def get(self, request):
        songs = Song.objects.order_by('-play_count')[:5]
        serializer = SongSerializer(songs, many=True)
        return custom_response(ec=0, em="Play count updated!", dt = serializer.data)

class TopSongsViewX(APIView):
    """
    API endpoint lấy top X bài hát có lượt nghe nhiều nhất
    """
    def get(self, request):
        # Lấy tham số x từ query params, mặc định là 5 nếu không có
        x = int(request.query_params.get('x', 5))  # Mặc định là 5 bài hát
        
        # Lấy top X bài hát theo lượt nghe
        songs = Song.objects.order_by('-play_count')[:x]
        
        # Tạo danh sách dữ liệu trả về
        data = [
            {
                "id": song.id,
                "name": song.title,
                "total_play_count": song.play_count or 0
            }
            for song in songs
        ]
        
        return custom_response(ec=0, em="Fetched top songs", dt=data)
class TopArtistsByPlayCountView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        limit = int(request.query_params.get('limit', 10))

        artists = Artist.objects.annotate(
            total_play_count=Sum('songs__play_count')
        ).order_by('-total_play_count')[:limit]

        data = [
            {
                "id": artist.id,
                "name": artist.name,
                "total_play_count": artist.total_play_count or 0
            }
            for artist in artists
        ]

        return custom_response(ec=0, em="Fetched top artists", dt=data)   
""" 
logger = logging.getLogger(__name__)
logger.setLevel(logging.CRITICAL)
class SmartSearchSongView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Lấy query từ body
        query = request.data.get("q", "").strip()

        # Log dữ liệu nhận được
        logger.debug(f"Received query: {query}")

        if not query:
            logger.error("No query provided in the request body.")
            return custom_response(ec=1, em="Missing search query")

        # 1. Tìm kiếm gần đúng (fuzzy) trên nhiều trường
        matched_songs = []
        for song in Song.objects.select_related("artist", "album").prefetch_related("genres", "featuring_artists", "composers"):
            score = 0

            # So sánh query với các trường
            fields = [
                song.title,
                song.lyrics or "",
                song.artist.name,
                song.album.title if song.album else "",
                " ".join([g.name for g in song.genres.all()]),
                " ".join([a.name for a in song.featuring_artists.all()]),
                " ".join([a.name for a in song.composers.all()])
            ]

            # Tính điểm trung bình fuzzy
            field_scores = [fuzz.partial_ratio(query.lower(), f.lower()) for f in fields if f]
            if field_scores:
                score = sum(field_scores) / len(field_scores)

            if score > 50:  # Ngưỡng phù hợp
                matched_songs.append((score, song))

        matched_songs.sort(key=lambda x: x[0], reverse=True)
        top_songs = [s for _, s in matched_songs[:20]]

        # Log kết quả tìm kiếm
        logger.debug(f"Found {len(top_songs)} matched songs.")

        serializer = SongSerializer(top_songs, many=True)
        return custom_response(ec=0, em="Search results", dt=serializer.data)
 """
class SmartSearchSongView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return custom_response(ec=1, em="Missing search query")

        # ===== 1. Tìm nghệ sĩ theo tên khớp gần đúng =====
        artist_match = None
        max_artist_score = 0
        for artist in Artist.objects.all():
            score = fuzz.partial_ratio(query.lower(), artist.name.lower())
            if score > max_artist_score:
                max_artist_score = score
                artist_match = artist

        if artist_match and max_artist_score > 80:
            songs = Song.objects.filter(artist=artist_match).select_related("artist", "album").prefetch_related("genres", "featuring_artists", "composers")
            serializer = SongSerializer(songs, many=True)
            return custom_response(ec=0, em=f"Found songs by artist '{artist_match.name}'", dt=serializer.data)

        # ===== 2. Tìm album theo tên khớp gần đúng =====
        album_match = None
        max_album_score = 0
        for album in Album.objects.all():
            score = fuzz.partial_ratio(query.lower(), album.title.lower())
            if score > max_album_score:
                max_album_score = score
                album_match = album

        if album_match and max_album_score > 70:
            songs = Song.objects.filter(album=album_match).select_related("artist", "album").prefetch_related("genres", "featuring_artists", "composers")
            serializer = SongSerializer(songs, many=True)
            return custom_response(ec=0, em=f"Found songs in album '{album_match.title}'", dt=serializer.data)

        # ===== 3. Tìm gần đúng trên nhiều trường nếu không match artist hoặc album =====
        matched_songs = []
        for song in Song.objects.select_related("artist", "album").prefetch_related("genres", "featuring_artists", "composers"):
            score = 0
            fields = [
                song.title,
                song.lyrics or "",
                song.artist.name,
                song.album.title if song.album else "",
                " ".join([g.name for g in song.genres.all()]),
                " ".join([a.name for a in song.featuring_artists.all()]),
                " ".join([a.name for a in song.composers.all()])
            ]
            field_scores = [fuzz.partial_ratio(query.lower(), f.lower()) for f in fields if f]
            if field_scores:
                score = sum(field_scores) / len(field_scores)

            if score > 50:
                matched_songs.append((score, song))

        matched_songs.sort(key=lambda x: x[0], reverse=True)

        if matched_songs:
            top_artist = matched_songs[0][1].artist
            songs = Song.objects.filter(artist=top_artist).select_related("artist", "album").prefetch_related("genres", "featuring_artists", "composers")
            serializer = SongSerializer(songs, many=True)
            return custom_response(ec=0, em=f"Found songs by artist '{top_artist.name}'", dt=serializer.data)

        return custom_response(ec=0, em="No matching songs found", dt=[])

class SongSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return custom_response(ec=1, em="Missing search query")

        songs = Song.objects.filter(
            title__icontains=query
        ).select_related("artist", "album").prefetch_related("genres", "featuring_artists", "composers")

        serializer = SongSerializer(songs, many=True)
        return custom_response(ec=0, em="Search results", dt=serializer.data)
