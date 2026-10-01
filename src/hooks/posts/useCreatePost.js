import { useCallback, useEffect, useState } from "react";
import { postService } from "../../services/posts";
import { formatDates, getGameDetail } from "../../utils";
import i18n from "../../i18n";

// Una fecha programada tiene que estar en el futuro
const isFuture = (date) => date instanceof Date && date.getTime() > Date.now();

export const useCreatePost = ({
  user,
  authorRegion,
  editingPost,
  onSuccess,
  onError
}) => {

  const [game, setGame] = useState({});
  // Jugadores que faltan: número (los posts viejos lo guardaban como texto)
  const [players, setPlayers] = useState(1);
  const [comments, setComments] = useState("");
  const [platform, setPlatform] = useState("");
  const [multiplatform, setMultiplatform] = useState(false);
  // Programar para después: por defecto "ahora mismo" (scheduledAt null)
  const [scheduled, setScheduledState] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(null);
  // Etiquetas opcionales: null = "sin especificar" (no es lo mismo que false)
  const [requiresMic, setRequiresMic] = useState(null);
  const [skillLevel, setSkillLevel] = useState(null);
  const [language, setLanguage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Al volver a "ahora mismo" se descarta la fecha elegida
  const setScheduled = useCallback((value) => {
    setScheduledState(value);
    if (!value) setScheduledAt(null);
  }, []);

  const resetForm = useCallback(() => {
    setGame({});
    setPlayers(1);
    setComments("");
    setPlatform("");
    setMultiplatform(false);
    setScheduledState(false);
    setScheduledAt(null);
    setRequiresMic(null);
    setSkillLevel(null);
    setLanguage(null);
  }, []);

  useEffect(() => {
    if (!editingPost) {
      resetForm();
      return;
    }

    setGame(editingPost.game || "");
    setPlatform(editingPost.platform || "");
    setPlayers(Number(editingPost.playersNeeded) || 1);
    setComments(editingPost.comments || "");
    setMultiplatform(editingPost.multiplatform ?? false);

    const savedSchedule = formatDates.toDate(editingPost.scheduledAt);
    setScheduledState(Boolean(savedSchedule));
    setScheduledAt(savedSchedule);
    setRequiresMic(editingPost.requiresMic ?? null);
    setSkillLevel(editingPost.skillLevel ?? null);
    setLanguage(editingPost.language ?? null);
  }, [editingPost, resetForm]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const gameName =
      typeof game === "string"
        ? game.trim()
        : game?.value?.trim();

    if (
      !gameName ||
      !players ||
      !comments?.trim() ||
      (!multiplatform && !platform)
    ) {
      onError?.(i18n.t("posts:create.errors.incomplete"));
      return;
    }

    // Al editar se acepta la fecha que ya tenía aunque haya pasado; una
    // fecha nueva siempre tiene que ser futura
    const savedSchedule = formatDates.toDate(editingPost?.scheduledAt);
    const scheduleChanged = scheduledAt?.getTime() !== savedSchedule?.getTime();

    if (scheduled && (!scheduledAt || (scheduleChanged && !isFuture(scheduledAt)))) {
      onError?.(i18n.t("posts:create.errors.pastDate"));
      return;
    }

    setLoading(true);

    try {

      let steamAppId = editingPost?.steamAppId ?? null;
      let gameClip = editingPost?.clip ?? null;

      if (game.id && !editingPost) {
        const detail = await getGameDetail(game.id);
        steamAppId = detail.steamAppId ?? steamAppId;
        gameClip = detail.clip ?? gameClip;
      }

      const media = await postService.getExistingMedia(
        gameName
      );

      let image = media.image;
      let clip = media.clip;
      let logo = media.logo;
      let portada = media.portada;

      if (!image) {
        image =
          game.image ??
          editingPost?.image ??
          null;
      }

      if (!clip) {
        clip = gameClip;
      }

      if (!logo) {
        logo = await postService.fetchGameLogo(
          steamAppId,
          gameName
        );
      }

      if (!portada) {
        portada = await postService.fetchGamePortada(
          steamAppId,
          gameName
        );
      }

      const postData = {
        game: gameName,
        platform,
        playersNeeded: players,
        comments,
        image,
        logo: logo ?? editingPost?.logo ?? null,
        clip,
        portada: portada ?? editingPost?.portada ?? null,
        platforms:
          game.platforms ??
          editingPost?.platforms ??
          null,
        multiplatform,
        // null = "ahora mismo"
        scheduledAt: scheduled ? scheduledAt : null,
        requiresMic,
        skillLevel,
        language
      };

      if (editingPost) {

        await postService.updatePost(
          editingPost.id,
          postData
        );

        onSuccess?.("actualizar");

      } else {

        await postService.createPost({
          ...postData,
          userId: user.uid,
          // Excepción intencional a "resolver en vivo": como createdAt, es
          // el contexto de dónde publicó el autor, no su identidad actual
          // (username/avatar sí se leen siempre del perfil). Si después
          // cambia de región, este post sigue en "Cerca de ti" de la
          // región desde la que se publicó.
          authorRegion: authorRegion ?? null
        });

        onSuccess?.("guardar");
      }

      resetForm();

    } catch (error) {

      console.error(
        "Error al guardar publicación:",
        error
      );

      onError?.(
        editingPost
          ? i18n.t("posts:create.errors.update")
          : i18n.t("posts:create.errors.save")
      );

    } finally {
      setLoading(false);
    }

  }, [
    game,
    players,
    comments,
    platform,
    multiplatform,
    scheduled,
    scheduledAt,
    requiresMic,
    skillLevel,
    language,
    editingPost,
    user,
    authorRegion,
    resetForm,
    onSuccess,
    onError
  ]);

  return {
    game,
    setGame,
    players,
    setPlayers,
    comments,
    setComments,
    platform,
    setPlatform,
    multiplatform,
    setMultiplatform,
    scheduled,
    setScheduled,
    scheduledAt,
    setScheduledAt,
    requiresMic,
    setRequiresMic,
    skillLevel,
    setSkillLevel,
    language,
    setLanguage,
    loading,
    resetForm,
    handleSubmit
  };
};