import GameFrame from "./GameFrame.jsx"

const TEST = { id: "test", title: "Test", url: "games/test.html" }

export default function App() {
  return (
    <>
      <header>
        <a href="#" className="name">
          StudyGames
        </a>
      </header>
      <div className="player">
        <GameFrame game={TEST} />
      </div>
    </>
  )
}
