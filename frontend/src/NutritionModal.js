
export default function NutritionModal({ food, onClose, favorites, avoids, toggleFavorite, toggleAvoid }) {

  if (!food) return null;

  const isFav = favorites.includes(food.Food);
  const isAvoided = avoids.includes(food.Food);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <div>
            <h2 className="modal-title">{food.Food}</h2>
            <span className="modal-category">{food.Category}</span>
          </div>
          <div className="modal-actions">
            <button
              className={`fav-btn ${isFav ? 'active-fav' : ''}`}
              onClick={() => toggleFavorite(food.Food)}
              title={isFav ? 'Remove from favourites' : 'Save as favourite'}
            >
              {isFav ? '★' : '☆'} {isFav ? 'Saved' : 'Favourite'}
            </button>
            <button
              className={`avoid-btn ${isAvoided ? 'active-avoid' : ''}`}
              onClick={() => toggleAvoid(food.Food)}
              title={isAvoided ? 'Remove from avoid list' : 'Flag to avoid'}
            >
              {isAvoided ? '⛔ Avoiding' : '⚑ Avoid'}
            </button>
          </div>
        </div>

        <div className="modal-gi-section">
          <span className="modal-label">Glycemic Index</span>
          <GIBar gi={food.GI} />
          <span className={`gi-badge ${giColor(food.GI)}`}>{giLabel(food.GI)} GI</span>
        </div>

        <div className="modal-nutrients">
          {[
            { label: 'Calories', value: food.Calories, unit: 'kcal' },
            { label: 'Protein', value: food.Protein, unit: 'g' },
            { label: 'Carbs', value: food.Carbs, unit: 'g' },
            { label: 'Fibre', value: food.Fiber, unit: 'g' },
            { label: 'Fat', value: food.Fat, unit: 'g' },
            { label: 'Sat. Fat', value: food['Sat.Fat'], unit: 'g' },
          ].map(({ label, value, unit }) => (
            <div className="nutrient-tile" key={label}>
              <span className="nutrient-value">{value ?? '–'}<span className="nutrient-unit">{unit}</span></span>
              <span className="nutrient-label">{label}</span>
            </div>
          ))}
        </div>

        <div className="modal-score-row">
          <span className="modal-label">PCOS Score</span>
          <span
            className="pcos-score-badge"
            style={{ background: pcosColor(food.PCOS_score) }}
          >
            {food.PCOS_score}
          </span>
        </div>

        {food.warnings && food.warnings !== 'No major concerns' && (
          <div className="modal-warnings">
            <strong>⚠ Warnings</strong>
            <ul>
              {(Array.isArray(food.warnings) ? food.warnings : [food.warnings])
                .map((w, i) => <li key={i}>{w.replace(/\n/g, '')}</li>)}
            </ul>
          </div>
        )}

        {food.explanation && (
          <div className="modal-explanation">
            <strong>Why this scores well</strong>
            <ul>
              {(Array.isArray(food.explanation) ? food.explanation : [food.explanation])
                .map((e, i) => <li key={i}>{e.replace(/\n/g, '')}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

