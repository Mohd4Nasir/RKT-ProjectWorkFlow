import { Folder, FileText, Briefcase } from 'lucide-react';

// ── Fixed palette ──
const T = {
  navy: '#001858',
  para: '#172c66',
  paraLight: '#5b6aa8',
  pink: '#f582ae',
  peach: '#f3d2c1',
  teal: '#8bd3dd',
  white: '#fffffe',
};

// Sirf 10 nodes
const NETWORK_NODES = [
  { id: 1, x: 34,  y: 65,  size: 40, bg: T.peach,     icon: Folder,    iconColor: T.navy },
  { id: 2, x: 119, y: 105, size: 43, bg: T.pink,      icon: Briefcase, iconColor: '#ffffff' },
  { id: 3, x: 221, y: 84,  size: 32, bg: T.teal,      icon: FileText,  iconColor: T.navy },
  { id: 4, x: 289, y: 140, size: 36, bg: T.paraLight, icon: Folder,    iconColor: T.white },
  { id: 5, x: 77,  y: 182, size: 46, bg: T.peach,     icon: FileText,  iconColor: T.navy },
  { id: 7, x: 153, y: 231, size: 32, bg: T.pink,      icon: Folder,    iconColor: '#ffffff' },
  { id: 8, x: 102, y: 301, size: 67, bg: T.peach,     icon: FileText,  iconColor: T.navy },
  { id: 10, x: 51, y: 350, size: 30, bg: T.paraLight, icon: Folder,    iconColor: T.white },
  { id: 11, x: 153, y: 392, size: 42, bg: T.peach,    icon: FileText,  iconColor: T.navy },
  { id: 12, x: 280, y: 380, size: 35, bg: T.teal,     icon: Briefcase, iconColor: T.navy },
];

// Lines sirf existing nodes ke beech mein
const NETWORK_LINES = [
  [1, 2], [2, 5], [2, 3], [3, 4], [5, 7], [7, 8], [8, 10], [11, 10], [11, 12], [12, 4],
];

type NetworkChainBackgroundProps = {
  opacity?: number;
};

export default function NetworkChainBackground({ opacity = 0.6 }: NetworkChainBackgroundProps) {
  const nodeById = (id: number) => NETWORK_NODES.find((n) => n.id === id)!;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ opacity }}>
      {/* connecting lines */}
      <svg viewBox="0 0 340 420" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <g stroke={T.pink} strokeWidth="1.2" opacity="0.28" strokeDasharray="1 6" strokeLinecap="round">
          {NETWORK_LINES.map(([a, b], i) => {
            const na = nodeById(a);
            const nb = nodeById(b);
            return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} />;
          })}
        </g>
      </svg>

      {/* icon nodes */}
      {NETWORK_NODES.map((n) => {
        const Icon = n.icon;
        return (
          <div
            key={n.id}
            className="absolute rounded-full flex items-center justify-center"
            style={{
              left: n.x,
              top: n.y,
              width: n.size,
              height: n.size,
              backgroundColor: n.bg,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Icon size={Math.round(n.size * 0.5)} color={n.iconColor} />
          </div>
        );
      })}
    </div>
  );
}