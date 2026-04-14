export default function FoodRow({ item, cols }) {
    const isFav = favorites.includes(item.Food);
    const isAvoided = avoids.includes(item.Food);

    return (
      <tr
        className={`food-row ${isFav ? 'row-fav' : ''} ${isAvoided ? 'row-avoid' : ''}`}
        onClick={() => setSelectedFood(item)}
        style={{ cursor: 'pointer' }}
        title="Click to view full nutrition breakdown"
      >
        <td>
          {item.Food}
          {isFav && <span className="row-badge fav-badge">★</span>}
          {isAvoided && <span className="row-badge avoid-badge">⛔</span>}
        </td>
        {cols.includes('category') && <td>{item.Category}</td>}
        {cols.includes('gi') && (
          <td>
            <GIBar gi={item.GI} />
          </td>
        )}
        {cols.includes('gi_category') && (
          <td><span className={`gi-badge ${giColor(item.GI)}`}>{item.GI_category}</span></td>
        )}
        {cols.includes('pcos') && (
          <td>
            <span className="pcos-score-badge" style={{ background: pcosColor(item.PCOS_score) }}>
              {item.PCOS_score}
            </span>
          </td>
        )}
        {cols.includes('warnings') && <td>{item.warnings}</td>}
        {cols.includes('explanation') && (
          <td>
            <PCOSTooltip explanation={item.explanation} />
          </td>
        )}
      </tr>
    );
  }
