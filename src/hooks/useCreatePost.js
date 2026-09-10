import { useCallback, useEffect, useState } from "react";
import { functions } from "../firebase/config";
import { httpsCallable } from "firebase/functions";
import { postService } from "../services/posts";
import { getGameDetail } from "../utils/searchGames";

const getGameLogo = httpsCallable(
  functions,
  "getGameLogo"
);

const getGamePortada = httpsCallable(
  functions,
  "getGamePortada"
);

export const useCreatePost = ({
  user,
  editingPost,
  onSuccess,
  onError
}) => {

  const [game, setGame] = useState({});
  const [players, setPlayers] = useState("");
  const [comments, setComments] = useState("");
  const [platform, setPlatform] = useState("");
  const [multiplatform, setMultiplatform] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setGame({});
    setPlayers("");
    setComments("");
    setPlatform("");
    setMultiplatform(false);
  }, []);

  useEffect(() => {
    if (!editingPost) {
      resetForm();
      return;
    }

    setGame(editingPost.game || "");
    setPlatform(editingPost.platform || "");
    setPlayers(editingPost.playersNeeded || "");
    setComments(editingPost.comments || "");
    setMultiplatform(editingPost.multiplatform ?? false);
  }, [editingPost, resetForm]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (
      !game ||
      !players ||
      !comments?.trim() ||
      (!multiplatform && !platform)
    ) {
      onError?.("Completa todos los campos");
      return;
    }

    setLoading(true);

    try {

      const gameName = game.value ?? game;

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
        const result = await getGameLogo({
          steamAppId,
          gameName
        });

        logo = result?.data?.logo ?? null;
      }

      if (!portada) {
        const result = await getGamePortada({
          steamAppId,
          gameName
        });

        portada = result?.data?.portada ?? null;
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
        multiplatform
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
          createdAt: new Date()
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
          ? "No se pudo actualizar la publicación"
          : "No se pudo guardar la publicación"
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
    editingPost,
    user,
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
    loading,
    resetForm,
    handleSubmit
  };
};