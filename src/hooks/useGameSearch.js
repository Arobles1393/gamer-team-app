import { useCallback, useEffect, useRef, useState } from "react";
import { searchGames } from "../utils/searchGames";

export const useGameSearch = () => {
  const [suggestions, setSuggestions] = useState([]);
  const searchTimeout = useRef(null);

  const handleSearch = useCallback((e) => {
    clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchGames(e.query);
        setSuggestions(results);
      } catch (error) {
        console.error("Error al buscar juegos:", error);
        setSuggestions([]);
      }
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(searchTimeout.current);
    };
  }, []);

  return {
    suggestions,
    handleSearch
  };
};