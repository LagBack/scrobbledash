import ScrollFloat from '../ScrollFloat/ScrollFloat';
import './StatsSection.css';

export default function StatsSection({ stats }) {
  const items = [
    { value: stats.scrobblesToday, label: 'scrobbles today', highlight: true },
    { value: stats.tracksListened, label: 'tracks listened' },
    { value: stats.artistsListened, label: 'artists listened' },
    { value: stats.albumsListened, label: 'albums listened' },
  ];

  return (
    <section className="app__stats">
      <div className="app__stats-grid">
        {items.map((item, i) => (
          <div key={i} className={`app__stat-card ${item.highlight ? 'app__stat-card--highlight' : ''}`}>
            <ScrollFloat animationDuration={1.2} stagger={0.06}>
              {String(item.value)}
            </ScrollFloat>
            <p className="app__stat-label">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
