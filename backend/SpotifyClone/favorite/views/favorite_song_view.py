from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import FavoriteSong
from ..serializers.favorite_song_serializer import FavoriteSongSerializer
from utils.custom_response import custom_response
from music.models import Song
from user.models import User

from music.serializers.song_serializer import SongSerializer

class FavoriteSongListCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        favorites = FavoriteSong.objects.all()
        serializer = FavoriteSongSerializer(favorites, many=True)
        return custom_response(em="Fetched favorite songs", dt=serializer.data)

    def post(self, request):
        serializer = FavoriteSongSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return custom_response(em="Favorite song added", dt=serializer.data)
        return custom_response(ec=1, em="Validation failed", dt=serializer.errors)


class FavoriteSongByUserView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_id):
        favorite_songs = Song.objects.filter(favorited_by__user__id=user_id).distinct()
        serializer = SongSerializer(favorite_songs, many=True)
        return custom_response(em=f"Fetched favorite songs of user {user_id}", dt=serializer.data)

    def post(self, request, user_id):
        serializer = FavoriteSongSerializer(data=request.data, context={'user_id': user_id})
        if serializer.is_valid():
            serializer.save()
            return custom_response(em="Favorite song added", dt=serializer.data)
        return custom_response(ec=1, em="Validation failed", dt=serializer.errors)
  
    def delete(self, request, user_id):
        song_id = request.data.get("song_id")
        if not song_id:
            return custom_response(ec=1, em="Missing song_id in request body")

        try:
            favorite = FavoriteSong.objects.get(user__id=user_id, song__id=song_id)
            favorite.delete()
            return custom_response(em="Favorite song removed successfully")
        except FavoriteSong.DoesNotExist:
            return custom_response(ec=1, em="Favorite song not found")

       
class IsSongFavoritedView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_id, song_id):
        is_favorited = Song.objects.filter(id=song_id, favorited_by__user__id=user_id).exists()
        return custom_response(
            ec=0,
            em="Checked favorite status",
            dt={"song_id": song_id, "user_id": user_id, "is_favorited": is_favorited}
        )
     

class FavoriteSongBySongView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, song_id):
        count = FavoriteSong.objects.filter(song__id=song_id).count()
        return custom_response(em=f"Song {song_id} is favorited by {count} users", dt={"song_id": song_id, "favorite_count": count})
