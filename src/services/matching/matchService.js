import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { EMPTY_MATCH_PREFERENCES, hasMatchPreferences } from "../../constants/matchPreferences";
import { computeCompatibility } from "../../utils/computeCompatibility";

// matchProfiles/{uid}: preferencias de juego + copia de los ids de juegos
// favoritos y la región (para acotar la búsqueda con array-contains-any).
// No está en users porque users solo lo lee su dueño, ni en publicProfiles
// porque esto no debe leerse sin sesión. No se muestra en ningún perfil:
// solo se usa para calcular la compatibilidad. Reglas en firestore.rules.
export const matchProfileRef = (userId) => doc(db, "matchProfiles", userId);

// Límite real de array-contains-any
const MAX_QUERY_GAMES = 10;
const DEFAULT_CANDIDATES = 50;
const DEFAULT_RESULTS = 20;

// Solo los campos conocidos, en el formato que validan las reglas
export const normalizePreferences = (preferences = {}) => ({
  schedule: [...(preferences.schedule ?? [])],
  platforms: [...(preferences.platforms ?? [])],
  requiresMic: typeof preferences.requiresMic === "boolean" ? preferences.requiresMic : null,
  groupSize: preferences.groupSize ?? null,
  skillLevel: preferences.skillLevel ?? null,
  languages: [...(preferences.languages ?? [])],
  values: [...(preferences.values ?? [])]
});

export const toGameIds = (games = []) => games.map((game) => String(game.id));

// Lo que se escribe en matchProfiles junto con el resto del perfil (mismo
// batch en profileService.updateUserProfile, así juegos y región no se
// desincronizan). null = sin preferencias: el documento se borra.
export const buildMatchProfile = ({ preferences, games, region }) =>
  hasMatchPreferences(preferences)
    ? {
        preferences: normalizePreferences(preferences),
        gameIds: toGameIds(games),
        region: region || null,
        updatedAt: serverTimestamp()
      }
    : null;

// Mis preferencias, en vivo. Sin documento: EMPTY_MATCH_PREFERENCES
const subscribeToMatchProfile = (userId, onSuccess, onError) =>
  onSnapshot(
    matchProfileRef(userId),
    (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : null;
      onSuccess({
        exists: Boolean(data),
        preferences: normalizePreferences(data?.preferences ?? EMPTY_MATCH_PREFERENCES),
        gameIds: data?.gameIds ?? [],
        region: data?.region ?? null
      });
    },
    onError
  );

// Jugadores compatibles, del más al menos compatible.
// myProfile: mi matchProfile ({ preferences, gameIds, region }).
// excludeIds: amigos y bloqueados (los resuelve el hook).
//
// Sin al menos un juego favorito no hay forma de acotar la búsqueda en
// Firestore: en ese caso no se sugiere a nadie (no se traen usuarios al
// azar). Solo los primeros 10 juegos acotan la consulta (límite de
// array-contains-any); el puntaje sí usa todos.
//
// El cálculo es en el cliente a propósito: a esta escala es lo simple. Si
// crece mucho, sería candidato a una función que precalcule los matches.
const findCompatibleCandidates = async (
  currentUserId,
  myProfile,
  excludeIds = [],
  { limitCandidates = DEFAULT_CANDIDATES, maxResults = DEFAULT_RESULTS } = {}
) => {
  const myGameIds = myProfile?.gameIds ?? [];
  if (!myGameIds.length || !hasMatchPreferences(myProfile?.preferences)) return [];

  // PASO 1: candidatos que comparten al menos un juego
  const snapshot = await getDocs(query(
    collection(db, "matchProfiles"),
    where("gameIds", "array-contains-any", myGameIds.slice(0, MAX_QUERY_GAMES)),
    limit(limitCandidates)
  ));

  // PASO 2: fuera yo, amigos, bloqueados y quien no configuró preferencias
  const excluded = new Set([currentUserId, ...excludeIds]);

  // PASO 3: puntaje, de mayor a menor
  return snapshot.docs
    .filter((candidate) => !excluded.has(candidate.id))
    .map((candidate) => {
      const data = candidate.data();
      const { score, matchedSignals } = computeCompatibility(myProfile, data);
      return { id: candidate.id, score, matchedSignals };
    })
    .filter((match) => match.score !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
};

export const matchService = {
  subscribeToMatchProfile,
  findCompatibleCandidates
};
