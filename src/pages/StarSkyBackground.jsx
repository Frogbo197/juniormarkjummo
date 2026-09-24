import './StarSkyBackground.css'

// Three-layer starfield inspired by Uiverse amir_6539.
export default function StarSkyBackground() {
  return (
    <div className="star-sky-background" aria-hidden="true">
      <div className="stars" />
      <div className="stars2" />
      <div className="stars3" />
    </div>
  )
}
