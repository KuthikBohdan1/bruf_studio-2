/**
 * The studio's mark: a split "B" between two blue rules. The letter takes the
 * text colour, so it follows the theme; the rules stay brand blue.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="278 204 467 616" aria-hidden="true" className={className}>
      <rect x="278" y="204" width="467" height="50" fill="#3d4fe0" />
      <rect x="278" y="770" width="467" height="50" fill="#3d4fe0" />
      <g fill="currentColor">
        <rect x="278" y="275" width="156" height="475" />
        <path
          fillRule="evenodd"
          d="M455 275H585C680 275 735 320 735 395C735 440 712 475 672 492C720 510 745 550 745 610C745 700 680 750 585 750H455ZM455 368H560A43.5 43.5 0 0 1 560 455H455ZM455 538H570A58.5 58.5 0 0 1 570 655H455Z"
        />
      </g>
    </svg>
  )
}
