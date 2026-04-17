import { useState } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { AutoComplete } from "primereact/autocomplete";
import { searchGames } from "../utils/searchGames";

export default function CreatePost({ user, userData, onClose }) {
  const [game, setGame] = useState({});
  const [players, setPlayers] = useState("");
  const [comments, setComments] = useState("");
  const [platform, setPlatform] = useState("");
  //const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  //const [isSticky, setIsSticky] = useState(false);
  const platforms = [
    { label: "PlayStation", value: "playstation" },
    { label: "Xbox", value: "xbox" },
    { label: "Switch", value: "switch" },
    { label: "PC", value: "pc" },
    { label: "Mobile", value: "mobile" }
  ];

  /*useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 150);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);*/

  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
      if (!game.value || !players || !comments || !platform) {
        alert("Completa todos los campos");
        return;
      }
      let image = await getExistingImage(game.value);
      if (!image) {
        image = game.image
      }
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        username: userData?.username,
        game: game.value,
        playersNeeded: players,
        image: image || null,
        phone: userData?.phone,
        createdAt: new Date(),
        comments,
        platform
      });

      setGame({});
      setPlayers("");
      setComments("");
      setPlatform("")
      onClose();
      alert("Publicación creada 🚀");
    }catch (error) {
        console.error("Error:", error);
    }
  };

  const getExistingImage = async (game) => {
    const q = query(collection(db, "posts"), where("game", "==", game));

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].data().image;
    }

    return null;
  };

  let timeout = null;

  const handleSearch = async (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      const results = await searchGames(e.query);
      setSuggestions(results);
    }, 300);
  };

  const itemTemplate = (item) => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <img
        src={item.image}
        alt={item.label}
        style={{ width: "40px", borderRadius: "6px" }}
      />
      <span>{item.label}</span>
    </div>
  );

  const cancel = () => {
    setGame({});
    setPlayers("");
    setComments("");
    setPlatform("")
    onClose();
  }

  /*if (!isOpen) {
    return (
      <Card style={{ marginBottom: "1rem", borderRadius: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>🎮 ¿Buscas equipo?</h3>
            <p style={{ marginTop: 20, color: "#666" }}>
              Publica una partida y encuentra jugadores rapidamente.
            </p>
          </div>
          <Button
            label="Publicar"
            icon="pi pi-plus"
            onClick={() => setIsOpen(true)}
          />
        </div>
      </Card>
    );
  }*/

  return (
    <Card style={{ marginTop: "1.2rem", borderRadius: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ marginTop: -15, color: "#666", textAlign:"center" }}>
              ¿Buscas equipo? Publica una partida y encuentra jugadores rapidamente.
            </p>
      </div>
      <div className="p-fluid" style={{ marginTop: "1rem" }}>
        {/* Inputs en fila */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <AutoComplete
            value={game}
            suggestions={suggestions}
            completeMethod={handleSearch}
            onChange={(e) => setGame(e.value)}
            field="label"
            itemTemplate={itemTemplate}
            placeholder="Nombre del juego"
            style={{ flex: 1 }}
          />
          <Dropdown
            value={platform}
            options={platforms}
            onChange={(e) => setPlatform(e.value)}
            placeholder="Selecciona plataforma"
            style={{ width: "200px" }}
          />
          <InputText
            placeholder="Cant. jugadores"
            value={players}
            onChange={(e) => setPlayers(e.target.value)}
            style={{ width: "120px" }}
          />
        </div>
        {/* Descripción */}
        <InputTextarea
          placeholder="Describe tu partida..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          autoResize
          style={{ marginBottom: "1rem" }}
        />
        {/* Botones */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            label="Publicar"
            icon="pi pi-check"
            onClick={handleSubmit}
            className="p-button-success"
          />
          <Button
            label="Cancelar"
            className="p-button-text"
            onClick={cancel}
            //onClick={() => setIsOpen(false)}
          />
        </div>
      </div>
    </Card>
  );
}