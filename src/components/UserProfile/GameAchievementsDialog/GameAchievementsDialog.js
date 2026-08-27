import { Dialog } from "primereact/dialog";
import GameAchievements from "../../GameArchievements";

export default function GameAchievementsDialog({
  game,
  steamId,
  visible,
  onHide
}) {
  return (
    <Dialog
      header={game?.name}
      visible={visible}
      style={{ width: "700px" }}
      onHide={onHide}
    >
      <GameAchievements
        game={game}
        steamId={steamId}
      />
    </Dialog>
  );
}