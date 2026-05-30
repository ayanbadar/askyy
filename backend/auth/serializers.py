from rest_framework import serializers


class TokenPairResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


class TokenRefreshResponseSerializer(serializers.Serializer):
    access = serializers.CharField()


class UserSerializer(serializers.Serializer):
    id = serializers.CharField()
    username = serializers.CharField()
    email = serializers.EmailField()
    name = serializers.CharField()


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField()
