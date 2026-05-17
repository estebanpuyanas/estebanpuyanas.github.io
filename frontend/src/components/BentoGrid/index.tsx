import Terminal from "../Terminal";
import MusicTile from "./MusicTile";
import TravelTile from "./TravelTile";
import ChessTile from "./ChessTile";
import "./index.css";

export default function BentoGrid() {
  return (
    <div className="bento">
      <div className="bento-tile bento-tile--clickable bento-terminal">
        <Terminal />
      </div>
      <MusicTile />
      <TravelTile />
      <ChessTile />
    </div>
  );
}
