const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API = "https://api.spotify.com/v1";

export type SpotifyAlbumSearchResult = {
  id: string;
  name: string;
  release_date: string;
  images: { url: string; width: number; height: number }[];
  artists: { name: string }[];
};

export type SpotifyAlbumDetail = SpotifyAlbumSearchResult & {
  total_tracks: number;
  external_urls: { spotify: string };
  tracks: {
    items: {
      track_number: number;
      name: string;
      duration_ms: number;
    }[];
  };
};

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

function getSpotifyCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Faltan SPOTIFY_CLIENT_ID o SPOTIFY_CLIENT_SECRET en las variables de entorno"
    );
  }

  return { clientId, clientSecret };
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt && tokenCache.accessToken) {
    return tokenCache.accessToken;
  }

  tokenCache = null;

  const { clientId, clientSecret } = getSpotifyCredentials();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify auth failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Spotify no devolvió access_token");
  }

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return tokenCache.accessToken;
}

async function spotifyFetch<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${SPOTIFY_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify API error (${res.status}): ${body}`);
  }

  return res.json();
}

export function getAlbumCoverUrl(
  images: SpotifyAlbumSearchResult["images"],
  size: "small" | "large" = "large"
) {
  if (!images?.length) return null;
  return size === "small" ? images[images.length - 1]?.url : images[0]?.url;
}

export async function searchAlbums(query: string) {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    type: "album",
    q: query.trim(),
    limit: "10",
  });

  const data = await spotifyFetch<{
    albums: { items: (SpotifyAlbumSearchResult | null)[] };
  }>(`/search?${params}`);

  return (data.albums?.items ?? []).filter(
    (item): item is SpotifyAlbumSearchResult => item !== null
  );
}

export async function getAlbum(id: string) {
  return spotifyFetch<SpotifyAlbumDetail>(`/albums/${id}`);
}

export function formatTrackDuration(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
