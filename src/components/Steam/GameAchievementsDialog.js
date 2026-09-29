import { Dialog } from "primereact/dialog";
import GameAchievements from "./GameAchievements";

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
      onHide={onHide}
      className="gm-dialog"
      maskClassName="gm-dialog-mask"
      style={{ width: "640px" }}
      breakpoints={{ "767px": "94vw" }}
      dismissableMask
      draggable={false}
    >
      {game && (
        <GameAchievements
          game={game}
          steamId={steamId}
        />
      )}
    </Dialog>
  );
}
